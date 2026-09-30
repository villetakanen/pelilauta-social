import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md: the thread page's
 * initial document must render every public reply as an article with its
 * body and public attribution, without JavaScript.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-initial-reply-render-thread
 * and its two replies (both authored by the signed-in member restored for
 * onboarding-callout-transition.spec.ts), by explicit document id. Run it,
 * with the dev server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's REPLY_THREAD_KEY and reply keys.
const THREAD_KEY = 'e2e-initial-reply-render-thread';
const REPLY_1_KEY = 'e2e-reply-1';
const REPLY_2_KEY = 'e2e-reply-2';
// Matches profiles/<memberUid>.nick, restored by the same reset script.
const AUTHOR_NICK = 'E2E Regression Member';

test.use({ javaScriptEnabled: false });

test('every reply renders in the initial HTML, with JavaScript disabled', async ({
  page,
}) => {
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
});
