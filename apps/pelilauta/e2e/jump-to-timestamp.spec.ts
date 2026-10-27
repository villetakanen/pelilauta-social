import { expect, test } from '@playwright/test';
import { restoreMemberSession as signIn } from './helpers/memberSession';

/**
 * Scenario "Land on a timestamped position" in
 * specs/pelilauta/threads/read-state/spec.md.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Match e2e/reset-fixtures.mjs's THREAD_KEY and replyBase; the replies are one second apart.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const REPLY_BASE = Date.UTC(2026, 0, 1);

test('a timestamp lands at the last reply at or before it', async ({
  page,
}) => {
  await signIn(page);
  // Between the second and third replies.
  await page.goto(
    `${BASE_URL}/threads/${THREAD_KEY}?jumpTo=${REPLY_BASE + 1500}#discussion`,
  );

  await expect(page.locator('[id="e2e-reply-2"]')).toBeInViewport();
});

test('a non-numeric jumpTo leaves the discussion in view', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}?jumpTo=unread#discussion`);

  await expect(page.locator('#discussion-title')).toBeInViewport();
});
