import { expect, test } from '@playwright/test';
import { FieldValue } from 'firebase-admin/firestore';
import { deleteReply, replies } from './admin';
import { signIn } from './signIn';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Terminate a live subscription
 *     Given an active reply subscription
 *     When the reader signs out, changes accounts, or leaves the page
 *     Then the subscription terminates
 *     And late results do not update the discussion
 *
 * The reader signs out the way a reader signs out of an open thread: in
 * another tab. Firebase Auth persists the session in the browser profile
 * both tabs share, so /logout in the second tab reaches the auth listener on
 * the thread page, and that page stays open throughout — which is what
 * makes the listener's fate observable at all.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores
 * stream/e2e-subscription-teardown-thread with one reply, and deletes
 * e2e-teardown-late-reply so this spec starts from its absence. This spec
 * writes that document itself, through the Admin SDK, to prove the
 * subscription is live, and deletes it again after the sign-out: a listener
 * still attached would carry that removal to the page.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const THREAD_KEY = 'e2e-subscription-teardown-thread';
const SEEDED_REPLY = 'e2e-teardown-reply-1';
const LIVE_REPLY = 'e2e-teardown-late-reply';
const LIVE_REPLY_BODY = 'A reply published while the subscription is live.';

test('Terminate a live subscription', async ({ page, context }) => {
  await signIn(page, BASE_URL);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator(`#${SEEDED_REPLY}`)).toBeAttached();
  await page.waitForTimeout(3000);

  // The subscription is active: a reply written now reaches the open page.
  await replies(THREAD_KEY)
    .doc(LIVE_REPLY)
    .set({
      markdownContent: LIVE_REPLY_BODY,
      owners: ['e2e-teardown-publisher'],
      author: 'e2e-teardown-publisher',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      flowTime: 2,
    });
  await expect(page.locator(`#${LIVE_REPLY}`)).toBeAttached();

  // The reader signs out in another tab; the thread page stays open.
  const other = await context.newPage();
  await other.goto(`${BASE_URL}/logout`);
  await other.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await other.close();

  // The sign-out reached the thread page: the discussion now invites the
  // reader to sign in, which only a resolved anonymous session renders.
  await expect(page.locator('#discussion a[href="/login"]')).toBeVisible({
    timeout: 20000,
  });

  // A late result: the subscription, had it survived, would remove this reply.
  await deleteReply(THREAD_KEY, LIVE_REPLY);
  await page.waitForTimeout(5000);

  await expect(
    page.locator(`#${LIVE_REPLY}`),
    'a terminated subscription still updated the discussion',
  ).toBeAttached();
  await expect(page.locator(`#${SEEDED_REPLY}`)).toBeAttached();
});
