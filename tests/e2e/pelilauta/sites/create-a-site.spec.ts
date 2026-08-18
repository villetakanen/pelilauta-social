/**
 * Journey: existingUser creates a site.
 *
 * The spec asserts what the reader observes: the address the form promised, the
 * site's front page, and the library listing.
 */
import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage, uniqueSiteName } from '../harness';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage());
});

afterAll(async () => {
  await browser?.close();
});

it('creates a site, lands on it, and finds it in the library', async () => {
  const name = uniqueSiteName('create a site');

  // 1. Open the site creation page and name the site.
  await page.goto('/create/site');
  const nameField = page.locator('form input[name="name"]');
  await nameField.waitFor({ state: 'visible' });
  await nameField.fill(name);
  await nameField.blur();

  // The form derives the address from the name on blur, and shows it. That
  // promise is what the journey holds the application to below.
  const address = page.locator('form code');
  await expect
    .poll(() => address.textContent(), { timeout: 15_000 })
    .toMatch(/\/sites\/[a-z0-9-]{3,}$/);
  const promisedKey = (await address.textContent())?.split('/').pop();

  // 2. Submit, and land on the new site's page.
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(`**/sites/${promisedKey}`);

  // The front page the application creates carries the site's name as its
  // heading. `article.surface` is the page's content, not the chrome around it.
  const frontPageHeading = page
    .locator('article.surface')
    .getByRole('heading', { name, level: 1 });
  await expect
    .poll(() => frontPageHeading.isVisible(), { timeout: 30_000 })
    .toBe(true);

  // 3. The library listing shows the site.
  await page.goto('/library');
  const listedSite = page.getByRole('link', { name });
  await expect
    .poll(() => listedSite.isVisible(), { timeout: 30_000 })
    .toBe(true);
});
