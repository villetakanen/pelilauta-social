/**
 * A bespoke, limited Firestore/Auth reset for the onboarding-callout-transition
 * regression, in place of the retired suite's full `init-test-db.js`.
 *
 * It restores exactly three documents, by explicit id:
 *   - account/<memberUid>   (src/schemas/AccountSchema.ts)
 *   - profiles/<memberUid>  (src/schemas/ProfileSchema.ts)
 *   - stream/<THREAD_KEY>   (src/schemas/ThreadSchema.ts)
 *
 * `<memberUid>` is resolved from the existing Auth account for `existingUser`
 * (credentials.ts) rather than hardcoded, so the Auth account itself is never
 * created, deleted, or otherwise touched here — only looked up.
 *
 * Safety is the point of this script, not a formality:
 *   1. The service account at the repository root must belong to
 *      `skaldbase-test`.
 *   2. The application's own `.env` must declare `skaldbase-test`.
 *   3. The *running* dev server (the one the regression spec will drive) must
 *      itself report `skaldbase-test` through its existing
 *      `/api/test/firebase-config` endpoint.
 *   4. That same running server must report the repository's own version, so
 *      a stale dev process — one that never picked up the current checkout —
 *      refuses instead of giving misleading pass evidence.
 * Any mismatch, or the server not answering at all, refuses before a single
 * Firestore call is made.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { existingUser } from '../../../credentials.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../../..');

const REQUIRED_PROJECT_ID = 'skaldbase-test';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

// Explicit fixture ids. The member's uid is resolved below, not hardcoded.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const MEMBER_EMAIL = existingUser.email; // credentials.ts, the same identity the spec logs in as

function refuse(reason) {
  console.error(`Refusing to reset fixtures: ${reason}`);
  process.exit(1);
}

// --- Safety check 1: the service account targets skaldbase-test. ---------
const serviceAccountPath = join(repoRoot, 'server_principal.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  refuse(
    `could not read ${serviceAccountPath} (${error.message}). This script never falls back to another credential source.`,
  );
}
if (serviceAccount.project_id !== REQUIRED_PROJECT_ID) {
  refuse(
    `server_principal.json targets project "${serviceAccount.project_id}", not "${REQUIRED_PROJECT_ID}".`,
  );
}

// --- Safety check 2: the application's own .env targets skaldbase-test. --
config({ path: join(__dirname, '../.env') });
if (process.env.PUBLIC_projectId !== REQUIRED_PROJECT_ID) {
  refuse(
    `apps/pelilauta/.env declares PUBLIC_projectId="${process.env.PUBLIC_projectId}", not "${REQUIRED_PROJECT_ID}".`,
  );
}

// --- Safety check 3: the running application itself reports the test project. ---
// This is the same running dev server the regression spec drives, so a
// stale process left over from another environment refuses here rather than
// having its fixtures rewritten.
let liveConfig;
try {
  const response = await fetch(`${BASE_URL}/api/test/firebase-config`);
  if (!response.ok) {
    refuse(
      `${BASE_URL}/api/test/firebase-config responded ${response.status}. Start the dev server against skaldbase-test before resetting fixtures.`,
    );
  }
  liveConfig = await response.json();
} catch (error) {
  refuse(
    `could not reach ${BASE_URL}/api/test/firebase-config (${error.message}). Start the dev server before resetting fixtures.`,
  );
}
if (liveConfig.projectId !== REQUIRED_PROJECT_ID) {
  refuse(
    `the running application reports projectId="${liveConfig.projectId}", not "${REQUIRED_PROJECT_ID}".`,
  );
}

// --- Safety check 4: the running application matches the repository's version. ---
// A dev server left running across a checkout switch or a merge would
// otherwise pass checks 1-3 while exercising stale code, giving a pass that
// says nothing about the current commit.
const rootPackageJsonPath = join(repoRoot, 'package.json');
let repoVersion;
try {
  repoVersion = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8')).version;
} catch (error) {
  refuse(`could not read ${rootPackageJsonPath} (${error.message}).`);
}
if (liveConfig.version !== repoVersion) {
  refuse(
    `the running application reports version="${liveConfig.version}", but the repository's package.json declares "${repoVersion}". Restart the dev server against this checkout before resetting fixtures.`,
  );
}

console.log(
  `Verified skaldbase-test end to end: service account, .env, the running application, and its version all agree. Proceeding.`,
);

// --- Only now: initialize Admin SDK and mutate. ---------------------------
const serverApp = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.PUBLIC_databaseURL,
});
const serverDB = getFirestore(serverApp);
const serverAuth = getAuth(serverApp);

// Resolve, never create or delete, the dedicated member's Auth account.
let member;
try {
  member = await serverAuth.getUserByEmail(MEMBER_EMAIL);
} catch (error) {
  refuse(
    `no Auth account for ${MEMBER_EMAIL} in ${REQUIRED_PROJECT_ID} (${error.message}). This script does not create Auth accounts; provision it once, by hand, in the test project.`,
  );
}
const memberUid = member.uid;

// account/<memberUid> — src/schemas/AccountSchema.ts (collection name 'account').
// A full overwrite (no merge): every reset run leaves this document in
// exactly the intended shape, with nothing inherited from a previous run or
// an earlier fixture shape. `eulaAccepted` and `uid` are AccountSchema's
// only required fields; the rest are optional there.
await serverDB.collection('account').doc(memberUid).set({
  uid: memberUid,
  eulaAccepted: true,
  updatedAt: FieldValue.serverTimestamp(),
});
console.log(`Restored account/${memberUid}`);

// profiles/<memberUid> — src/schemas/ProfileSchema.ts. Also a full overwrite.
// `key` and `username` are ProfileSchema's other required fields; both
// `parseProfile` call sites (activeProfilesStore.ts, session/profile.ts,
// api/profiles/[uid].json.ts) supply `key` from the document id and derive
// `username` from `nick` when absent, but they are written explicitly here
// so this document is valid against ProfileSchema on its own, without
// relying on read-side derivation.
await serverDB.collection('profiles').doc(memberUid).set({
  key: memberUid,
  uid: memberUid,
  username: 'e2e-regression-member',
  nick: 'E2E Regression Member',
  avatarURL: '',
});
console.log(`Restored profiles/${memberUid}`);

// stream/<THREAD_KEY> — src/schemas/ThreadSchema.ts (collection name 'stream').
// `public: true` and the timestamps are all `/api/threads.json` and
// `/api/threads/[threadKey].json` need; no channel metadata is read by either
// route, so none is seeded.
await serverDB
  .collection('stream')
  .doc(THREAD_KEY)
  .set({
    title: 'E2E onboarding regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the onboarding-callout-transition regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    flowTime: FieldValue.serverTimestamp(),
    replyCount: 0,
    lovedCount: 0,
  });
console.log(`Restored stream/${THREAD_KEY}`);

console.log('Fixture reset complete.');
