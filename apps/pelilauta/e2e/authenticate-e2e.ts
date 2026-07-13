import type { ConsoleMessage, Page } from '@playwright/test';
import { existingUser, newUser } from '../playwright/.auth/credentials.ts';

// Use environment variable for base URL or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

export async function authenticate(page: Page, useNewUserAccount = false) {
  console.log(
    `Starting authentication process for ${useNewUserAccount ? 'new' : 'existing'} user...`,
  );

  // Use the correct account based on the test type
  const credentials = useNewUserAccount ? newUser : existingUser;

  console.log(`Using account: ${credentials.email}`);

  // Perform authentication steps. Replace these actions with your own.
  await page.goto(`${BASE_URL}/login`);

  // Wait for the login form to be loaded and Svelte components to be hydrated
  // Try multiple selectors to account for different login sections
  try {
    // First try to wait for password login email field (test environment)
    await page.waitForSelector('#password-email', { timeout: 5000 });
  } catch {
    // Fallback to any email input field
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  }

  // Additional wait for client-side hydration to complete and vite deps to load
  await page.waitForTimeout(3000);

  // Try to ensure no more network activity (vite deps finished loading)
  // Use a longer timeout and fallback strategy for more reliability
  try {
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  } catch {
    console.log(
      'NetworkIdle timeout exceeded, continuing with form interaction...',
    );
    // Fallback: wait for DOM to be stable instead
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  }

  console.log('Filling email field with:', credentials.email);
  // Use specific ID for password login form (test environment)
  const emailField = page
    .locator('#password-email')
    .or(page.getByLabel('Email'));
  await emailField.fill(credentials.email);

  console.log('Filling password field');
  const passwordField = page
    .locator('#password-password')
    .or(page.getByLabel('Password'));
  await passwordField.fill(credentials.password);

  // Wait for the form to be ready for submission
  await page.waitForTimeout(500);

  console.log('Clicking login button');
  await page.getByRole('button', { name: 'Login' }).click();

  console.log('Login button clicked, waiting for navigation...');

  // Wait a bit and check for console errors
  await page.waitForTimeout(2000);

  // Check for JavaScript errors in console
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  // Check for any error messages
  const errorElements = await page
    .locator('cn-snackbar, .error, [role="alert"]')
    .all();
  if (errorElements.length > 0) {
    for (const errorElement of errorElements) {
      const errorText = await errorElement.textContent();
      if (errorText?.trim()) {
        console.log('Error message found:', errorText);
      }
    }
  }

  // Check if the login form is still visible (which would indicate failed login)
  const isEmailFieldStillVisible = await page
    .getByLabel('Email')
    .isVisible()
    .catch(() => false);
  if (isEmailFieldStillVisible) {
    console.log('Login form is still visible - login likely failed');
    // Try to see if there's a loading state
    const isButtonLoading = await page
      .getByRole('button', { name: 'Login' })
      .getAttribute('disabled');
    console.log('Login button disabled (loading):', isButtonLoading);
  }

  // For new users, they might get redirected to onboarding instead of home
  if (useNewUserAccount) {
    // For new users, we expect either home page or onboarding
    await page.waitForURL(new RegExp(`${BASE_URL}/(|onboarding)`), {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });
    console.log('Authentication completed for new user (may need onboarding)');
  } else {
    // Wait until the page receives the cookies.
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL(`${BASE_URL}/`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Additional wait to ensure user profile is loaded - this is the reliable indicator of successful auth
    await page.waitForSelector('[data-testid="setting-navigation-button"]', {
      timeout: 30000,
      state: 'visible',
    });

    console.log('Authentication completed successfully for existing user');
  }
}
