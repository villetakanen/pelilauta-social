import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/read-state/spec.md:
 *
 *   Scenario: Reach the latest reply
 *     Given a thread page with replies
 *     When the reader activates the latest-reply control
 *     Then the viewport targets the final reply
 *     And a discussion with no replies targets the discussion heading
 *
 * The latest-reply control is ThreadInfoSection.astro's reply-count link
 * (`latestReplyFragment` in src/threads/server/prepareDiscussion.ts), present
 * in the initial document and requiring no JavaScript to activate.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-initial-reply-render-thread
 * (replies present) and stream/e2e-empty-discussion-thread (no replies). Run
 * it, with the dev server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's constants.
const THREAD_WITH_REPLIES_KEY = 'e2e-initial-reply-render-thread';
const LAST_REPLY_KEY = 'e2e-reply-2';
const EMPTY_THREAD_KEY = 'e2e-empty-discussion-thread';

test('Reach the latest reply', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // A thread with replies: the control targets the final reply.
  await page.goto(`${BASE_URL}/threads/${THREAD_WITH_REPLIES_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  const latestReplyControl = page.locator(`a[href="#${LAST_REPLY_KEY}"]`);
  await expect(latestReplyControl).toBeAttached();
  await latestReplyControl.click();
  await expect(page.locator(`#${LAST_REPLY_KEY}`)).toBeInViewport();

  // A discussion with no replies: the control targets the discussion heading.
  await page.goto(`${BASE_URL}/threads/${EMPTY_THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  const emptyLatestReplyControl = page.locator('a[href="#discussion"]');
  await expect(emptyLatestReplyControl).toBeAttached();
  await emptyLatestReplyControl.click();
  await expect(page.locator('#discussion-title')).toBeInViewport();
});
