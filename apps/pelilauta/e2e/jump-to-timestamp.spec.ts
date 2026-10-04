import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Scenario "Navigate to a timestamped position" in
 * specs/pelilauta/threads/read-state/spec.md.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Match e2e/reset-fixtures.mjs's THREAD_KEY and replyBase; the replies are one second apart.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const REPLY_BASE = Date.UTC(2026, 0, 1);

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
}

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
