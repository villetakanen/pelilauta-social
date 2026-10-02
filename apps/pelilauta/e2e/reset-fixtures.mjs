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
 *   - stream/<OPENING_POST_THREAD_KEY>              — three distinct dates, one image attachment
 *   - stream/<UNDATED_THREAD_KEY>                   — no creation date and no edit date
 *   - stream/<DISCOVERY_THREAD_KEY>                 (src/schemas/ThreadSchema.ts)
 *   - stream/<DISCOVERY_THREAD_KEY>/comments/<DISCOVERY_REPLY_KEY>
 *   - stream/<DISCOVERY_THREAD_KEY>/comments/<DISCOVERY_HOSTILE_REPLY_KEY> — body carrying `</script>`
 *   - stream/<CHRONOLOGY_THREAD_KEY>                — reply A edited after reply B was created
 *   - stream/<CHRONOLOGY_THREAD_KEY>/comments/<CHRONOLOGY_REPLY_A_KEY>
 *   - stream/<CHRONOLOGY_THREAD_KEY>/comments/<CHRONOLOGY_REPLY_B_KEY>
 *   - stream/<ORDER_THREAD_KEY>                     — equal creation times, and one record without one
 *   - stream/<ORDER_THREAD_KEY>/comments/<ORDER_UNDATED_KEY>  — no creation time: fails ReplySchema on purpose
 *   - stream/<ORDER_THREAD_KEY>/comments/<ORDER_EQUAL_A_KEY>  — creation time shared with ORDER_EQUAL_B_KEY, edited later
 *   - stream/<ORDER_THREAD_KEY>/comments/<ORDER_EQUAL_B_KEY>
 *   - stream/<PASSAGE_THREAD_KEY>                   — ten long replies, enough to scroll
 *   - stream/<PASSAGE_THREAD_KEY>/comments/e2e-passage-reply-01 … -10
 *   - stream/<BOUNDARY_THREAD_KEY>                  — six long replies, emptied by its spec
 *   - stream/<BOUNDARY_THREAD_KEY>/comments/e2e-boundary-reply-01 … -06
 *   - stream/<SHORTEN_THREAD_KEY>                   — ten long replies, the first five deleted by its spec
 *   - stream/<SHORTEN_THREAD_KEY>/comments/e2e-shorten-reply-01 … -10
 *   - stream/<TEARDOWN_THREAD_KEY>                  (src/schemas/ThreadSchema.ts)
 *   - stream/<TEARDOWN_THREAD_KEY>/comments/<TEARDOWN_REPLY_KEY>
 *
 * and deletes, by explicit id, to guarantee their absence at the start of a run:
 *   - profiles/<NO_PROFILE_AUTHOR_UID>
 *   - stream/<ANON_LIVE_THREAD_KEY>/comments/<ANON_LIVE_NEW_REPLY_KEY> — written mid-test by
 *     anonymous-visitor-live-reading.spec.ts itself, through the Admin SDK, to
 *     simulate another author publishing while the reader's page stays open
 *   - stream/<ORDER_THREAD_KEY>/comments/<ORDER_FLOWTIME_KEY> — seeded by an earlier
 *     revision of this script, when a stored flowTime stood in for a missing creation
 *     time; the rule it encoded is gone
 *   - stream/<TEARDOWN_THREAD_KEY>/comments/<TEARDOWN_LATE_REPLY_KEY> — written mid-test by
 *     terminate-a-live-subscription.spec.ts, through the Admin SDK, after the reader
 *     signed out, to check that no listener is left to deliver it
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

// read-opening-post.spec.ts and distinguish-activity-from-publication.spec.ts:
// one thread published, edited, and last active on three different days, with
// one image attachment, a resolvable author, and a channel — everything the
// opening post renders.
const OPENING_POST_THREAD_KEY = 'e2e-opening-post-thread';
const OPENING_POST_CREATED_AT = new Date('2024-01-02T09:00:00.000Z');
const OPENING_POST_UPDATED_AT = new Date('2024-03-04T09:00:00.000Z');
const OPENING_POST_FLOW_TIME = new Date('2024-05-06T09:00:00.000Z');

// preserve-unknown-publication-dates.spec.ts: a stored thread carrying no
// creation date at all, and no edit date either, so the only date it has is
// its activity.
const UNDATED_THREAD_KEY = 'e2e-undated-thread';
const UNDATED_THREAD_FLOW_TIME = new Date('2024-07-08T09:00:00.000Z');

// inspect-discovery-metadata.spec.ts: two attributed, dated replies, the
// second carrying the delimiters a JSON-LD block must not let out.
const DISCOVERY_THREAD_KEY = 'e2e-discovery-metadata-thread';
const DISCOVERY_REPLY_KEY = 'e2e-discovery-reply-1';
const DISCOVERY_HOSTILE_REPLY_KEY = 'e2e-discovery-hostile-reply';
const DISCOVERY_HOSTILE_BODY =
  'Hostile reply text: </script><img src=x onerror=alert(1)> with <b>angle</b> brackets & an ampersand.';

// latest-reply-navigation.spec.ts: the "no replies" half of "Reach the latest
// reply" needs a thread whose latest-reply control targets the discussion
// heading instead of a reply.
const EMPTY_THREAD_KEY = 'e2e-empty-discussion-thread';

// preserve-chronology-after-an-edit.spec.ts: reply A is created before reply
// B and edited after B exists, and its stored flowTime carries that later
// edit. Creation time alone decides the order, so A precedes B.
const CHRONOLOGY_THREAD_KEY = 'e2e-reply-chronology-thread';
const CHRONOLOGY_REPLY_A_KEY = 'e2e-chronology-reply-a';
const CHRONOLOGY_REPLY_B_KEY = 'e2e-chronology-reply-b';
const CHRONOLOGY_A_CREATED_AT = new Date('2024-04-01T09:00:00.000Z');
const CHRONOLOGY_B_CREATED_AT = new Date('2024-04-02T09:00:00.000Z');
const CHRONOLOGY_A_UPDATED_AT = new Date('2024-04-03T09:00:00.000Z');

// order-replies-with-equal-creation-dates.spec.ts: one thread carrying the
// ordering constraint's remaining cases. Expected reading order is
// ORDER_EQUAL_A_KEY, ORDER_EQUAL_B_KEY, and ORDER_UNDATED_KEY appears nowhere.
const ORDER_THREAD_KEY = 'e2e-reply-order-thread';
// No createdAt at all, only an edit date: ReplySchema rejects the record, so
// the discussion renders without it and reports incomplete content.
const ORDER_UNDATED_KEY = 'e2e-order-a-undated';
// A creation time shared with ORDER_EQUAL_B_KEY, so the key breaks the tie,
// and an edit date later than every other date in the thread, carried in its
// stored flowTime, so an edit standing in for creation would move it last.
const ORDER_EQUAL_A_KEY = 'e2e-order-b-equal-first';
const ORDER_EQUAL_B_KEY = 'e2e-order-c-equal-second';
// Written by an earlier revision of this script and deleted now; see the
// header.
const ORDER_FLOWTIME_KEY = 'e2e-order-d-flowtime';
const ORDER_EQUAL_CREATED_AT = new Date('2024-02-04T10:00:00.000Z');
const ORDER_EQUAL_A_UPDATED_AT = new Date('2024-06-02T10:00:00.000Z');
const ORDER_UNDATED_UPDATED_AT = new Date('2024-06-01T10:00:00.000Z');

// The three viewport specs — preserve-passage-position.spec.ts,
// re-anchor-viewport-at-a-scroll-boundary.spec.ts and
// shorten-the-page-above-a-surviving-target.spec.ts — each delete replies
// while their page is open, so each reads its own thread and no run depends
// on the order the specs happen to execute in. Every reply body is long
// enough that the thread scrolls past one viewport.
const PASSAGE_THREAD_KEY = 'e2e-passage-position-thread';
const BOUNDARY_THREAD_KEY = 'e2e-scroll-boundary-thread';
const SHORTEN_THREAD_KEY = 'e2e-shorten-above-thread';
const VIEWPORT_FIRST_CREATED_AT = new Date('2024-08-01T09:00:00.000Z');

// terminate-a-live-subscription.spec.ts: one reply before the reader signs
// out. TEARDOWN_LATE_REPLY_KEY is deleted on every reset, never written here
// — the spec writes it after the sign-out, through the Admin SDK, so a
// listener left attached would deliver it.
const TEARDOWN_THREAD_KEY = 'e2e-subscription-teardown-thread';
const TEARDOWN_REPLY_KEY = 'e2e-teardown-reply-1';
const TEARDOWN_LATE_REPLY_KEY = 'e2e-teardown-late-reply';

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

// stream/<OPENING_POST_THREAD_KEY> — three distinct dates and one image, so
// the opening post renders a publication date, an edit date and an activity
// date a reader can tell apart. The dates are literal, never server
// timestamps: the specs assert the rendered days.
await serverDB
  .collection('stream')
  .doc(OPENING_POST_THREAD_KEY)
  .set({
    title: 'E2E opening post regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the opening-post reading regressions.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: OPENING_POST_CREATED_AT,
    updatedAt: OPENING_POST_UPDATED_AT,
    flowTime: OPENING_POST_FLOW_TIME,
    replyCount: 0,
    lovedCount: 0,
    images: [{ url: REPLY_2_IMAGE_URL, alt: 'A seeded attachment image.' }],
  });
console.log(`Restored stream/${OPENING_POST_THREAD_KEY}`);

// stream/<UNDATED_THREAD_KEY> — no createdAt and no updatedAt field at all.
await serverDB
  .collection('stream')
  .doc(UNDATED_THREAD_KEY)
  .set({
    title: 'E2E undated regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the preserve-unknown-publication-dates regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    flowTime: UNDATED_THREAD_FLOW_TIME,
    replyCount: 0,
    lovedCount: 0,
  });
console.log(`Restored stream/${UNDATED_THREAD_KEY}`);

// stream/<DISCOVERY_THREAD_KEY> and its two replies — both authored by the
// member restored above, so both qualify for a structured-data item.
await serverDB
  .collection('stream')
  .doc(DISCOVERY_THREAD_KEY)
  .set({
    title: 'E2E discovery metadata regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the inspect-discovery-metadata regression.',
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
const discoveryReplies = serverDB
  .collection('stream')
  .doc(DISCOVERY_THREAD_KEY)
  .collection('comments');
await discoveryReplies.doc(DISCOVERY_REPLY_KEY).set({
  markdownContent: 'The first discovery-metadata reply body.',
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 1,
});
await discoveryReplies.doc(DISCOVERY_HOSTILE_REPLY_KEY).set({
  markdownContent: DISCOVERY_HOSTILE_BODY,
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 2,
});
console.log(
  `Restored stream/${DISCOVERY_THREAD_KEY}/comments/${DISCOVERY_REPLY_KEY} and .../${DISCOVERY_HOSTILE_REPLY_KEY}`,
);

// stream/<CHRONOLOGY_THREAD_KEY> — reply A created first and edited after
// reply B was created. A's stored flowTime carries the edit, so a read that
// sorts by flowTime puts B first; creation time puts A first.
await serverDB
  .collection('stream')
  .doc(CHRONOLOGY_THREAD_KEY)
  .set({
    title: 'E2E reply chronology regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the preserve-chronology-after-an-edit regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: CHRONOLOGY_A_CREATED_AT,
    updatedAt: CHRONOLOGY_A_UPDATED_AT,
    flowTime: CHRONOLOGY_A_UPDATED_AT,
    replyCount: 2,
    lovedCount: 0,
  });
const chronologyReplies = serverDB
  .collection('stream')
  .doc(CHRONOLOGY_THREAD_KEY)
  .collection('comments');
await chronologyReplies.doc(CHRONOLOGY_REPLY_A_KEY).set({
  markdownContent: 'Reply A, written first and edited later.',
  owners: [memberUid],
  author: memberUid,
  createdAt: CHRONOLOGY_A_CREATED_AT,
  updatedAt: CHRONOLOGY_A_UPDATED_AT,
  flowTime: CHRONOLOGY_A_UPDATED_AT.getTime(),
});
await chronologyReplies.doc(CHRONOLOGY_REPLY_B_KEY).set({
  markdownContent: 'Reply B, written after reply A and never edited.',
  owners: [memberUid],
  author: memberUid,
  createdAt: CHRONOLOGY_B_CREATED_AT,
  updatedAt: CHRONOLOGY_B_CREATED_AT,
  flowTime: CHRONOLOGY_B_CREATED_AT.getTime(),
});
console.log(
  `Restored stream/${CHRONOLOGY_THREAD_KEY}/comments/${CHRONOLOGY_REPLY_A_KEY} and .../${CHRONOLOGY_REPLY_B_KEY}`,
);

// stream/<ORDER_THREAD_KEY> — two replies sharing one creation time, the
// first of them edited last of all, and one record stored without a creation
// time, which ReplySchema rejects. See the ordering constraint in
// specs/pelilauta/threads/replies/spec.md.
await serverDB
  .collection('stream')
  .doc(ORDER_THREAD_KEY)
  .set({
    title: 'E2E reply order regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the order-replies-with-equal-creation-dates regression.',
    channel: 'yleinen',
    owners: [memberUid],
    author: memberUid,
    public: true,
    createdAt: ORDER_EQUAL_CREATED_AT,
    updatedAt: ORDER_EQUAL_A_UPDATED_AT,
    flowTime: ORDER_EQUAL_A_UPDATED_AT,
    replyCount: 3,
    lovedCount: 0,
  });
const orderReplies = serverDB
  .collection('stream')
  .doc(ORDER_THREAD_KEY)
  .collection('comments');
// No createdAt field: a reply has no reading position without one, so
// ReplySchema rejects the record and the discussion reports itself
// incomplete.
await orderReplies.doc(ORDER_UNDATED_KEY).set({
  markdownContent: 'A reply stored with no creation date.',
  owners: [memberUid],
  author: memberUid,
  updatedAt: ORDER_UNDATED_UPDATED_AT,
});
// An edit later than every other date in the thread, carried in the stored
// flowTime, and still the first of the two replies sharing a creation time.
await orderReplies.doc(ORDER_EQUAL_A_KEY).set({
  markdownContent:
    'The first of two replies sharing one creation time, edited since.',
  owners: [memberUid],
  author: memberUid,
  createdAt: ORDER_EQUAL_CREATED_AT,
  updatedAt: ORDER_EQUAL_A_UPDATED_AT,
  flowTime: ORDER_EQUAL_A_UPDATED_AT.getTime(),
});
await orderReplies.doc(ORDER_EQUAL_B_KEY).set({
  markdownContent: 'The second of two replies sharing one creation time.',
  owners: [memberUid],
  author: memberUid,
  createdAt: ORDER_EQUAL_CREATED_AT,
  flowTime: ORDER_EQUAL_CREATED_AT.getTime(),
});
await orderReplies.doc(ORDER_FLOWTIME_KEY).delete();
console.log(
  `Restored stream/${ORDER_THREAD_KEY}/comments/${ORDER_UNDATED_KEY}, .../${ORDER_EQUAL_A_KEY} and .../${ORDER_EQUAL_B_KEY}, and confirmed .../${ORDER_FLOWTIME_KEY} is absent`,
);

/**
 * Seeds one scrollable thread: `count` replies, keyed `<prefix>-01` upward in
 * reading order, each body long enough that the discussion runs past a
 * viewport. Creation times are literal and one minute apart, so the reading
 * order the specs assert never depends on write order.
 */
async function restoreScrollableThread(threadKey, replyPrefix, count) {
  await serverDB
    .collection('stream')
    .doc(threadKey)
    .set({
      title: `E2E ${threadKey} regression thread`,
      markdownContent:
        'Seeded by e2e/reset-fixtures.mjs for the live-update viewport regressions.',
      channel: 'yleinen',
      owners: [memberUid],
      author: memberUid,
      public: true,
      createdAt: VIEWPORT_FIRST_CREATED_AT,
      updatedAt: VIEWPORT_FIRST_CREATED_AT,
      flowTime: VIEWPORT_FIRST_CREATED_AT,
      replyCount: count,
      lovedCount: 0,
    });

  const replies = serverDB
    .collection('stream')
    .doc(threadKey)
    .collection('comments');
  const body = (ordinal) =>
    `Reply ${ordinal} of ${count}. ${'Seeded body text, long enough that this reply occupies several lines and the thread scrolls past one viewport. '.repeat(4)}`;

  for (let ordinal = 1; ordinal <= count; ordinal++) {
    const createdAt = new Date(
      VIEWPORT_FIRST_CREATED_AT.getTime() + ordinal * 60_000,
    );
    await replies
      .doc(`${replyPrefix}-${String(ordinal).padStart(2, '0')}`)
      .set({
        markdownContent: body(ordinal),
        owners: [memberUid],
        author: memberUid,
        createdAt,
        updatedAt: createdAt,
        flowTime: createdAt.getTime(),
      });
  }
  console.log(`Restored stream/${threadKey} and its ${count} replies`);
}

await restoreScrollableThread(PASSAGE_THREAD_KEY, 'e2e-passage-reply', 10);
await restoreScrollableThread(BOUNDARY_THREAD_KEY, 'e2e-boundary-reply', 6);
await restoreScrollableThread(SHORTEN_THREAD_KEY, 'e2e-shorten-reply', 10);

// stream/<TEARDOWN_THREAD_KEY> — one reply the signed-in reader sees before
// signing out, and the absence of the reply the spec publishes afterwards.
await serverDB
  .collection('stream')
  .doc(TEARDOWN_THREAD_KEY)
  .set({
    title: 'E2E subscription teardown regression thread',
    markdownContent:
      'Seeded by e2e/reset-fixtures.mjs for the terminate-a-live-subscription regression.',
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
const teardownReplies = serverDB
  .collection('stream')
  .doc(TEARDOWN_THREAD_KEY)
  .collection('comments');
await teardownReplies.doc(TEARDOWN_REPLY_KEY).set({
  markdownContent: 'The only reply present while the reader is signed in.',
  owners: [memberUid],
  author: memberUid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  flowTime: 1,
});
await teardownReplies.doc(TEARDOWN_LATE_REPLY_KEY).delete();
console.log(
  `Restored stream/${TEARDOWN_THREAD_KEY}/comments/${TEARDOWN_REPLY_KEY} and confirmed .../${TEARDOWN_LATE_REPLY_KEY} is absent`,
);

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
