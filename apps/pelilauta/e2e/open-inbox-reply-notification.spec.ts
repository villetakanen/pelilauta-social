import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Scenario "Resolve a notification destination" in
 * specs/pelilauta/inbox/spec.md, the `thread.reply` row.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Match e2e/reset-fixtures.mjs's THREAD_KEY, REPLIES and the notification's targetTitle.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const REPLY_KEY = 'e2e-reply-3';
const NOTIFICATION_TITLE = 'E2E inbox reply notification';

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
}

test('a reply notification links to its reply in the thread', async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`${BASE_URL}/inbox`);

  await page.getByRole('link', { name: NOTIFICATION_TITLE }).click();

  await expect(page).toHaveURL(
    `${BASE_URL}/threads/${THREAD_KEY}#${REPLY_KEY}`,
  );
  await expect(page.locator(`[id="${REPLY_KEY}"]`)).toBeInViewport();
});
