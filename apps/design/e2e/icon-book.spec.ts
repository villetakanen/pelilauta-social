import { expect, type Page, test } from '@playwright/test';

/**
 * The icon books in a browser. What needs one is the cascade: a size token
 * resolving to a box, `currentColor` reaching the artwork through inheritance, and
 * a `light-dark()` role resolving differently in the two scoped cells. Tier
 * precedence and the registries are asserted without a browser in
 * packages/design-system/test/icon-registry.test.ts.
 */

const COMPONENT_BOOK = '/components/cn-icon';
const PRINCIPLES_BOOK = '/principles/iconography';

// The square each size token produces at the default 16px root font size.
const SIZE_PX: Record<string, number> = {
  xsmall: 16,
  small: 24,
  medium: 36,
  large: 72,
  xlarge: 128,
};

const collectConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

const box = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { w: Math.round(rect.width), h: Math.round(rect.height) };
    });

const color = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).color);

test('every size token renders its square', async ({ page }) => {
  await page.goto(COMPONENT_BOOK);
  await expect(
    page.getByRole('heading', { name: 'CnIcon', level: 1 }),
  ).toBeVisible();

  for (const [size, px] of Object.entries(SIZE_PX)) {
    const { w, h } = await box(page, `[data-size="${size}"] .cn-icon`);
    expect(w, `${size} is square`).toBe(h);
    expect(Math.abs(w - px), `${size} is ${px}px`).toBeLessThanOrEqual(1);
  }
});

test('monochrome artwork takes the colour of the cell around it', async ({
  page,
}) => {
  await page.goto(COMPONENT_BOOK);

  const cell = (mode: string, role: string) =>
    `[data-mode="${mode}"][data-role="${role}"]`;

  // The icon states no colour, so the cell sets its computed colour.
  for (const role of [
    '--cn-color-text',
    '--cn-color-link',
    '--cn-color-error',
  ]) {
    expect(
      await color(page, `${cell('dark', role)} .cn-icon`),
      `${role} reaches the artwork`,
    ).toBe(await color(page, cell('dark', role)));
  }

  // Two roles in the same theme differ, and one role differs between themes.
  expect(
    await color(page, `${cell('dark', '--cn-color-text')} .cn-icon`),
  ).not.toBe(await color(page, `${cell('dark', '--cn-color-link')} .cn-icon`));
  expect(
    await color(page, `${cell('dark', '--cn-color-link')} .cn-icon`),
  ).not.toBe(await color(page, `${cell('light', '--cn-color-link')} .cn-icon`));
});

test('branded artwork keeps its own colours in both themes', async ({
  page,
}) => {
  await page.goto(COMPONENT_BOOK);

  const branded = (mode: string) =>
    `[data-mode="${mode}"][data-noun="dd5"] svg [fill]`;
  const fill = (mode: string) =>
    page
      .locator(branded(mode))
      .first()
      .evaluate((element) => getComputedStyle(element).fill);

  // An encoded fill, not currentColor: the same in Dark and in Light.
  expect(await fill('dark')).toBe(await fill('light'));
  expect(await fill('dark')).not.toBe(
    await color(page, '[data-mode="dark"][data-noun="dd5"]'),
  );
});

test('an unresolved noun renders the missing glyph at full size', async ({
  page,
}) => {
  await page.goto(COMPONENT_BOOK);

  const probe = '[data-noun="no-such-noun"]';
  await expect(page.locator(`${probe} svg`).first()).toHaveAttribute(
    'viewBox',
    '0 0 24 24',
  );
  const { w } = await box(page, `${probe} .cn-icon`);
  expect(Math.abs(w - SIZE_PX.medium)).toBeLessThanOrEqual(1);

  // The tier the specimen resolved it to, so a precedence change fails here too.
  await expect(page.locator('[data-tier="missing glyph"]')).toHaveText(
    'missing glyph',
  );
});

test('an icon announces its noun, and an explicit label wins', async ({
  page,
}) => {
  await page.goto(COMPONENT_BOOK);

  await expect(
    page.getByRole('img', { name: 'fox', exact: true }).first(),
  ).toBeAttached();
  // The tooltip stays the noun whatever the accessible name is.
  await expect(page.locator('svg title:text-is("fox")').first()).toBeAttached();
});

test('the catalogue shows every noun that resolves, and no page errors', async ({
  page,
}) => {
  const componentErrors = collectConsoleErrors(page);
  await page.goto(COMPONENT_BOOK);
  expect(componentErrors).toEqual([]);

  const principlesErrors = collectConsoleErrors(page);
  await page.goto(PRINCIPLES_BOOK);
  await expect(
    page.getByRole('heading', { name: 'Iconography', level: 1 }),
  ).toBeVisible();

  // Every listed noun rendered artwork. Which nouns are listed is the registries',
  // asserted in the package tests.
  const entries = page.locator('li[data-noun]');
  const listed = await entries.count();
  expect(listed).toBeGreaterThan(50);
  await expect(entries.locator('svg')).toHaveCount(listed);
  expect(principlesErrors).toEqual([]);
});
