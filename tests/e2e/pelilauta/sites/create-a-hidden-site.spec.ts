/**
 * Journey: existingUser creates a hidden site.
 *
 * `docs/acceptance-testing-workplan.md` carries the steps. Hidden is observable
 * in one place — the public listing at `/sites`, which `/api/sites` builds from
 * the sites where `hidden` is false.
 */
import type { Browser, Page } from 'playwright';
import { t } from 'src/utils/i18n';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage, uniqueSiteName } from '../harness';

/** A public seed site, listed at `/sites` every run. */
const PUBLIC_SEED_SITE = 'The Gloamroad Company';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage());
});

afterAll(async () => {
  await browser?.close();
});

it('creates a hidden site, lands on it, and stays out of the public listing', async () => {
  const name = uniqueSiteName('hidden site');

  // 1. Open the options, switch hidden on, and name the site.
  await page.goto('/create/site');
  const nameField = page.locator('form input[name="name"]');
  await nameField.waitFor({ state: 'visible' });

  await page.getByRole('switch', { name: t('actions:show.options') }).check();
  await page.getByRole('switch', { name: t('entries:site.hidden') }).check();

  await nameField.fill(name);
  await nameField.blur();

  const address = page.locator('form code');
  await expect
    .poll(() => address.textContent(), { timeout: 15_000 })
    .toMatch(/\/sites\/[a-z0-9-]{3,}$/);
  const promisedKey = (await address.textContent())?.split('/').pop();

  // 2. Submit, and land on the new site's page.
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(`**/sites/${promisedKey}`);

  const frontPageHeading = page
    .locator('article.surface')
    .getByRole('heading', { name, level: 1 });
  await expect
    .poll(() => frontPageHeading.isVisible(), { timeout: 30_000 })
    .toBe(true);

  // 3. The public listing does not show the site. A public seed site standing
  // in the same listing is what tells absence apart from a listing that never
  // rendered.
  await page.goto('/sites');
  await expect
    .poll(
      () => page.getByRole('link', { name: PUBLIC_SEED_SITE }).isVisible(),
      {
        timeout: 30_000,
      },
    )
    .toBe(true);
  expect(await page.getByRole('link', { name }).count()).toBe(0);
});
