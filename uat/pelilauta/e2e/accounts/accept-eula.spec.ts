/**
 * Journey: A reader who has signed in but has no account accepts the terms.
 *
 * `newUser` has no account or profile in the default seed. The journey stays
 * in the browser: the duplicate-name message proves the Firestore lookup, and
 * the reader's settings prove the accepted profile is available afterwards.
 */
import type { Browser, Page } from 'playwright';
import { toFid } from 'src/utils/toFid';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage('newUser'));
});

afterAll(async () => {
  await browser?.close();
});

it('presents the terms, rejects a taken nickname, and activates the profile', async () => {
  // A reader without an accepted EULA cannot continue to a member route.
  await page.goto('/library');
  await page.waitForURL('**/onboarding');

  const form = page.locator('form.eula-form');
  await expect.poll(() => form.isVisible()).toBe(true);

  // The rendered Markdown lives in the prose region rather than inheriting a
  // legacy wrapper, and its first promise is readable to the new member.
  const terms = form.locator('article.text-prose');
  await expect.poll(() => terms.isVisible()).toBe(true);
  await expect
    .poll(() =>
      terms.getByText('Luomme sinulle tilin ja profiilin.').isVisible(),
    )
    .toBe(true);

  const nickname = form.getByLabel('Nick');
  await expect
    .poll(() => nickname.inputValue(), { timeout: 15_000 })
    .toMatch(/.+/);

  // The seeded member owns this derived handle, so leaving it rejects the
  // nickname before the acceptance request can be sent.
  await nickname.fill('Koekayttaja');
  await nickname.blur();
  const takenMessage = form.getByText('Tunnus on käytössä. Valitse toinen.');
  await expect.poll(() => takenMessage.isVisible()).toBe(true);
  await expect
    .poll(() =>
      form.getByRole('button', { name: 'Hyväksy ja jatka' }).isDisabled(),
    )
    .toBe(true);

  const acceptedNick = `Uat Eula ${Date.now()}`;
  const acceptedHandle = toFid(acceptedNick);
  await nickname.fill(acceptedNick);
  await nickname.blur();
  await expect.poll(() => takenMessage.isVisible()).toBe(false);

  const accept = form.getByRole('button', { name: 'Hyväksy ja jatka' });
  await expect.poll(() => accept.isEnabled()).toBe(true);
  await accept.click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 });

  // Settings reads the saved profile through the application, so the derived
  // handle confirms the completed onboarding survives the redirect.
  await page.goto('/settings');
  await expect
    .poll(
      () =>
        page
          .getByRole('article')
          .getByText(acceptedHandle, { exact: true })
          .isVisible(),
      {
        timeout: 30_000,
      },
    )
    .toBe(true);
});
