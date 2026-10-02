import { expect, test } from '@playwright/test';
import { deleteReply } from './admin';
import { signIn } from './signIn';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Re-anchor a deleted reading target
 *     Given a reader at the end of a discussion
 *     When deletion removes the active viewport target
 *     Then the next surviving reply becomes the reading anchor, or the preceding reply when none follows
 *     And an empty discussion uses its heading
 *     And removal of the focused reply moves focus to the discussion heading
 *
 * `e2e/reset-fixtures.mjs` restores `stream/e2e-scroll-boundary-thread` with
 * six long replies. The spec deletes the last reply and then the remaining
 * replies through the Admin SDK, testing all three clauses down to an empty
 * discussion.
 *
 * Browser scroll anchoring and boundary clamping preserve position, so the
 * spec asserts no scroll coordinates.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const THREAD_KEY = 'e2e-scroll-boundary-thread';
const REPLY_KEYS = [1, 2, 3, 4, 5, 6].map(
  (ordinal) => `e2e-boundary-reply-0${ordinal}`,
);
const LAST_REPLY = REPLY_KEYS[5];
const PRECEDING_REPLY = REPLY_KEYS[4];

test('Re-anchor a deleted reading target', async ({ page }) => {
  await signIn(page, BASE_URL);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  for (const key of REPLY_KEYS) {
    await expect(page.locator(`#${key}`)).toBeAttached();
  }
  // Wait for the session to resolve and the live subscription to attach.
  await page.waitForTimeout(3000);

  // The reader is at the end of the discussion, on its last reply.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const trigger = page.locator(`#${LAST_REPLY} .cn-menu-trigger`).first();
  await trigger.focus();
  await expect(trigger).toBeFocused();

  await deleteReply(THREAD_KEY, LAST_REPLY);
  await expect(page.locator(`#${LAST_REPLY}`)).toHaveCount(0);
  await page.waitForTimeout(500);

  // Removing the focused reply moves focus to the discussion heading.
  await expect(page.locator('#discussion-title')).toBeFocused();

  // Because no reply followed the removed reply, the preceding reply becomes the reading anchor in the viewport.
  await expect(page.locator(`#${PRECEDING_REPLY}`)).toBeInViewport();

  // Emptying the discussion leaves its heading as the anchor.
  for (const key of REPLY_KEYS.slice(0, 5)) {
    await deleteReply(THREAD_KEY, key);
  }
  for (const key of REPLY_KEYS) {
    await expect(page.locator(`#${key}`)).toHaveCount(0);
  }
  await page.waitForTimeout(500);

  await expect(page.locator('#discussion-title')).toBeInViewport();
});
