import { expect, type Page } from '@playwright/test';
// Credentials reside at the repository root outside the application directory. See
// e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/** Authenticates through the login form after verifying that the application targets `skaldbase-test`. */
export async function signIn(page: Page, baseUrl: string): Promise<void> {
  const configResponse = await page.request.get(
    `${baseUrl}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  await page.goto(`${baseUrl}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
}
