/**
 * Resets the acceptance-testing Firestore project and writes the default seed.
 *
 * `docs/ACCEPTANCE_TESTING.md` states the model, `docs/acceptance-testing-seed.md`
 * lists the documents. Run with:
 *
 *   node --import tests/e2e/pelilauta/schema-resolver-loader.mjs \
 *     tests/e2e/pelilauta/reset-and-seed.ts
 *
 * The `--import` loads a module-resolution hook so this script can import the
 * application's own zod schemas without Astro's Vite build; see that file for
 * why. The script connects with the repository-root service principal, refuses
 * to run against any project but the test project, and otherwise:
 *
 * 1. deletes every document in the collections named in RESET_COLLECTIONS;
 * 2. checks the three example accounts exist in Auth, creating a missing one;
 * 3. uploads the seed's binary assets and resolves their placeholders;
 * 4. parses and writes every document under `seed/`, through the application's
 *    own schemas.
 */
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import {
  ACCOUNTS_COLLECTION_NAME,
  parseAccount,
} from 'src/schemas/AccountSchema';
import { AppMetaSchema } from 'src/schemas/AppMetaSchema';
import { parseChannel } from 'src/schemas/ChannelSchema';
import { PAGES_COLLECTION_NAME, parsePage } from 'src/schemas/PageSchema';
import {
  PROFILES_COLLECTION_NAME,
  parseProfile,
} from 'src/schemas/ProfileSchema';
import { REACTIONS_COLLECTION_NAME } from 'src/schemas/ReactionsSchema';
import { SITES_COLLECTION_NAME, SiteSchema } from 'src/schemas/SiteSchema';

// biome-ignore lint/suspicious/noExplicitAny: seed documents are untyped JSON, validated by the app's own schemas below.
type SeedDoc = Record<string, any>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');
const seedDir = join(__dirname, 'seed');
const assetsDir = join(seedDir, 'assets');

const TEST_PROJECT_ID = 'skaldbase-test';
const META_COLLECTION_NAME = 'meta';

// The collections a reset wipes. A collection joins this list when a spec
// writes to it, per `docs/ACCEPTANCE_TESTING.md`.
const RESET_COLLECTIONS = [SITES_COLLECTION_NAME, REACTIONS_COLLECTION_NAME];

function readSeedJson(filename: string): SeedDoc {
  return JSON.parse(readFileSync(join(seedDir, filename), 'utf8'));
}

function collectAssetRefs(
  value: unknown,
  refs: Map<string, string | undefined>,
): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectAssetRefs(entry, refs);
    return;
  }
  if (value && typeof value === 'object') {
    const obj = value as SeedDoc;
    const storagePath =
      typeof obj.storagePath === 'string' ? obj.storagePath : undefined;
    for (const entry of Object.values(obj)) {
      if (typeof entry === 'string') {
        const match = entry.match(/^@asset:(.+)$/);
        if (match) {
          const filename = match[1];
          if (storagePath || !refs.has(filename)) {
            refs.set(filename, storagePath ?? refs.get(filename));
          }
        }
      }
      collectAssetRefs(entry, refs);
    }
  }
}

async function main() {
  loadEnv({ path: join(repoRoot, 'apps/pelilauta/.env') });

  const serviceAccount = JSON.parse(
    readFileSync(join(repoRoot, 'server_principal.json'), 'utf8'),
  );
  if (serviceAccount.project_id !== TEST_PROJECT_ID) {
    console.error(
      `Refusing to run: server_principal.json targets "${serviceAccount.project_id}", not "${TEST_PROJECT_ID}".`,
    );
    process.exit(1);
  }

  const credentials = await import(
    pathToFileURL(join(repoRoot, 'credentials.ts')).href
  );
  const { existingUser, newUser, adminUser } = credentials;

  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.PUBLIC_databaseURL,
    storageBucket: process.env.PUBLIC_storageBucket,
  });
  const db = getFirestore(app);
  const auth = getAuth(app);
  const bucket = getStorage(app).bucket();

  // --- Accounts: persist in Auth between runs; create only a missing one ---
  async function getOrCreateUser(email: string, password: string) {
    try {
      const user = await auth.getUserByEmail(email);
      return user.uid;
    } catch {
      const user = await auth.createUser({ email, password });
      console.log(`Created Auth account for ${email}: ${user.uid}`);
      return user.uid;
    }
  }

  const existingUid = await getOrCreateUser(
    existingUser.email,
    existingUser.password,
  );
  const newUid = await getOrCreateUser(newUser.email, newUser.password);
  const adminUid = await getOrCreateUser(adminUser.email, adminUser.password);

  // Registration starts clean; this is the one Auth state a run writes.
  await auth.setCustomUserClaims(newUid, {});

  console.log('Accounts ready:', {
    existingUser: existingUid,
    newUser: newUid,
    adminUser: adminUid,
  });

  // --- Reset: recursively wipe the named collections ---
  for (const collectionName of RESET_COLLECTIONS) {
    await db.recursiveDelete(db.collection(collectionName));
    console.log(`Reset collection: ${collectionName}`);
  }

  // --- Load the seed, upload its assets, resolve every placeholder ---
  const accountRaw = readSeedJson('account.json');
  const profilesRaw = readSeedJson('profiles.json');
  const sitesRaw = readSeedJson('sites.json');
  const pagesRaw = readSeedJson('pages.json');
  const metaRaw = readSeedJson('meta.json');

  const assetRefs = new Map<string, string | undefined>();
  for (const doc of [accountRaw, profilesRaw, sitesRaw, pagesRaw, metaRaw]) {
    collectAssetRefs(doc, assetRefs);
  }

  const assetUrlMap = new Map<string, string>();
  for (const [filename, storagePath] of assetRefs) {
    const destination = storagePath ?? `SeedAssets/${filename}`;
    const token = randomUUID();
    await bucket.upload(join(assetsDir, filename), {
      destination,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`;
    assetUrlMap.set(filename, url);
    console.log(`Uploaded asset: ${filename} -> ${destination}`);
  }

  const now = Date.now();
  const uidByPlaceholder: Record<string, string> = {
    '@existingUser': existingUid,
    '@newUser': newUid,
    '@adminUser': adminUid,
  };

  function resolveString(value: string): string | number {
    if (value in uidByPlaceholder) return uidByPlaceholder[value];
    if (value === '@now') return now;
    const assetMatch = value.match(/^@asset:(.+)$/);
    if (assetMatch) {
      const url = assetUrlMap.get(assetMatch[1]);
      if (!url) {
        throw new Error(`No uploaded asset found for ${value}`);
      }
      return url;
    }
    return value;
  }

  function resolveDeep(value: unknown): unknown {
    if (typeof value === 'string') return resolveString(value);
    if (Array.isArray(value)) return value.map(resolveDeep);
    if (value && typeof value === 'object') {
      const out: SeedDoc = {};
      for (const [key, entry] of Object.entries(value as SeedDoc)) {
        out[resolveString(key)] = resolveDeep(entry);
      }
      return out;
    }
    return value;
  }

  // --- Write every document, through the application's own schemas ---
  const accounts = resolveDeep(accountRaw) as SeedDoc;
  for (const [uid, data] of Object.entries(accounts)) {
    await db
      .collection(ACCOUNTS_COLLECTION_NAME)
      .doc(uid)
      .set(parseAccount(data, uid));
  }
  console.log(`Wrote ${Object.keys(accounts).length} account document(s).`);

  const profiles = resolveDeep(profilesRaw) as SeedDoc;
  for (const [uid, data] of Object.entries(profiles)) {
    await db
      .collection(PROFILES_COLLECTION_NAME)
      .doc(uid)
      .set(parseProfile(data, uid));
  }
  console.log(`Wrote ${Object.keys(profiles).length} profile document(s).`);

  const sites = resolveDeep(sitesRaw) as SeedDoc;
  for (const [key, data] of Object.entries(sites)) {
    await db
      .collection(SITES_COLLECTION_NAME)
      .doc(key)
      .set(SiteSchema.parse(data));
  }
  console.log(`Wrote ${Object.keys(sites).length} site document(s).`);

  const pages = resolveDeep(pagesRaw) as SeedDoc;
  for (const [compoundKey, data] of Object.entries(pages)) {
    const [siteKey, pageKey] = compoundKey.split('/');
    await db
      .collection(SITES_COLLECTION_NAME)
      .doc(siteKey)
      .collection(PAGES_COLLECTION_NAME)
      .doc(pageKey)
      .set(parsePage(data, pageKey, siteKey));
  }
  console.log(`Wrote ${Object.keys(pages).length} page document(s).`);

  const meta = resolveDeep(metaRaw) as SeedDoc;
  await db
    .collection(META_COLLECTION_NAME)
    .doc('pelilauta')
    .set(AppMetaSchema.parse(meta.pelilauta));
  const topics = (meta.threads.topics as SeedDoc[]).map((topic) =>
    parseChannel(topic),
  );
  await db.collection(META_COLLECTION_NAME).doc('threads').set({ topics });
  console.log('Wrote meta/pelilauta and meta/threads.');

  // Assets not referenced by any seed document (an upload-journey fixture)
  // stay in seed/assets/ and are not uploaded here.
  const unreferenced = readdirSync(assetsDir).filter(
    (file) =>
      file !== 'provenance.md' && !assetRefs.has(file) && !file.startsWith('.'),
  );
  if (unreferenced.length > 0) {
    console.log('Left for a spec to upload:', unreferenced.join(', '));
  }

  console.log('Reset and seed complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
