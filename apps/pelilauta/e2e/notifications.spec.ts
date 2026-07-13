import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';

// Use environment variable for base URL or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

test.describe('Notification E2E Tests', () => {
  test.setTimeout(120000);

  // This test requires multi-user setup and is currently skipped
  // To enable: create a second test user and update this test to use UI-based auth for both users
  test.skip('PBI-064: Reply reaction notification shows content snippet', async () => {
    // Multi-user test - requires second test user setup
    // Would need to use UI-based auth for both users in separate contexts
  });

  test('PBI-065: Multi-owner notification skip (basic verification)', async ({
    page,
  }) => {
    // This test verifies that when a thread owner replies to their own thread,
    // they don't receive a notification
    // Note: Using UI-based auth because create/thread requires server-side session

    await authenticate(page);

    // Create a thread
    await page.goto(`${BASE_URL}/create/thread`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for auth to settle
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('setting-navigation-button')).toBeVisible({
      timeout: 10000,
    });

    const uniqueThreadTitle = `Self-Reply Test Thread ${Date.now()}`;

    await page.fill('input[name="title"]', uniqueThreadTitle);

    await page.waitForSelector('.cm-editor', {
      state: 'attached',
      timeout: 15000,
    });
    const editor = page.locator('.cm-content');
    await editor.click();
    await editor.fill('Thread content for self-reply testing');

    await expect(page.getByTestId('send-thread-button')).toBeEnabled();
    await page.getByTestId('send-thread-button').click();

    await page.waitForURL(/\/threads\/[^/]+$/, { timeout: 15000 });

    // Get current notification count
    await page.goto(`${BASE_URL}/inbox`);
    await page.waitForLoadState('domcontentloaded');
    const initialNotifications = await page
      .locator('.notification-item')
      .count();

    console.log(`Initial notification count: ${initialNotifications}`);

    // Go back to thread and add a reply as the owner
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Vastaa' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page
      .getByPlaceholder('Kirjoita viesti...')
      .fill('Owner replying to own thread');

    await page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Wait for potential notification
    await page.waitForTimeout(3000);

    // Check inbox again - should not have a new notification
    await page.goto(`${BASE_URL}/inbox`);
    await page.waitForLoadState('domcontentloaded');

    const finalNotifications = await page.locator('.notification-item').count();

    console.log(`Final notification count: ${finalNotifications}`);

    // PBI-065: Owner should NOT receive notification for their own reply
    expect(finalNotifications).toBeLessThanOrEqual(initialNotifications);

    console.log(
      '✓ PBI-065: Thread owner did not receive notification for their own reply',
    );
  });
});
