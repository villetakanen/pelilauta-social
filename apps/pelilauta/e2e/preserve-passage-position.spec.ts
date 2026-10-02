import { expect, test } from '@playwright/test';
import { deleteReply } from './admin';
import { signIn } from './signIn';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Preserve passage position during live updates
 *     Given a signed-in reader focused on an unchanged reply
 *     When an earlier reply changes height or is removed
 *     Then the focused reply retains focus and viewport position within scroll bounds
 *     And the viewport does not jump to the latest reply
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-passage-position-thread
 * with ten long replies, enough that the thread scrolls past one viewport.
 * This spec deletes the first of them through the Admin SDK, which reaches
 * the open page as a live removal.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const THREAD_KEY = 'e2e-passage-position-thread';
const FIRST_REPLY = 'e2e-passage-reply-01';
const FOCUSED_REPLY = 'e2e-passage-reply-05';
const LAST_REPLY = 'e2e-passage-reply-10';

test('Preserve passage position during live updates', async ({ page }) => {
  await signIn(page, BASE_URL);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator(`#${FIRST_REPLY}`)).toBeAttached();
  await expect(page.locator(`#${LAST_REPLY}`)).toBeAttached();
  // Let the session resolve and the live subscription attach.
  await page.waitForTimeout(3000);

  const focused = page.locator(`#${FOCUSED_REPLY}`);
  await focused.scrollIntoViewIfNeeded();
  const trigger = focused.locator('.cn-menu-trigger').first();
  await trigger.focus();
  await expect(trigger).toBeFocused();

  const topBefore = await focused.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  await deleteReply(THREAD_KEY, FIRST_REPLY);
  await expect(page.locator(`#${FIRST_REPLY}`)).toHaveCount(0);
  // The scroll correction runs after the update renders.
  await page.waitForTimeout(500);

  // The reply the reader was on keeps both the focus and its place on screen.
  await expect(trigger).toBeFocused();
  const topAfter = await focused.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(
    Math.abs(topAfter - topBefore),
    `the focused reply moved ${topAfter - topBefore}px on screen`,
  ).toBeLessThanOrEqual(2);

  // The viewport did not jump to the latest reply: it is still below the fold.
  const lastReplyTop = await page
    .locator(`#${LAST_REPLY}`)
    .evaluate((element) => element.getBoundingClientRect().top);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(lastReplyTop).toBeGreaterThan(viewportHeight);
});
