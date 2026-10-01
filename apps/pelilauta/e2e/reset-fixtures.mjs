/**
 * A bespoke, limited Firestore/Auth reset for the app feature regression
 * suite (e2e/README.md), in place of the retired suite's full
 * `init-test-db.js`.
 *
 * It restores, by explicit id:
 *   - account/<memberUid>                          (src/schemas/AccountSchema.ts)
 *   - profiles/<memberUid>                          (src/schemas/ProfileSchema.ts)
 *   - stream/<THREAD_KEY>                           (src/schemas/ThreadSchema.ts)
 *   - stream/<REPLY_THREAD_KEY>                     (src/schemas/ThreadSchema.ts)
 *   - stream/<REPLY_THREAD_KEY>/comments/<REPLY_1_KEY> (src/schemas/ReplySchema.ts)
 *   - stream/<REPLY_THREAD_KEY>/comments/<REPLY_2_KEY>, carrying one image attachment
 *   - stream/<NO_PROFILE_THREAD_KEY>                — owned by an uid with no profiles document
 *   - stream/<ANON_LIVE_THREAD_KEY>                 (src/schemas/ThreadSchema.ts)
 *   - stream/<ANON_LIVE_THREAD_KEY>/comments/<ANON_LIVE_REPLY_KEY>
 *   - stream/<MALFORMED_THREAD_KEY>                 (src/schemas/ThreadSchema.ts)
 *   - stream/<MALFORMED_THREAD_KEY>/comments/<MALFORMED_VALID_REPLY_KEY>
 *   - stream/<MALFORMED_THREAD_KEY>/comments/<MALFORMED_REPLY_KEY> — fails ReplySchema on purpose
 *   - stream/<EMPTY_THREAD_KEY>                     — no replies
 *
 * and deletes, by explicit id, to guarantee their absence at the start of a run:
 *   - profiles/<NO_PROFILE_AUTHOR_UID>
 *   - stream/<ANON_LIVE_THREAD_KEY>/comments/<ANON_LIVE_NEW_REPLY_KEY> — written mid-test by
 *     anonymous-visitor-live-reading.spec.ts itself, through the Admin SDK, to
 *     simulate another author publishing while the reader's page stays open
 *
 * `<memberUid>` is resolved from the existing Auth account for `existingUser`
 * (credentials.ts) rather than hardcoded, so the Auth account itself is never
 * created, deleted, or otherwise touched here — only looked up.
 * `NO_PROFILE_AUTHOR_UID` is a literal id with no corresponding Auth account:
 * nothing reads it through Auth, only through `profiles/`, so none is needed.
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
// Matches e2e/initial-reply-render.spec.ts's REPLY_THREAD_KEY and reply keys.
// Also reused by compose-thread-page.spec.ts (a thread with replies, read by
// a signed-in reader) and resolve-session-after-render.spec.ts (server-
// rendered replies the client subscribes to once the session resolves).
const REPLY_THREAD_KEY = 'e2e-initial-reply-render-thread';
const REPLY_1_KEY = 'e2e-reply-1';
// Carries an attached image, for initial-reply-render.spec.ts's attachment
// assertion.
const REPLY_2_KEY = 'e2e-reply-2';
const REPLY_2_IMAGE_URL =
  'https://storage.googleapis.com/skaldbase-test.appspot.com/e2e-fixtures/reply-attachment.jpg';

// no-profile-author-reads.spec.ts: a thread whose owner uid resolves to no
// profiles document at all — never a real Auth account, so nothing provisions
// or removes one.
const NO_PROFILE_THREAD_KEY = 'e2e-no-profile-author-thread';
const NO_PROFILE_AUTHOR_UID = 'e2e-ghost-author-uid';

// anonymous-visitor-live-reading.spec.ts: an anonymous, JavaScript-enabled
// reader must open no Firestore subscription. ANON_LIVE_NEW_REPLY_KEY is
// deleted on every reset, never created here — the spec itself writes it
// mid-test, through the Admin SDK, to simulate another author publishing
// while the reader's page is open.
const ANON_LIVE_THREAD_KEY = 'e2e-anon-visitor-thread';
const ANON_LIVE_REPLY_KEY = 'e2e-anon-visitor-reply-1';
const ANON_LIVE_NEW_REPLY_KEY = 'e2e-anon-visitor-new-reply';

// malformed-reply-render.spec.ts: isolated on its own thread, per
// e2e/README.md — a malformed record marks its whole thread `incomplete`
// forever, so it never shares a thread with another spec's assertions.
const MALFORMED_THREAD_KEY = 'e2e-malformed-reply-thread';
const MALFORMED_VALID_REPLY_KEY = 'e2e-malformed-thread-valid-reply';
// Fails ReplySchema's `owners` minimum (at least one entry) on purpose.
const MALFORMED_REPLY_KEY = 'e2e-malformed-reply';

// latest-reply-navigation.spec.ts: the "no replies" half of "Reach the latest
// reply" needs a thread whose latest-reply control targets the discussion
// heading instead of a reply.
const EMPTY_THREAD_KEY = 'e2e-empty-discussion-thread';

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

// stream/<REPLY_THREAD_KEY> and its two replies — for
// initial-reply-render.spec.ts, which asserts the replies render in the
// initial document, with JavaScript disabled. Reusing `memberUid` as the
// author lets the spec assert on the profile already restored above.
await serverDB
  .collection('stream')
  .doc(REPLY_THREAD_KEY)
  .set({
    title: 'E2E initial reply render regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the initial-reply-render regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    flowTime: FieldValue.serverTimestamp(),
    replyCount: 2,
    lovedCount: 0,
  });
console.log(`Restored stream/${REPLY_THREAD_KEY}`);

const repliesCollection = serverDB
  .collection('stream')
  .doc(REPLY_THREAD_KEY)
  .collection('comments');

await repliesCollection.doc(REPLY_1_KEY).set({
  markdownContent: 'The first seeded reply body.',
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 1,
});
await repliesCollection.doc(REPLY_2_KEY).set({
  markdownContent: 'The second seeded reply body.',
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 2,
  images: [{ url: REPLY_2_IMAGE_URL, alt: 'A seeded attachment image.' }],
});
console.log(
  `Restored stream/${REPLY_THREAD_KEY}/comments/${REPLY_1_KEY} and .../${REPLY_2_KEY}`,
);

// stream/<NO_PROFILE_THREAD_KEY> — src/schemas/ThreadSchema.ts. Owned by
// NO_PROFILE_AUTHOR_UID, for which no profiles/ document is ever written, so
// getPublicProfiles resolves no attribution and the thread page falls back
// to the anonymous-author label.
await serverDB
  .collection('stream')
  .doc(NO_PROFILE_THREAD_KEY)
  .set({
    title: 'E2E no-profile author regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the no-profile-author-reads regression.',
    channel: 'yleinen',
    owners: [NO_PROFILE_AUTHOR_UID],
    author: NO_PROFILE_AUTHOR_UID,
    public: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    flowTime: FieldValue.serverTimestamp(),
    replyCount: 0,
    lovedCount: 0,
  });
// Defensive: guarantees NO_PROFILE_AUTHOR_UID resolves to no profile even if
// a previous, differently shaped run left one behind.
await serverDB.collection('profiles').doc(NO_PROFILE_AUTHOR_UID).delete();
console.log(
  `Restored stream/${NO_PROFILE_THREAD_KEY} and confirmed profiles/${NO_PROFILE_AUTHOR_UID} is absent`,
);

// stream/<ANON_LIVE_THREAD_KEY> and its one reply — for
// anonymous-visitor-live-reading.spec.ts. ANON_LIVE_NEW_REPLY_KEY is deleted,
// never written, so the spec starts from a thread the simulated "new reply"
// has not yet reached.
await serverDB
  .collection('stream')
  .doc(ANON_LIVE_THREAD_KEY)
  .set({
    title: 'E2E anonymous visitor regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the anonymous-visitor-live-reading regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    flowTime: FieldValue.serverTimestamp(),
    replyCount: 1,
    lovedCount: 0,
  });
const anonLiveReplies = serverDB
  .collection('stream')
  .doc(ANON_LIVE_THREAD_KEY)
  .collection('comments');
await anonLiveReplies.doc(ANON_LIVE_REPLY_KEY).set({
  markdownContent:
    'The only reply present before the spec publishes a new one.',
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 1,
});
await anonLiveReplies.doc(ANON_LIVE_NEW_REPLY_KEY).delete();
console.log(
  `Restored stream/${ANON_LIVE_THREAD_KEY}/comments/${ANON_LIVE_REPLY_KEY} and confirmed .../${ANON_LIVE_NEW_REPLY_KEY} is absent`,
);

// stream/<MALFORMED_THREAD_KEY> — one valid reply and one reply failing
// ReplySchema (`owners: []`, below its minimum of one). Isolated on its own
// thread: fetchDiscussion marks a thread `incomplete` for its whole lifetime
// once a malformed record exists in it, so no other spec's thread carries one.
await serverDB
  .collection('stream')
  .doc(MALFORMED_THREAD_KEY)
  .set({
    title: 'E2E malformed reply regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the malformed-reply-render regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    flowTime: FieldValue.serverTimestamp(),
    replyCount: 1,
    lovedCount: 0,
  });
const malformedReplies = serverDB
  .collection('stream')
  .doc(MALFORMED_THREAD_KEY)
  .collection('comments');
await malformedReplies.doc(MALFORMED_VALID_REPLY_KEY).set({
  markdownContent: 'A valid reply beside the malformed record.',
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 1,
});
// `owners: []` fails ReplySchema's `.min(1, ...)` on purpose.
await malformedReplies.doc(MALFORMED_REPLY_KEY).set({
  markdownContent: 'A malformed reply with no owners.',
  owners: [],
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 2,
});
console.log(
  `Restored stream/${MALFORMED_THREAD_KEY}/comments/${MALFORMED_VALID_REPLY_KEY} and .../${MALFORMED_REPLY_KEY}`,
);

// stream/<EMPTY_THREAD_KEY> — no replies at all, for latest-reply-navigation
// .spec.ts's "no replies" case: the latest-reply control targets the
// discussion heading instead of a reply.
await serverDB
  .collection('stream')
  .doc(EMPTY_THREAD_KEY)
  .set({
    title: 'E2E empty discussion regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the latest-reply-navigation regression.',
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
console.log(`Restored stream/${EMPTY_THREAD_KEY}`);

// stream/<THREAD_KEY> — src/schemas/ThreadSchema.ts (collection name 'stream').
// `public: true` and the timestamps are all `/api/threads.json` and
// `/api/threads/[threadKey].json` need; no channel metadata is read by either
// route, so none is seeded. Written last, deliberately: `/api/threads.json`
// (TopThreadsStream.astro, the front page this document's regression reads)
// orders public threads by `flowTime` descending and takes the top 5, so this
// write must carry the latest `flowTime` of every thread this script
// restores — otherwise the other fixture threads this run also wrote would
// outrank it and the front page would never link it.
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
