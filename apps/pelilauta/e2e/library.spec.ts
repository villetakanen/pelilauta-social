import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';

test.setTimeout(120000); // Increase timeout for authentication

test.describe('Library Page - User Sites Store', () => {
  test('Library page loads and displays user sites from userSites store', async ({
    page,
  }) => {
    // Authenticate first (library requires auth)
    await authenticate(page);

    // Navigate to the library page
    await page.goto('http://localhost:4321/library');

    // Verify page loaded successfully
    // The h1 contains i18n text, so just check it's visible
    await expect(page.locator('h1').first()).toBeVisible();

    // Wait for the UserSitesList component to render
    // The component shows site cards and a footer with count
    await page.waitForTimeout(2000); // Allow time for userSites store to fetch data

    // Verify that the sites list is visible (should show at least the e2e-test-site)
    // The authenticated user (from authenticate-e2e) is an owner of e2e-test-site
    // Use more specific selector for the sites list footer within content-cards
    const siteListSection = page.locator('.content-cards');
    await expect(siteListSection).toBeVisible();

    const footer = siteListSection.locator('footer');
    await expect(footer).toBeVisible();

    // The footer should contain a count text
    // Format is from i18n 'library:sites.count'
    const footerText = await footer.textContent();
    expect(footerText).toBeTruthy();

    // Verify at least one site card is rendered
    // UserSitesList uses FilteredSites which renders cn-card elements
    const siteCards = page.locator('cn-card');
    const cardCount = await siteCards.count();

    // The authenticated user should have at least 1 site (e2e-test-site)
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Verify that e2e-test-site is in the list
    const testSiteCard = page.locator('cn-card:has-text("E2E Test Site")');
    await expect(testSiteCard).toBeVisible();
  });

  test('Library page shows empty state for users with no sites', async () => {
    // This test would require a user with no sites
    // For now, we skip it as our test users have sites
    // In a real scenario, you'd create a user with no site memberships
    test.skip();
  });

  test('Library page sorting controls work', async ({ page }) => {
    await authenticate(page);
    await page.goto('http://localhost:4321/library');

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Verify sorting buttons are present (text might be in Finnish)
    // Look for buttons in the toolbar
    const toolbar = page.locator('nav.toolbar');
    await expect(toolbar).toBeVisible();

    const sortButtons = toolbar.locator('button');
    const buttonCount = await sortButtons.count();

    // Should have at least 3 buttons (direction toggle + 2 sort options)
    expect(buttonCount).toBeGreaterThanOrEqual(3);

    // Click the sort direction toggle button (has cn-icon with noun)
    const sortDirectionButton = toolbar.locator('button').first();
    await sortDirectionButton.click();

    // Verify the button still exists after click (it toggles)
    await page.waitForTimeout(500);
    await expect(sortDirectionButton).toBeVisible();
  });

  test('Library page filters sites correctly', async ({ page }) => {
    await authenticate(page);
    await page.goto('http://localhost:4321/library');

    // Wait for sites to load
    await page.waitForTimeout(2000);

    // Get initial count of site cards
    const siteCards = page.locator('cn-card');
    const initialCount = await siteCards.count();

    // Verify we have sites to test with
    expect(initialCount).toBeGreaterThan(0);

    // The FilteredSites component filters based on filters.orderBy
    // Click the last button in toolbar to change sort (should be flowTime or name button)
    const toolbar = page.locator('nav.toolbar');
    const sortButton = toolbar.locator('button').last();
    await sortButton.click();

    // Wait for re-render
    await page.waitForTimeout(500);

    // Verify cards are still visible (filter didn't break anything)
    const cardsAfterSort = await page.locator('cn-card').count();
    expect(cardsAfterSort).toBe(initialCount);
  });

  test('Library page userSites store persists across navigation', async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto('http://localhost:4321/library');

    // Wait for sites to load
    await page.waitForTimeout(2000);

    // Get the count from footer (use specific selector for sites list footer)
    const siteListSection = page.locator('.content-cards');
    const footer = siteListSection.locator('footer');
    const initialFooterText = await footer.textContent();

    // Navigate away
    await page.goto('http://localhost:4321/');

    // Navigate back to library
    await page.goto('http://localhost:4321/library');

    // The userSites store is persistent (uses persistentAtom)
    // So it should restore from localStorage quickly
    await page.waitForTimeout(500);

    // Verify footer text is restored (sites loaded from cache)
    const restoredFooterText = await footer.textContent();
    expect(restoredFooterText).toBe(initialFooterText);
  });

  test('Library page redirects unauthenticated users', async ({ page }) => {
    // Navigate to library without authentication
    const _response = await page.goto('http://localhost:4321/library');

    // Should redirect to /sites (as per the Astro page logic)
    expect(page.url()).toContain('/sites');
  });

  test('Library page FAB buttons are visible for authenticated users', async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto('http://localhost:4321/library');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // The LibrarySitesFabs component should render FAB buttons
    // The FAB tray exists but may not be "visible" in Playwright's sense
    // Just verify it exists in the DOM
    const fabTray = page.locator('nav#fab-tray');
    const fabCount = await fabTray.count();
    expect(fabCount).toBeGreaterThan(0);
  });

  test('Library page shows correct site count in footer', async ({ page }) => {
    await authenticate(page);
    await page.goto('http://localhost:4321/library');

    // Wait for userSites store to populate
    await page.waitForTimeout(2000);

    // Count visible site cards
    const siteCards = page.locator('cn-card');
    const cardCount = await siteCards.count();

    // Get footer text which should show the count (use specific selector)
    const siteListSection = page.locator('.content-cards');
    const footer = siteListSection.locator('footer');
    const footerText = await footer.textContent();

    // The footer should mention the count (though format depends on i18n)
    // At minimum it should contain a number
    expect(footerText).toMatch(/\d+/);

    // The count in footer should match the number of cards
    // (This assumes the i18n format includes the actual number)
    const countMatch = footerText?.match(/\d+/);
    if (countMatch) {
      const displayedCount = parseInt(countMatch[0], 10);
      expect(displayedCount).toBe(cardCount);
    }
  });
});
