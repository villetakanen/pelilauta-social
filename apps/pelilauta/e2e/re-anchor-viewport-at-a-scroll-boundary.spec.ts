import { expect, type Page, test } from '@playwright/test';
import { deleteReply } from './admin';
import { signIn } from './signIn';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Re-anchor viewport at a scroll boundary
 *     Given a reader at the end of a discussion
 *     When deletion removes the active viewport target
 *     Then the viewport clamps to the nearest valid position without empty space
 *     And the next surviving reply becomes the reading anchor, or the preceding reply when none follows
 *     And an empty discussion uses its heading
 *     And removal of the focused reply moves focus to the discussion heading
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-scroll-boundary-thread
 * with six long replies. This spec deletes the last of them, then the rest,
 * through the Admin SDK, so the four clauses above are read in one pass down
 * to an empty discussion.
 *
 * "Without empty space" is read against a reload: a document the live updates
 * shortened stands exactly as tall as the same document loaded fresh, so no
 * height was left behind where removed replies were.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const THREAD_KEY = 'e2e-scroll-boundary-thread';
const REPLY_KEYS = [1, 2, 3, 4, 5, 6].map(
  (ordinal) => `e2e-boundary-reply-0${ordinal}`,
);
const LAST_REPLY = REPLY_KEYS[5];
const PRECEDING_REPLY = REPLY_KEYS[4];

/** Scroll position, the document's maximum, and the document's height. */
function scrollState(page: Page) {
  return page.evaluate(() => ({
    scrollY: window.scrollY,
    maxScroll: Math.max(
      0,
      (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
    ),
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
  }));
}

test('Re-anchor viewport at a scroll boundary', async ({ page }) => {
  await signIn(page, BASE_URL);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  for (const key of REPLY_KEYS) {
    await expect(page.locator(`#${key}`)).toBeAttached();
  }
  // Let the session resolve and the live subscription attach.
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

  // Removal of the focused reply moves focus to the discussion heading.
  await expect(page.locator('#discussion-title')).toBeFocused();

  // The reader stood at the document's end, so the position the anchor held
  // no longer exists: the viewport clamps to the nearest one the shortened
  // document has, which is its new end, and the anchor is what the reader
  // sees there. Nothing followed the removed reply, so that anchor is the
  // preceding one.
  const afterRemoval = await scrollState(page);
  expect(afterRemoval.scrollY).toBeCloseTo(afterRemoval.maxScroll, 0);
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
  const emptied = await scrollState(page);
  expect(emptied.scrollY).toBeLessThanOrEqual(emptied.maxScroll + 1);

  // No empty space: the live-shortened document is as tall as the same
  // discussion loaded fresh.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const reloaded = await scrollState(page);
  expect(
    Math.abs(reloaded.scrollHeight - emptied.scrollHeight),
    `the live-updated document stood ${emptied.scrollHeight - reloaded.scrollHeight}px taller than a fresh load`,
  ).toBeLessThanOrEqual(2);
});
