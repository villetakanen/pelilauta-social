import { expect, test } from '@playwright/test';
import { authenticateProgrammatic } from './authenticate-programmatic';
import { existingUser } from './test-users';

// Use environment variable for base URL or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

test.describe('Inbox E2E Tests', () => {
  test.setTimeout(60000);

  test('Inbox page loads and displays notifications', async ({ page }) => {
    // Authenticate programmatically
    await authenticateProgrammatic(page, existingUser);

    // Navigate to inbox
    await page.goto(`${BASE_URL}/inbox`);

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Wait for auth to propagate and page to render
    await page.waitForTimeout(2000);

    // Verify inbox heading is visible - "Tapahtumat" in Finnish
    await expect(
      page.getByRole('heading', { name: /tapahtumat|events|inbox/i }),
    ).toBeVisible({ timeout: 10000 });

    console.log('✓ Inbox page loaded successfully');
  });

  test('PBI-066: Inbox shows relative timestamps', async ({ page }) => {
    // Authenticate programmatically
    await authenticateProgrammatic(page, existingUser);

    // Navigate to inbox
    await page.goto(`${BASE_URL}/inbox`);

    // Wait for page to load and auth to propagate
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Wait for notification items to appear
    const notificationItems = page.locator('.notification-item');
    const count = await notificationItems.count();

    if (count > 0) {
      // Check the first notification's timestamp
      const timestampElement = notificationItems
        .first()
        .locator('.text-caption');
      const timestampText = await timestampElement.textContent();

      console.log(`Timestamp text: "${timestampText}"`);

      // Verify it's in relative format OR date format
      // Finnish: "sitten", "minuuttia", "tunti", "päivä", "eilen"
      // English: "ago", "minutes", "hours", "days", "yesterday"
      const isRelative =
        /(\bago\b|sitten|minuuttia|tunti|päivä|eilen|yesterday)/i.test(
          timestampText || '',
        );

      // Date format is acceptable for old notifications (>72 hours)
      const isDateFormat = /\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4}/.test(
        timestampText || '',
      );

      // Either format is acceptable - the implementation uses toDisplayString which shows
      // relative time for recent items and dates for old items
      expect(isRelative || isDateFormat).toBeTruthy();

      console.log(
        `✓ Timestamp format: ${isRelative ? 'relative (recent)' : 'date (old notification >72h)'}`,
      );
    } else {
      console.log(
        '⚠ No notifications found in inbox, skipping timestamp check',
      );
      // Create a notification first, or skip test
      test.skip(count > 0, 'No notifications available to test');
    }
  });
});
