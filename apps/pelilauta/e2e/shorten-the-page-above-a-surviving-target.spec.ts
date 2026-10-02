import { expect, test } from '@playwright/test';
import { deleteReply } from './admin';
import { signIn } from './signIn';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Shorten the page above a surviving target
 *     Given a reader at the end of a discussion focused on a surviving reply
 *     When deletion of preceding content reduces the maximum scroll position
 *     Then the viewport clamps to the nearest available position without artificial space
 *     And focus remains on the surviving reply
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-shorten-above-thread
 * with ten long replies. This spec deletes the first five through the Admin
 * SDK while the reader sits at the end on the tenth, which cuts the maximum
 * scroll position well below where the reader stands.
 *
 * "Without artificial space" is read against a reload: the shortened document
 * stands exactly as tall as the same discussion loaded fresh.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const THREAD_KEY = 'e2e-shorten-above-thread';
const ALL_REPLIES = Array.from(
  { length: 10 },
  (_, index) => `e2e-shorten-reply-${String(index + 1).padStart(2, '0')}`,
);
const REMOVED = ALL_REPLIES.slice(0, 5);
const SURVIVING_TARGET = ALL_REPLIES[9];

test('Shorten the page above a surviving target', async ({ page }) => {
  await signIn(page, BASE_URL);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  for (const key of ALL_REPLIES) {
    await expect(page.locator(`#${key}`)).toBeAttached();
  }
  // Let the session resolve and the live subscription attach.
  await page.waitForTimeout(3000);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const trigger = page.locator(`#${SURVIVING_TARGET} .cn-menu-trigger`).first();
  await trigger.focus();
  await expect(trigger).toBeFocused();

  const maxScrollBefore = await page.evaluate(
    () => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
  );

  for (const key of REMOVED) {
    await deleteReply(THREAD_KEY, key);
  }
  for (const key of REMOVED) {
    await expect(page.locator(`#${key}`)).toHaveCount(0);
  }
  await page.waitForTimeout(500);

  // Focus remains on the surviving reply.
  await expect(trigger).toBeFocused();

  const after = await page.evaluate(() => ({
    scrollY: window.scrollY,
    maxScroll:
      (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    targetBottom:
      document.getElementById('e2e-shorten-reply-10')?.getBoundingClientRect()
        .bottom ?? 0,
    viewportHeight: window.innerHeight,
  }));

  // The maximum scroll position really did fall.
  expect(after.maxScroll).toBeLessThan(maxScrollBefore);
  // The viewport clamps to the nearest available position rather than keeping
  // a position the document no longer has.
  expect(after.scrollY).toBeLessThanOrEqual(after.maxScroll + 1);
  // The surviving target is still on screen, not pushed off by invented space.
  expect(after.targetBottom).toBeGreaterThan(0);
  expect(after.targetBottom).toBeLessThanOrEqual(after.viewportHeight + 1);

  // No artificial space: the live-shortened document is as tall as the same
  // discussion loaded fresh.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const reloadedHeight = await page.evaluate(
    () => document.scrollingElement?.scrollHeight ?? 0,
  );
  expect(
    Math.abs(reloadedHeight - after.scrollHeight),
    `the live-updated document stood ${after.scrollHeight - reloadedHeight}px taller than a fresh load`,
  ).toBeLessThanOrEqual(2);
});
