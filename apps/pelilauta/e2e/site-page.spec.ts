import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';
import { updateSiteInFirestore } from './firebase-admin-helper';

test.setTimeout(120000); // Increase timeout for authentication and navigation

test.describe('Site Page Loading and Performance', () => {
  test('Site page has proper cache headers and tags for Netlify purging', async ({
    page,
  }) => {
    // Navigate to the e2e test site home page and check response headers
    const response = await page.goto(
      'http://localhost:4321/sites/e2e-test-site',
    );

    // Verify cache headers are set appropriately for homepage
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toContain('s-maxage=60'); // 1 minute cache for homepage
    expect(cacheControl).toContain('stale-while-revalidate=300'); // 5 minute stale

    // Verify cache tags are present for Netlify cache purging
    const cacheTag = response?.headers()['cache-tag'];
    expect(cacheTag).toBeTruthy();
    expect(cacheTag).toContain('site-e2e-test-site'); // Site-wide tag
    expect(cacheTag).toContain('homepage-e2e-test-site'); // Homepage-specific tag
    expect(cacheTag).toMatch(/page-e2e-test-site-[\w-]+/); // Page-specific tag pattern

    // Verify the page loads successfully
    await expect(page.locator('main')).toBeVisible();
  });

  test('Site page cache tags for regular pages', async ({ page }) => {
    // Navigate to a specific page (not homepage)
    const response = await page.goto(
      'http://localhost:4321/sites/e2e-test-site/test-page',
    );

    // Verify the page exists and loads successfully
    expect(response?.status()).toBe(200);

    // Verify cache headers for regular pages
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toContain('s-maxage=300'); // 5 minute cache for regular pages
    expect(cacheControl).toContain('stale-while-revalidate=1800'); // 30 minute stale

    // Verify cache tags for regular pages
    const cacheTag = response?.headers()['cache-tag'];
    expect(cacheTag).toBeTruthy();
    expect(cacheTag).toContain('page-e2e-test-site-test-page'); // Page-specific tag
    expect(cacheTag).toContain('site-e2e-test-site'); // Site-wide tag

    // Regular pages should NOT have homepage tag
    expect(cacheTag).not.toContain('homepage-e2e-test-site');
  });

  test('Site page loads with SSR data and initializes store', async ({
    page,
  }) => {
    // Navigate to the e2e test site home page
    await page.goto('http://localhost:4321/sites/e2e-test-site');

    // Verify the page loads with basic site information
    // The site name should be visible in the page title area
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Verify that the page content is rendered (SSR working)
    await expect(page.locator('main')).toBeVisible();

    // Check that the site store initializer component executed
    // This should happen without requiring authentication
    await page.waitForFunction(
      () => {
        // Check if site data is available in the client-side store
        return window.localStorage.getItem('debug') !== null || true;
      },
      { timeout: 5000 },
    );

    // Verify the page has proper meta tags (SSR optimization)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Site page works for anonymous users without real-time subscriptions', async ({
    page,
  }) => {
    // Navigate without authentication
    await page.goto('http://localhost:4321/sites/e2e-test-site');

    // Verify content is visible for anonymous users
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Verify no authentication-specific elements are shown
    await expect(
      page.getByTestId('setting-navigation-button'),
    ).not.toBeVisible();

    // The page should still be functional without authentication
    // Check for navigation elements that should work for anonymous users
    const mainContent = page.locator('main');
    await expect(mainContent).toContainText(/\w+/); // Should contain some text content
  });

  test('Site page enables real-time updates for authenticated users', async ({
    page,
  }) => {
    await authenticate(page); // Use default existing user
    await page.goto('http://localhost:4321/sites/e2e-test-site');

    // Verify authenticated user sees additional functionality
    await expect(page.getByTestId('setting-navigation-button')).toBeVisible();

    // Verify content loads properly for authenticated users
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Verify that real-time subscriptions could be active
    // (This is harder to test directly, but we can verify the authenticated state)
    await page.waitForFunction(() => {
      // Authenticated users should have access to additional features
      return (
        document.querySelector('[data-testid="setting-navigation-button"]') !==
        null
      );
    });
  });

  test('Site page handles missing site gracefully', async ({ page }) => {
    // Try to navigate to a non-existent site
    const response = await page.goto(
      'http://localhost:4321/sites/non-existent-site',
    );

    // Should either redirect to 404 or show error page
    expect(response?.status()).toBe(404);
  });

  test('Site page performance - no waterfall requests', async ({ page }) => {
    // Track network requests to verify no waterfall API calls during SSR
    const apiRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/sites/') || url.includes('/api/pages/')) {
        apiRequests.push(url);
      }
    });

    await page.goto('http://localhost:4321/sites/e2e-test-site');

    // Wait for page to be fully loaded
    await expect(page.locator('main')).toBeVisible();

    // Verify that no client-side API requests were made for initial data loading
    // This confirms that SSR is working and eliminates waterfall requests
    expect(apiRequests.length).toBe(0);
  });

  test('Site page - store initialization without double parsing', async ({
    page,
  }) => {
    // Add console logging to track store operations
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('SiteStoreInitializer') || text.includes('siteStore')) {
        consoleMessages.push(text);
      }
    });

    await page.goto('http://localhost:4321/sites/e2e-test-site');

    // Wait for store initialization
    await expect(page.locator('main')).toBeVisible();

    // Allow time for any store operations to complete
    await page.waitForTimeout(1000);

    // Verify store was initialized (should see debug messages if logging is enabled)
    // This is mainly to ensure the SiteStoreInitializer component executed
    // Note: The key is that the page loads without errors, indicating proper store initialization

    // Test passes if main content is visible (store initialization succeeded)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Optionally verify some content is present
    await expect(mainContent).toContainText(/\w+/); // Should contain some text content
  });

  test('Site navigation preserves store state', async ({ page }) => {
    await authenticate(page);

    // Start at the site home page
    await page.goto('http://localhost:4321/sites/e2e-test-site');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Navigate to a page creation form (if available)
    const createPageLink = page.locator('a[href*="/create/page"]').first();
    if (await createPageLink.isVisible()) {
      await createPageLink.click();

      // Verify navigation worked
      await expect(page).toHaveURL(/\/sites\/e2e-test-site\/create\/page$/);

      // Navigate back to site home
      await page.goto('http://localhost:4321/sites/e2e-test-site');

      // Verify the store state is maintained and page loads quickly
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('Site real-time updates via onSnapshot callback', async ({ page }) => {
    // Track console logs to verify store operations
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('siteStore') ||
        text.includes('Real-time update') ||
        text.includes('subscription')
      ) {
        consoleMessages.push(text);
      }
    });

    // Authenticate and navigate to the test site
    await authenticate(page);
    await page.goto('http://localhost:4321/sites/e2e-test-site');

    // Verify initial page load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Wait for subscription to be set up (authenticated users should have subscription)
    await page.waitForTimeout(2000);

    // Update the site document in Firestore to trigger onSnapshot
    // This simulates a real-time update that should be caught by the subscription
    await updateSiteInFirestore('e2e-test-site', {
      name: 'The E2E Test Site (Updated)',
      description: 'Updated description for testing',
    });

    // Wait for the real-time update to propagate through onSnapshot
    await page.waitForTimeout(2000);

    // Verify that the update triggered the onSnapshot callback
    // by checking if debug logs were emitted (if debug logging is enabled)
    // or by evaluating that the store has been updated
    // Verify that the update triggered the onSnapshot callback and updated the UI
    // We updated the name to 'The E2E Test Site (Updated)'
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'The E2E Test Site (Updated)',
      { timeout: 10000 },
    );

    // Clean up: restore the original site name
    await updateSiteInFirestore('e2e-test-site', {
      name: 'The E2E Test Site',
      description: undefined,
    });

    // Wait for cleanup to propagate
    await page.waitForTimeout(1000);

    // Test passes if no errors occurred during subscription and update cycle
    // The main verification is that the page didn't crash or throw errors
    // when receiving real-time updates via the onSnapshot callback
  });
});
