/**
 * Verifies that an existing user creates a clock on an owned site and steps its
 * value.
 */
import type { Browser, Page } from 'playwright';
import { t } from 'src/utils/i18n';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

const SITE_KEY = 'gloamroad-company';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage());
});

afterAll(async () => {
  await browser?.close();
});

it('creates a clock and steps its value', async () => {
  await page.goto(`/sites/${SITE_KEY}`);
  const clocksLink = page.getByRole('link', { name: t('site:clocks.title') });
  await expect
    .poll(() => clocksLink.isVisible(), { timeout: 30_000 })
    .toBe(true);
  await clocksLink.click();
  await page.waitForURL(`**/sites/${SITE_KEY}/clocks`, { timeout: 30_000 });

  const newClockLink = page.getByRole('link', {
    name: t('actions:create.clock'),
  });
  await expect
    .poll(() => newClockLink.isVisible(), { timeout: 30_000 })
    .toBe(true);

  await newClockLink.click();
  const submitButton = page.locator('form button[type="submit"]');
  await submitButton.waitFor({ state: 'visible', timeout: 30_000 });
  await submitButton.click();

  await page.waitForURL(`**/sites/${SITE_KEY}/clocks`, { timeout: 30_000 });

  const label = t('site:clocks.create.default');
  const dial = page.getByRole('slider', { name: label });
  await expect.poll(() => dial.isVisible(), { timeout: 30_000 }).toBe(true);
  await expect
    .poll(() => dial.getAttribute('aria-valuenow'), { timeout: 15_000 })
    .toBe('0');

  await dial.click();
  await expect
    .poll(() => dial.getAttribute('aria-valuenow'), { timeout: 15_000 })
    .toBe('1');

  await expect
    .poll(
      async () => {
        await page.reload();
        const reloaded = page.getByRole('slider', { name: label });
        await reloaded.waitFor({ state: 'visible', timeout: 30_000 });
        return reloaded.getAttribute('aria-valuenow');
      },
      { timeout: 60_000, interval: 2_000 },
    )
    .toBe('1');
});

