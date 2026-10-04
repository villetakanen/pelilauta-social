import { expect, test } from '@playwright/test';

/**
 * Scenario "Open reply permalink without JavaScript" in
 * specs/pelilauta/threads/read-state/spec.md.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY and REPLIES.
const THREAD_KEY = 'e2e-onboarding-regression-thread';

test('a reply permalink scrolls to the reply without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}#e2e-reply-3`);

  await expect(page.locator('[id="e2e-reply-3"]')).toBeInViewport();

  await context.close();
});
