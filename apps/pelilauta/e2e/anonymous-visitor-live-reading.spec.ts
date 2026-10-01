import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Read as an anonymous visitor with JavaScript enabled
 *     Given an anonymous reader viewing a thread
 *     When a new reply is published
 *     Then thread reading creates no Firebase subscriptions
 *     And the displayed discussion does not change
 *     When the reader reloads the page after the reply persists
 *     Then the new reply renders
 *
 * JavaScript stays enabled throughout (the scenario's point is that an
 * anonymous, fully-hydrated reader still opens no subscription), so this
 * lives in its own file rather than beside a javaScriptEnabled: false spec.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-anon-visitor-thread
 * and its one reply, and deletes its "new reply" document so this spec starts
 * from a thread that document has not yet reached. This spec then writes
 * that document itself, through the Admin SDK, to simulate another author
 * publishing while the reader's page stays open — the same credential and
 * project-matching discipline as e2e/reset-fixtures.mjs, repeated here
 * because the write happens mid-test rather than during the fixture reset.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's ANON_LIVE_* constants.
const THREAD_KEY = 'e2e-anon-visitor-thread';
const EXISTING_REPLY_KEY = 'e2e-anon-visitor-reply-1';
const NEW_REPLY_KEY = 'e2e-anon-visitor-new-reply';
const NEW_REPLY_BODY =
  'A reply published while the anonymous reader is on the page.';

const REQUIRED_PROJECT_ID = 'skaldbase-test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../../..');

/**
 * Writes `stream/{THREAD_KEY}/comments/{NEW_REPLY_KEY}` directly, simulating
 * another author's publish. Repeats e2e/reset-fixtures.mjs's project-matching
 * checks before touching Firestore, since this write happens from inside a
 * test rather than from the fixture-reset script.
 */
async function publishNewReply(): Promise<void> {
  const serviceAccountPath = join(repoRoot, 'server_principal.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  if (serviceAccount.project_id !== REQUIRED_PROJECT_ID) {
    throw new Error(
      `server_principal.json targets project "${serviceAccount.project_id}", not "${REQUIRED_PROJECT_ID}".`,
    );
  }

  const app =
    getApps().find((candidate) => candidate.name === 'e2e-live-publish') ??
    initializeApp({ credential: cert(serviceAccount) }, 'e2e-live-publish');
  const db = getFirestore(app);

  await db
    .collection('stream')
    .doc(THREAD_KEY)
    .collection('comments')
    .doc(NEW_REPLY_KEY)
    .set({
      markdownContent: NEW_REPLY_BODY,
      owners: ['e2e-anon-visitor-publisher'],
      author: 'e2e-anon-visitor-publisher',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      flowTime: 2,
    });
}

test('Read as an anonymous visitor with JavaScript enabled', async ({
  page,
}) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe(REQUIRED_PROJECT_ID);

  const firestoreRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('firestore.googleapis.com')) {
      firestoreRequests.push(request.url());
    }
  });

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  const existingReply = page.locator(`#${EXISTING_REPLY_KEY}`);
  await expect(existingReply).toBeAttached();

  // A websocket-based Firestore subscription stays open rather than idling,
  // so 'networkidle' is avoided above; this fixed wait instead gives
  // hydration and any subscription attempt time to happen.
  await page.waitForTimeout(2000);

  const discussionBefore = await page.locator('#discussion').innerText();

  await publishNewReply();

  // Give a live subscription, if one existed, time to deliver the change.
  await page.waitForTimeout(3000);

  const discussionAfter = await page.locator('#discussion').innerText();
  expect(
    discussionAfter,
    'the displayed discussion changed without a reload',
  ).toBe(discussionBefore);
  await expect(page.locator(`#${NEW_REPLY_KEY}`)).toHaveCount(0);

  expect(
    firestoreRequests,
    `thread reading opened a Firestore request: ${firestoreRequests.join(', ')}`,
  ).toEqual([]);

  await page.reload({ waitUntil: 'domcontentloaded' });

  const newReply = page.locator(`#${NEW_REPLY_KEY}`);
  await expect(newReply).toBeAttached();
  await expect(newReply.locator('.content-area')).toContainText(NEW_REPLY_BODY);
});
