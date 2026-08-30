/**
 * Journey: existingUser creates a clock on a site they own, and steps its
 * value.
 *
 * `specs/clock/spec.md` governs the dial: an interactive Clock is a
 * `role="slider"` element the reader can click or key through, announcing its
 * label and value through `aria-*` attributes. The spec finds it by that role
 * and name, and asserts only what the reader observes — the announced value
 * moving, and it surviving a reload.
 */
import type { Browser, Page } from 'playwright';
import { t } from 'src/utils/i18n';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

/**
 * A seeded site existingUser owns, with the Clocks tool switched on so the
 * rail carries the way in. The reset recursively deletes every document under
 * `sites`, its `clocks` subcollections included, so the site carries no clock
 * before the journey creates one.
 */
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
  // 1. Arrive at the site, and follow the rail to its clocks.
  await page.goto(`/sites/${SITE_KEY}`);
  const clocksLink = page.getByRole('link', { name: t('site:clocks.title') });
  await expect
    .poll(() => clocksLink.isVisible(), { timeout: 30_000 })
    .toBe(true);
  await clocksLink.click();
  await page.waitForURL(`**/sites/${SITE_KEY}/clocks`, { timeout: 30_000 });

  // 2. Follow the page's way to the create form.
  const newClockLink = page.getByRole('link', {
    name: t('actions:create.clock'),
  });
  await expect
    .poll(() => newClockLink.isVisible(), { timeout: 30_000 })
    .toBe(true);

  // 3. Open the create-clock form, and submit it with its default label.
  await newClockLink.click();
  const submitButton = page.locator('form button[type="submit"]');
  await submitButton.waitFor({ state: 'visible', timeout: 30_000 });
  await submitButton.click();

  // Submitting navigates back to the clocks page, where the new clock lists.
  await page.waitForURL(`**/sites/${SITE_KEY}/clocks`, { timeout: 30_000 });

  // 4. Find the dial by its accessible role and name, and read its start value.
  const label = t('site:clocks.create.default');
  const dial = page.getByRole('slider', { name: label });
  await expect.poll(() => dial.isVisible(), { timeout: 30_000 }).toBe(true);
  await expect
    .poll(() => dial.getAttribute('aria-valuenow'), { timeout: 15_000 })
    .toBe('0');

  // 5. Step the clock. A click is the primary, discoverable way to step it —
  // the one a reader reaches for before the keyboard path the spec also
  // grants it.
  await dial.click();
  await expect
    .poll(() => dial.getAttribute('aria-valuenow'), { timeout: 15_000 })
    .toBe('1');

  // 6. The stepped value survives a reload — Firestore, not local state, held
  // it. The journey observes this through the same accessible dial, not a
  // database read.
  //
  // The dial announces the step from its own state the moment it is clicked,
  // while the write behind it is still in flight, so the reload goes inside
  // the poll: a reader who came back to a stale page would look again.
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
