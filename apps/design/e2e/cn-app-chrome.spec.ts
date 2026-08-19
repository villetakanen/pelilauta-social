import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about the chrome box's block size: whether the
 * keyboard measurement reaches the page at all, and whether the box shortens by
 * exactly what chrome publishes.
 *
 * A headless browser opens no keyboard, so the inset is published here rather
 * than typed for. That is the whole contract on this side: chrome states a
 * depth, and the box gives up that much. The arithmetic behind the depth is a
 * pure function, checked in packages/design-system/test/keyboard-inset.test.ts.
 *
 * The shell mounts one CnAppChrome on every book page, so any page serves.
 */

const BOOK = '/components/cn-app-bar';

const chrome = (page: Page) => page.locator('.app-chrome');

const inset = (page: Page) =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--cn-keyboard-inset')
      .trim(),
  );

/** The box's rendered block size, which is what a part at its end stands on. */
const blockSize = async (page: Page) =>
  (await chrome(page).boundingBox())?.height;

test('with no keyboard, the box spans the viewport', async ({ page }) => {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');

  // The desktop browser's two viewport figures agree, so chrome measures zero
  // and the box keeps the whole viewport.
  expect(await inset(page)).toBe('0px');
  expect(await blockSize(page)).toBeCloseTo(
    await page.evaluate(() => window.innerHeight),
    0,
  );
});

test('a published inset shortens the box by that much', async ({ page }) => {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
  const full = await blockSize(page);

  await page.evaluate(() =>
    document.documentElement.style.setProperty('--cn-keyboard-inset', '300px'),
  );

  expect(await blockSize(page)).toBeCloseTo((full ?? 0) - 300, 0);
});

test('the box gives the space back when the keyboard goes', async ({
  page,
}) => {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
  const full = await blockSize(page);

  await page.evaluate(() =>
    document.documentElement.style.setProperty('--cn-keyboard-inset', '300px'),
  );
  await page.evaluate(() =>
    document.documentElement.style.setProperty('--cn-keyboard-inset', '0px'),
  );

  expect(await blockSize(page)).toBeCloseTo(full ?? 0, 0);
});

test('the application declares that the keyboard resizes its content', async ({
  page,
}) => {
  await page.goto(BOOK);

  // Where a browser honours this, it shortens the layout viewport itself and
  // the measurement above stays at zero. It is the mechanism chrome prefers,
  // so its absence would leave iOS the only platform the box answers on.
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /interactive-widget=resizes-content/,
  );
});
