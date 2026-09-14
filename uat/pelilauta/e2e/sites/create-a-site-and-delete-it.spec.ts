/**
 * Journey: existingUser creates a site, and deletes it from the settings danger
 * zone.
 *
 * The spec asserts what the reader observes: the settings entry on the new site,
 * the confirmation the danger zone demands, the library the deletion lands on,
 * and the site's absence from it.
 */
import type { Browser, Page } from 'playwright';
import { t } from 'src/utils/i18n';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage, uniqueSiteName } from '../harness';

/** The phrase the danger zone shows as the field's placeholder and demands back. */
const CONFIRM_PHRASE = 'Olen Aivan Varma';

/** A seeded site existingUser owns; `seed/sites.json` carries it. */
const SEEDED_SITE_NAME = 'The Gloamroad Company';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage());
});

afterAll(async () => {
  await browser?.close();
});

it('creates a site, then deletes it from the danger zone', async () => {
  const name = uniqueSiteName('delete a site');

  // 1. Create the site, as the create-a-site journey does.
  await page.goto('/create/site');
  const nameField = page.locator('form input[name="name"]');
  await nameField.waitFor({ state: 'visible' });
  await nameField.fill(name);
  await nameField.blur();

  const address = page.locator('form code');
  await expect
    .poll(() => address.textContent(), { timeout: 15_000 })
    .toMatch(/\/sites\/[a-z0-9-]{3,}$/);
  const siteKey = (await address.textContent())?.split('/').pop();

  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(`**/sites/${siteKey}`);

  // 2. The owner's tools carry a settings entry; follow it. The account's
  // settings link shares the name, so the address tells them apart.
  const settingsLink = page.locator(`a[href="/sites/${siteKey}/settings"]`, {
    hasText: t('site:settings.title'),
  });
  await expect
    .poll(() => settingsLink.isVisible(), { timeout: 30_000 })
    .toBe(true);
  await settingsLink.click();
  await page.waitForURL(`**/sites/${siteKey}/settings`, { timeout: 30_000 });

  // 3. Open the danger zone. The delete action stays disabled until the field
  // carries the exact phrase.
  const dangerZone = page.locator('details', {
    has: page.getByText(t('app:meta.dangerZone')),
  });
  await dangerZone.locator('summary').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await dangerZone.locator('summary').click();

  const deleteButton = dangerZone.getByRole('button', {
    name: t('site:dangerZone.deleteSiteAction'),
  });
  await deleteButton.waitFor({ state: 'visible', timeout: 15_000 });
  expect(await deleteButton.isDisabled()).toBe(true);

  const confirmField = dangerZone.locator('input[name="deleteConfirm"]');
  await confirmField.fill(CONFIRM_PHRASE);
  await expect
    .poll(() => deleteButton.isEnabled(), { timeout: 15_000 })
    .toBe(true);

  // 4. Delete. The application lands on the library and tells what it did.
  await deleteButton.click();
  await page.waitForURL('**/library', { timeout: 30_000 });

  const snack = page
    .getByRole('status')
    .filter({ hasText: t('site:snacks.siteDeleted', { name }) });
  await expect.poll(() => snack.isVisible(), { timeout: 30_000 }).toBe(true);

  // 5. The library no longer lists the site. The listing has rendered once a
  // seeded site the reader owns is on it; an empty page would pass the absence
  // check for the wrong reason.
  const seededSite = page.getByRole('link', { name: SEEDED_SITE_NAME });
  await expect
    .poll(() => seededSite.isVisible(), { timeout: 30_000 })
    .toBe(true);
  expect(await page.getByRole('link', { name }).count()).toBe(0);
});
