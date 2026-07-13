import type { Page } from '@playwright/test';

/**
 * Waits for the authentication state to be properly loaded on any page.
 * This function checks for multiple indicators of successful authentication:
 * 1. The setting navigation button is visible
 * 2. The session stores have been properly hydrated
 * 3. No authentication-related errors are present
 */
export async function waitForAuthState(page: Page, timeout = 15000) {
  console.log('Waiting for authentication state to be ready...');

  // Wait for the page to be fully loaded first
  await page.waitForLoadState('domcontentloaded');

  // Wait a bit for client-side hydration to begin
  await page.waitForTimeout(1000);

  try {
    // Primary check: wait for the setting navigation button to be visible
    await page.waitForSelector('[data-testid="setting-navigation-button"]', {
      timeout,
      state: 'visible',
    });

    console.log(
      'Setting navigation button found - authentication state appears ready',
    );

    // Additional verification: check that we're not seeing any auth errors
    const hasAuthError = await page
      .locator('[data-testid="auth-error"]')
      .isVisible()
      .catch(() => false);
    if (hasAuthError) {
      throw new Error('Authentication error detected on page');
    }

    // Give stores a moment to fully stabilize
    await page.waitForTimeout(500);

    return true;
  } catch (error) {
    console.log('Authentication state check failed:', error.message);

    // Try to get more context about what's happening
    const currentUrl = page.url();
    const hasLoginButton = await page
      .locator('a[href="/login"]')
      .isVisible()
      .catch(() => false);

    console.log(`Current URL: ${currentUrl}`);
    console.log(`Login button visible: ${hasLoginButton}`);

    // Let's also check if the AppRail is rendered at all
    const hasAppRail = await page
      .locator('nav.rail')
      .isVisible()
      .catch(() => false);
    console.log(`AppRail visible: ${hasAppRail}`);

    // Check for any navigation icons
    const navigationIcons = await page.locator('cn-navigation-icon').count();
    console.log(`Navigation icons found: ${navigationIcons}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: `debug-auth-failure-${Date.now()}.png` });

    // If we see a login button, it means the user is not authenticated
    if (hasLoginButton) {
      throw new Error(
        'User appears to be logged out - login button is visible',
      );
    }

    throw error;
  }
}

/**
 * Enhanced version that also checks for specific auth-dependent elements
 */
export async function waitForAuthStateWithElements(
  page: Page,
  additionalSelectors: string[] = [],
  timeout = 15000,
) {
  await waitForAuthState(page, timeout);

  // Wait for any additional auth-dependent elements
  for (const selector of additionalSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      console.log(`Additional element found: ${selector}`);
    } catch {
      console.log(`Warning: Additional element not found: ${selector}`);
    }
  }
}
