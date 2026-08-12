import { expect, test } from '@playwright/test';

/**
 * What needs a browser is the derivation: which theme the root carries when the
 * document has no override, and that the write and the event follow from it.
 *
 * Spec: specs/design-system/components/cn-theme-switch/spec.md
 */

const BOOK = '/components/cn-theme-switch';

const rootScheme = () =>
  document.documentElement.style.colorScheme || '(unset)';

async function activate(page: import('@playwright/test').Page) {
  // The control is an island: a click before it hydrates changes nothing.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    window.addEventListener('cn-theme-change', () => {
      document.body.dataset.themeChanged = 'yes';
    });
  });
  await page.getByRole('button', { name: 'Switch theme' }).click();
}

test.describe('with no colour scheme on the root', () => {
  test('a light preference flips to dark, and reports it', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(BOOK);
    await expect(page.evaluate(rootScheme)).resolves.toBe('(unset)');

    await activate(page);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
    await expect(page.locator('body')).toHaveAttribute(
      'data-theme-changed',
      'yes',
    );
  });

  test('a dark preference flips to light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);

    await activate(page);

    await expect(page.evaluate(rootScheme)).resolves.toBe('light');
  });

  /*
   * `prefers-color-scheme` resolves to light for a reader who expresses no
   * preference, and `color-scheme: dark light` paints what the reader prefers,
   * so this document is light and the activation reaches dark.
   */
  test('no preference flips to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'no-preference' });
    await page.goto(BOOK);

    await activate(page);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
  });
});

test('the control keeps its size through an activation', async ({ page }) => {
  await page.goto(BOOK);
  const button = page.getByRole('button', { name: 'Switch theme' });
  await button.scrollIntoViewIfNeeded();
  const before = await button.boundingBox();

  await activate(page);

  const after = await button.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
});

test.describe('with a colour scheme on the root', () => {
  test('the root value flips, and the change is reported', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);
    await page.evaluate(() => {
      document.documentElement.style.colorScheme = 'light';
    });

    await activate(page);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
    await expect(page.locator('body')).toHaveAttribute(
      'data-theme-changed',
      'yes',
    );
  });

  test('a second activation returns to the first theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);
    await page.evaluate(() => {
      document.documentElement.style.colorScheme = 'light';
    });

    await activate(page);
    await page.getByRole('button', { name: 'Switch theme' }).click();

    await expect(page.evaluate(rootScheme)).resolves.toBe('light');
  });
});
