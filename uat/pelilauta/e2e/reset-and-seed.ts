/**
 * Resets the acceptance testing Firestore project and writes the default seed.
 *
 * `docs/ACCEPTANCE_TESTING.md` defines the testing model and `docs/acceptance-testing-seed.md` lists seed documents.
 *
 * Execute with:
 *
 *   node --import ./uat/pelilauta/e2e/schema-resolver-loader.mjs \
 *     ./uat/pelilauta/e2e/reset-and-seed.ts
 *
 * The `--import` argument loads a module resolution hook that imports Zod schemas without Vite. The script authenticates using `server_principal.json`, verifies the test project ID, and executes the reset:
 *
 * 1. Validates seed documents in `seed-model.ts` using a dry-run asset map.
 * 2. Deletes existing documents across collections in `RESET_COLLECTIONS`.
 * 3. Ensures the three example accounts exist in Firebase Auth.
 * 4. Uploads binary assets to Firebase Storage and resolves asset URLs.
 * 5. Revalidates seed data with resolved URLs and writes documents and the derived tag index to Firestore.
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

import { NOTIFICATION_FIRESTORE_COLLECTION } from 'src/schemas/NotificationSchema';
import { REACTIONS_COLLECTION_NAME } from 'src/schemas/ReactionsSchema';
import {
  ACCOUNTS_COLLECTION_NAME,
  buildSeedModel,
  collectAssetRefs,
  PAGES_COLLECTION_NAME,
  type PlaceholderMap,
  PROFILES_COLLECTION_NAME,
  type RawSeed,
  REPLIES_COLLECTION,
  SITES_COLLECTION_NAME,
  TAG_FIRESTORE_COLLECTION,
  THREADS_COLLECTION_NAME,
} from './seed-model';

// biome-ignore lint/suspicious/noExplicitAny: seed documents are untyped JSON validated by application schemas.
type SeedDoc = Record<string, any>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');
const seedDir = join(__dirname, 'seed');
const assetsDir = join(seedDir, 'assets');

const TEST_PROJECT_ID = 'skaldbase-test';
const META_COLLECTION_NAME = 'meta';

// Collections cleared during reset per docs/ACCEPTANCE_TESTING.md.
const RESET_COLLECTIONS = [
  SITES_COLLECTION_NAME,
  REACTIONS_COLLECTION_NAME,
  THREADS_COLLECTION_NAME,
  TAG_FIRESTORE_COLLECTION,
  NOTIFICATION_FIRESTORE_COLLECTION,
];

function readSeedJson(filename: string): SeedDoc {
  return JSON.parse(readFileSync(join(seedDir, filename), 'utf8'));
}

function readRawSeed(): RawSeed {
  return {
    account: readSeedJson('account.json'),
    profiles: readSeedJson('profiles.json'),
    sites: readSeedJson('sites.json'),
    pages: readSeedJson('pages.json'),
    threads: readSeedJson('threads.json'),
    replies: readSeedJson('replies.json'),
    meta: readSeedJson('meta.json'),
  };
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
  db.settings({ ignoreUndefinedProperties: true });
  const auth = getAuth(app);
  const bucket = getStorage(app).bucket();

  const bucketProjectId = bucket.name.split('.')[0];
  if (bucketProjectId !== TEST_PROJECT_ID) {
    console.error(
      `Refusing to upload: Storage bucket "${bucket.name}" does not belong to "${TEST_PROJECT_ID}".`,
    );
    process.exit(1);
  }

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

  console.log('Accounts ready:', {
    existingUser: existingUid,
    newUser: newUid,
    adminUser: adminUid,
  });

  const uidByPlaceholder: Record<string, string> = {
    '@existingUser': existingUid,
    '@newUser': newUid,
    '@adminUser': adminUid,
  };
  const now = Date.now();

  // --- Validate the whole seed, before anything is deleted or uploaded ---
  const rawSeed = readRawSeed();
  const assetRefs = new Map<string, string | undefined>();
  for (const doc of Object.values(rawSeed)) {
    collectAssetRefs(doc, assetRefs);
  }

  // A dry-run asset map resolves the `@asset:` placeholders without touching
  // Storage. The real URLs replace them after the upload, below.
  const dryAssetUrlMap = new Map<string, string>(
    [...assetRefs.keys()].map((filename) => [filename, `dry-run:${filename}`]),
  );

  try {
    buildSeedModel(rawSeed, {
      uidByPlaceholder,
      assetUrlMap: dryAssetUrlMap,
      now,
    } satisfies PlaceholderMap);
  } catch (error) {
    console.error('Seed validation failed:', error);
    process.exit(1);
  }
  console.log('Seed validated.');

  // Registration starts clean; this is the one Auth state a run writes.
  await auth.setCustomUserClaims(newUid, {});
  await db.collection(ACCOUNTS_COLLECTION_NAME).doc(newUid).delete();
  await db.collection(PROFILES_COLLECTION_NAME).doc(newUid).delete();

  // --- Reset: recursively wipe the named collections ---
  for (const collectionName of RESET_COLLECTIONS) {
    await db.recursiveDelete(db.collection(collectionName));
    console.log(`Reset collection: ${collectionName}`);
  }

  // --- Upload the seed's binary assets, and resolve their placeholders ---
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

  // --- Write every document, through the application's own schemas ---
  const seedModel = buildSeedModel(rawSeed, {
    uidByPlaceholder,
    assetUrlMap,
    now,
  } satisfies PlaceholderMap);

  for (const [uid, data] of Object.entries(seedModel.accounts)) {
    await db.collection(ACCOUNTS_COLLECTION_NAME).doc(uid).set(data);
  }
  console.log(
    `Wrote ${Object.keys(seedModel.accounts).length} account document(s).`,
  );

  for (const [uid, data] of Object.entries(seedModel.profiles)) {
    await db.collection(PROFILES_COLLECTION_NAME).doc(uid).set(data);
  }
  console.log(
    `Wrote ${Object.keys(seedModel.profiles).length} profile document(s).`,
  );

  for (const [key, data] of Object.entries(seedModel.sites)) {
    await db.collection(SITES_COLLECTION_NAME).doc(key).set(data);
  }
  console.log(`Wrote ${Object.keys(seedModel.sites).length} site document(s).`);

  for (const [compoundKey, data] of Object.entries(seedModel.pages)) {
    const [siteKey, pageKey] = compoundKey.split('/');
    await db
      .collection(SITES_COLLECTION_NAME)
      .doc(siteKey)
      .collection(PAGES_COLLECTION_NAME)
      .doc(pageKey)
      .set(data);
  }
  console.log(`Wrote ${Object.keys(seedModel.pages).length} page document(s).`);

  for (const [key, data] of Object.entries(seedModel.threads)) {
    await db.collection(THREADS_COLLECTION_NAME).doc(key).set(data);
  }
  console.log(
    `Wrote ${Object.keys(seedModel.threads).length} thread document(s).`,
  );

  for (const [compoundKey, data] of Object.entries(seedModel.replies)) {
    const [threadKey, replyKey] = compoundKey.split('/');
    await db
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey)
      .collection(REPLIES_COLLECTION)
      .doc(replyKey)
      .set(data);
  }
  console.log(
    `Wrote ${Object.keys(seedModel.replies).length} reply document(s).`,
  );

  await db
    .collection(META_COLLECTION_NAME)
    .doc('pelilauta')
    .set(seedModel.appMeta);
  await db
    .collection(META_COLLECTION_NAME)
    .doc('threads')
    .set({ topics: seedModel.channels });
  console.log('Wrote meta/pelilauta and meta/threads.');

  for (const [docId, tag] of Object.entries(seedModel.tags)) {
    await db.collection(TAG_FIRESTORE_COLLECTION).doc(docId).set(tag);
  }
  console.log(`Wrote ${Object.keys(seedModel.tags).length} tag document(s).`);

  // Filters unreferenced fixture files preserved for upload specs.
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
