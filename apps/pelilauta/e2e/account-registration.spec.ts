import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

test.describe.serial('Account Registration', { tag: '@newuser' }, () => {
  test.beforeAll(async () => {
    // Initialize clean test user state
    console.log('Initializing test database and cleaning up test user...');
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    try {
      await execAsync(
        'cd /Users/ville.takanen/dev/pelilauta-17 && node e2e/init-test-db.js',
      );
      console.log('Test database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw error;
    }
  });

  test('should allow user to cancel registration and logout', async ({
    page,
  }) => {
    // Clean up any existing auth state
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/logout`);

    // Authenticate with new user credentials (redirects to onboarding)
    await authenticate(page, true);

    // Wait for redirect to onboarding page
    await page.waitForURL(`${BASE_URL}/onboarding`, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /Tervetuloa!|Welcome!/ }),
    ).toBeVisible();

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Click cancel button
    const cancelButton = page.getByRole('button', {
      name: /Keskeytä, ja kirjaudu ulos|Cancel and sign out/,
    });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Should be logged out and redirected to home
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    await expect(
      page.locator('[data-testid="setting-navigation-button"]'),
    ).not.toBeVisible();

    // Verify cannot access protected pages
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);
    // Should be redirected away from settings (to login or home)
    expect(page.url()).not.toContain('/settings');
  });

  test('should allow user to complete registration', async ({ page }) => {
    // Re-initialize test user for registration completion
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    try {
      await execAsync(
        'cd /Users/ville.takanen/dev/pelilauta-17 && node e2e/init-test-db.js',
      );
    } catch (error) {
      console.error('Failed to re-initialize test database:', error);
    }

    // Clean up and authenticate again
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/logout`);
    await authenticate(page, true);

    // Wait for onboarding page
    await page.waitForURL(`${BASE_URL}/onboarding`, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: 'Tervetuloa!' }),
    ).toBeVisible();

    // Wait for nickname to be auto-filled
    await page.waitForTimeout(3000);
    await page.waitForFunction(
      () => {
        const input = document.querySelector(
          'input[type="text"]',
        ) as HTMLInputElement;
        return input && input.value.length > 0;
      },
      { timeout: 10000 },
    );

    // Complete registration
    await page.getByLabel('Nick').fill('Test Nickname New User');
    await page.getByRole('button', { name: 'Hyväksy ja jatka' }).click();

    // Should be redirected to home page and logged in
    await page.waitForURL(`${BASE_URL}/`);
    await expect(
      page.locator('[data-testid="setting-navigation-button"]'),
    ).toBeVisible();

    // Verify can access different pages while maintaining login state
    await page.goto(`${BASE_URL}/channels`);
    await expect(
      page.locator('[data-testid="setting-navigation-button"]'),
    ).toBeVisible();

    await page.goto(`${BASE_URL}/library`);
    await expect(
      page.locator('[data-testid="setting-navigation-button"]'),
    ).toBeVisible();
  });
});
