import { expect, test } from '@playwright/test';

test.describe('Channels Page', () => {
  test('should load channels page with all content', async ({ page }) => {
    // Navigate to the channels page
    await page.goto('http://localhost:4321/channels/');

    // Verify the page title
    await expect(page).toHaveTitle(/Keskustelualueet/);

    // Verify the main heading is present
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    // Verify that channel cards are present (at least the test channels we know about)
    const channelCards = page.locator('article.cols-2');
    const channelCount = await channelCards.count();
    expect(channelCount).toBeGreaterThanOrEqual(3); // At least pelilauta, yleinen, and test-channel

    // Verify specific channels are displayed
    await expect(page.locator('a[href="/channels/pelilauta"]')).toBeVisible();
    await expect(page.locator('a[href="/channels/yleinen"]')).toBeVisible();
    await expect(
      page.locator('a[href="/channels/test-channel"]'),
    ).toBeVisible();

    // Verify that channel information is displayed (latest threads)
    await expect(page.locator('text=Uusin ketju').first()).toBeVisible();

    // Verify that thread links are present and functional
    const threadLinks = page.locator('a[href^="/threads/"]');
    await expect(threadLinks.first()).toBeVisible();
  });

  test('should load quickly without loading spinners', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to the channels page
    await page.goto('http://localhost:4321/channels/');

    // Wait for the main content to be visible
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Verify it loads within a reasonable time (should be much faster than the old N+1 approach)
    expect(loadTime).toBeLessThan(3000); // 3 seconds should be plenty for local testing

    // Verify no loading spinners are present (since we removed server:defer)
    await expect(page.locator('[data-testid="loading"]')).toHaveCount(0);
    await expect(page.locator('.loading')).toHaveCount(0);
    await expect(page.locator('text=Loading')).toHaveCount(0);
  });

  test('should display channel statistics correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/channels/');

    // Wait for the page to load
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    // Find a channel with threads (like Pelilauta)
    const pelilautaCard = page.locator('article.cols-2').filter({
      has: page.locator('a[href="/channels/pelilauta"]'),
    });

    await expect(pelilautaCard).toBeVisible();

    // Verify that thread information is displayed
    await expect(pelilautaCard.locator('text=Uusin ketju')).toBeVisible();

    // Verify that dates are displayed for threads
    await expect(
      pelilautaCard.locator('text=/2025-\\d{2}-\\d{2}/').first(),
    ).toBeVisible();

    // Verify ProfileLink components are rendered (these are Svelte components)
    await expect(
      pelilautaCard
        .locator('astro-island[component-url*="ProfileLink"]')
        .first(),
    ).toBeVisible();
  });

  test('should handle channels with no threads gracefully', async ({
    page,
  }) => {
    await page.goto('http://localhost:4321/channels/');

    // Wait for the page to load
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    // Find the test channel which has no threads
    const testChannelCard = page.locator('article.cols-2').filter({
      has: page.locator('a[href="/channels/test-channel"]'),
    });

    await expect(testChannelCard).toBeVisible();

    // Verify the channel is displayed even without threads
    await expect(testChannelCard.locator('text=Test Channel')).toBeVisible();
    await expect(
      testChannelCard.locator('text=Channel for API testing'),
    ).toBeVisible();

    // Verify it shows the fallback message for no threads
    await expect(
      testChannelCard.locator(
        'text=(Viimeisin kommentti, on uusimpaan ketjuun)',
      ),
    ).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('http://localhost:4321/channels/');

    // Wait for the page to load
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    // Test channel navigation
    const pelilautaLink = page.locator('a[href="/channels/pelilauta"]');
    await expect(pelilautaLink).toBeVisible();

    // Click on a channel link and verify navigation works
    await pelilautaLink.click();

    // Wait for navigation to complete
    await page.waitForURL('**/channels/pelilauta');

    // Should navigate to the channel page
    await expect(page.url()).toContain('/channels/pelilauta');

    // Go back to channels page
    await page.goBack();
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    // Test that thread links exist and are clickable (but don't navigate to avoid complex setup)
    const threadLinks = page.locator('a[href^="/threads/"]');
    const threadCount = await threadLinks.count();

    if (threadCount > 0) {
      // Just verify the first thread link is present and has correct attributes
      const firstThreadLink = threadLinks.first();
      await expect(firstThreadLink).toBeVisible();

      const href = await firstThreadLink.getAttribute('href');
      expect(href).toMatch(/^\/threads\/.+/);
    }
  });

  test('should display correct channel categories', async ({ page }) => {
    await page.goto('http://localhost:4321/channels/');

    // Wait for the page to load
    await expect(
      page.locator('h2').filter({ hasText: 'Pelilauta' }),
    ).toBeVisible();

    // Verify the category section exists
    const categorySection = page
      .locator('section.content-listing')
      .filter({ hasText: 'Pelilauta' })
      .first();
    await expect(categorySection).toBeVisible();

    // Verify the category header
    await expect(categorySection.locator('header h2')).toHaveText('Pelilauta');

    // Verify channels are grouped under the category
    const channelsInCategory = categorySection.locator('article.cols-2');
    const channelCount = await channelsInCategory.count();
    expect(channelCount).toBeGreaterThanOrEqual(3); // At least pelilauta, yleinen, and test-channel
  });

  test('should respond to API endpoint correctly', async ({ page }) => {
    // Test the new aggregated API endpoint directly
    const response = await page.request.get(
      'http://localhost:4321/api/channels-with-stats.json',
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Verify the structure of the aggregated data
    const firstChannel = data[0];
    expect(firstChannel).toHaveProperty('name');
    expect(firstChannel).toHaveProperty('slug');
    expect(firstChannel).toHaveProperty('stats');
    expect(firstChannel.stats).toHaveProperty('latestThread');
    expect(firstChannel.stats).toHaveProperty('latestUpdatedThread');

    // Verify ETag header is present for caching
    expect(response.headers()).toHaveProperty('etag');
    expect(response.headers()['cache-control']).toContain('s-maxage=120');
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock a network error for the channels API
    await page.route('**/api/channels-with-stats.json', (route) => {
      route.abort('failed');
    });

    await page.goto('http://localhost:4321/channels/');

    // The page should still load (with empty channels list)
    await expect(page.locator('body')).toBeVisible();

    // Should not show any uncaught error messages
    const errorMessages = page.locator('text=/error|Error|ERROR/');
    await expect(errorMessages).toHaveCount(0);

    // Should show empty state or handle gracefully
    // (The current implementation should show an empty channels list)
  });
});
