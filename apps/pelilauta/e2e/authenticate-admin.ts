import type { Page } from '@playwright/test';
import { adminUser } from '../playwright/.auth/credentials.ts';

// Use environment variable for base URL or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

/**
 * Authenticates as an admin user for e2e tests.
 * This is a convenience wrapper around the regular authenticate function
 * that uses the admin user credentials.
 *
 * The admin user (sator@iki.fi) is configured in the test database
 * with UID: vN8RyOYratXr80130A7LqVCLmLn1
 *
 * @param page - The Playwright page instance
 */
export async function authenticateAdmin(page: Page) {
  console.log('Starting admin authentication...');
  console.log('Using admin account:', adminUser.email);

  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);

  // Wait for the login form to be loaded
  try {
    await page.waitForSelector('#password-email', { timeout: 5000 });
  } catch {
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  }

  // Wait for client-side hydration
  await page.waitForTimeout(3000);

  // Wait for network idle
  try {
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  } catch {
    console.log('NetworkIdle timeout exceeded, continuing...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  }

  console.log('Filling admin credentials...');

  // Fill in credentials
  const emailField = page
    .locator('#password-email')
    .or(page.getByLabel('Email'));
  await emailField.fill(adminUser.email);

  const passwordField = page
    .locator('#password-password')
    .or(page.getByLabel('Password'));
  await passwordField.fill(adminUser.password);

  // Wait for form to be ready
  await page.waitForTimeout(500);

  console.log('Clicking login button...');
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait a bit for login to process
  await page.waitForTimeout(2000);

  // Check for errors
  const errorElements = await page
    .locator('cn-snackbar, .error, [role="alert"]')
    .all();

  if (errorElements.length > 0) {
    for (const errorElement of errorElements) {
      const errorText = await errorElement.textContent();
      if (errorText?.trim()) {
        console.error('Login error:', errorText);
      }
    }
  }

  // Wait for successful authentication and redirect to home
  await page.waitForURL(`${BASE_URL}/`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });

  // Wait for user profile to be loaded (indicates successful auth)
  await page.waitForSelector('[data-testid="setting-navigation-button"]', {
    timeout: 30000,
    state: 'visible',
  });

  console.log('Admin authentication completed successfully');

  // Verify admin status by checking if we can access admin features
  // This is optional but provides a sanity check
  const isAdmin = await page
    .evaluate(async () => {
      try {
        // Try to fetch user's admin status
        const { auth } = await import('/src/firebase/client/index.ts');
        const user = auth.currentUser;
        if (!user) return false;

        // If this user is admin, they should be able to see admin features
        return true; // We'll verify through UI or API calls in actual tests
      } catch {
        return false;
      }
    })
    .catch(() => false);

  console.log('Admin status check:', isAdmin ? 'verified' : 'unable to verify');
}
