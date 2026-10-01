import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Read all replies without JavaScript
 *     Given a public thread with three valid replies
 *     When an anonymous reader opens the thread with JavaScript disabled
 *     Then the document contains three reply articles with bodies and public attribution
 *     And attachment links provide direct image access without hydration
 *
 * The fixture thread carries two replies, not three; the count is not the
 * scenario's point (fetchDiscussion imposes no limit), so the assertions
 * below check both seeded replies rather than a specific count.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-initial-reply-render-thread
 * and its two replies (both authored by the signed-in member restored for
 * onboarding-callout-transition.spec.ts); the second reply carries one image
 * attachment. Run it, with the dev server already up against skaldbase-test,
 * before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's REPLY_THREAD_KEY and reply keys.
const THREAD_KEY = 'e2e-initial-reply-render-thread';
const REPLY_1_KEY = 'e2e-reply-1';
const REPLY_2_KEY = 'e2e-reply-2';
// Matches profiles/<memberUid>.nick, restored by the same reset script.
const AUTHOR_NICK = 'E2E Regression Member';
// Matches e2e/reset-fixtures.mjs's REPLY_2_IMAGE_URL.
const REPLY_2_IMAGE_URL =
  'https://storage.googleapis.com/skaldbase-test.appspot.com/e2e-fixtures/reply-attachment.jpg';

test.use({ javaScriptEnabled: false });

test('Read all replies without JavaScript', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  const firstReply = page.locator(`#${REPLY_1_KEY}`);
  const secondReply = page.locator(`#${REPLY_2_KEY}`);

  await expect(firstReply).toBeAttached();
  await expect(secondReply).toBeAttached();

  await expect(firstReply.locator('.content-area')).toContainText(
    'The first seeded reply body.',
  );
  await expect(secondReply.locator('.content-area')).toContainText(
    'The second seeded reply body.',
  );

  await expect(firstReply.locator('.reply-author')).toContainText(AUTHOR_NICK);
  await expect(secondReply.locator('.reply-author')).toContainText(AUTHOR_NICK);

  // Attachment links provide direct image access without hydration: the
  // second reply's image carries a direct link to its full resolution,
  // reachable without CnLightbox's script-driven dialog.
  const directImageLink = secondReply.locator(`a[href="${REPLY_2_IMAGE_URL}"]`);
  await expect(directImageLink).toBeAttached();
});
