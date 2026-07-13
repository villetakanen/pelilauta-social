import { expect, test } from '@playwright/test';

test.describe('Sitemap', () => {
  test('should include public sites', async ({ request }) => {
    const response = await request.get('http://localhost:4321/sitemap.xml');
    expect(response.status()).toBe(200);

    const content = await response.text();

    // Verify XML structure
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );

    // Verify public site is included
    expect(content).toContain(
      '<loc>http://localhost:4321/sites/e2e-public-test-site</loc>',
    );
  });

  test('should include pages from public sites', async ({ page }) => {
    const response = await page.goto('http://localhost:4321/sitemap.xml');
    expect(response?.status()).toBe(200);

    const content = await page.content();

    // Verify public site page is included
    expect(content).toContain(
      '<loc>http://localhost:4321/sites/e2e-public-test-site/public-page</loc>',
    );

    // Verify priority is set for site pages
    const sitePageRegex =
      /<url><loc>http:\/\/localhost:4321\/sites\/e2e-public-test-site\/public-page<\/loc><priority>0\.5<\/priority><\/url>/;
    expect(content).toMatch(sitePageRegex);
  });

  test('should not include hidden sites', async ({ page }) => {
    const response = await page.goto('http://localhost:4321/sitemap.xml');
    expect(response?.status()).toBe(200);

    const content = await page.content();

    // Verify hidden site is NOT included
    expect(content).not.toContain('/sites/e2e-test-site');
  });

  test('should not include pages from hidden sites', async ({ page }) => {
    const response = await page.goto('http://localhost:4321/sitemap.xml');
    expect(response?.status()).toBe(200);

    const content = await page.content();

    // Verify pages from hidden site are NOT included
    expect(content).not.toContain('/sites/e2e-test-site/front-page');
    expect(content).not.toContain('/sites/e2e-test-site/test-page');
  });

  test('should include static pages with correct priorities', async ({
    page,
  }) => {
    const response = await page.goto('http://localhost:4321/sitemap.xml');
    expect(response?.status()).toBe(200);

    const content = await page.content();

    // Verify static pages with priorities
    expect(content).toMatch(
      /<url><loc>http:\/\/localhost:4321\/<\/loc><priority>0\.9<\/priority><\/url>/,
    );
    expect(content).toMatch(
      /<url><loc>http:\/\/localhost:4321\/sites<\/loc><priority>0\.8<\/priority><\/url>/,
    );
    expect(content).toMatch(
      /<url><loc>http:\/\/localhost:4321\/channels<\/loc><priority>0\.8<\/priority><\/url>/,
    );
  });

  test('should include public site with correct priority', async ({ page }) => {
    const response = await page.goto('http://localhost:4321/sitemap.xml');
    expect(response?.status()).toBe(200);

    const content = await page.content();

    // Verify public site has priority 0.6
    const siteRegex =
      /<url><loc>http:\/\/localhost:4321\/sites\/e2e-public-test-site<\/loc><priority>0\.6<\/priority><\/url>/;
    expect(content).toMatch(siteRegex);
  });

  test('should have correct content type and caching headers', async ({
    page,
  }) => {
    const response = await page.goto('http://localhost:4321/sitemap.xml');
    expect(response?.status()).toBe(200);

    // Verify content type
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('application/xml');

    // Verify caching headers are present
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
  });
});
