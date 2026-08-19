import { expect, test } from '@playwright/test';

const BOOK = '/components/cn-loader';

test.beforeEach(async ({ page }) => {
  await page.goto(BOOK);
  await expect(
    page.getByRole('heading', { name: 'CnLoader', level: 1 }),
  ).toBeVisible();
});

test('renders standalone default CnLoader with ARIA role and noun icon', async ({
  page,
}) => {
  const loader = page
    .locator('[data-mode="light"] [data-variant="basic"] .cn-loader')
    .first();
  await expect(loader).toHaveAttribute('role', 'status');
  await expect(loader).toHaveAttribute('aria-label', 'Loading');

  const ring = loader.locator('.lds-dual-ring');
  await expect(ring).toBeVisible();

  const icon = loader.locator('.cn-icon');
  await expect(icon).toHaveAttribute('data-noun', 'fox');
});

test('renders inline variant with 24px dimensions matching var(--cn-line)', async ({
  page,
}) => {
  const loader = page
    .locator('[data-mode="light"] [data-variant="inline"] .cn-loader')
    .first();
  await expect(loader).toHaveClass(/cn-loader-inline/);

  const box = await loader.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width).toBeCloseTo(24, 0);
    expect(box.height).toBeCloseTo(24, 0);
  }
});

test('forwards custom noun and custom ARIA label', async ({ page }) => {
  const loader = page
    .locator('[data-mode="light"] [data-variant="custom"] .cn-loader')
    .first();
  await expect(loader).toHaveAttribute('aria-label', 'Loading feline data…');

  const icon = loader.locator('.cn-icon');
  await expect(icon).toHaveAttribute('data-noun', 'cat');
});

test('auto-centers horizontally inside a section container', async ({
  page,
}) => {
  const section = page
    .locator('[data-mode="light"] [data-variant="section"] section')
    .first();
  const loader = section.locator('.cn-loader');

  const sectionBox = await section.boundingBox();
  const loaderBox = await loader.boundingBox();
  expect(sectionBox).not.toBeNull();
  expect(loaderBox).not.toBeNull();

  if (sectionBox && loaderBox) {
    const sectionCenterX = sectionBox.x + sectionBox.width / 2;
    const loaderCenterX = loaderBox.x + loaderBox.width / 2;
    expect(loaderCenterX).toBeCloseTo(sectionCenterX, 1);
  }
});

test('paints the ring in the light-scheme --cn-loader-color role', async ({
  page,
}) => {
  const colors = await page.evaluate(() => {
    const light = document.querySelector(
      '[data-mode="light"] [data-variant="basic"] .lds-dual-ring',
    );
    if (!light) return null;
    return {
      ring: getComputedStyle(light, '::after').borderTopColor,
      // The reference token the role resolves to in the light scheme, read from
      // the live cascade rather than restated here.
      reference: getComputedStyle(document.documentElement)
        .getPropertyValue('--chroma-primary-60')
        .trim(),
    };
  });
  expect(colors).not.toBeNull();
  expect(colors?.ring).toBe(colors?.reference);
});

test('ring animation resolves to none under prefers-reduced-motion: reduce', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const loader = page.locator('[data-mode="light"] .cn-loader').first();
  const animation = await loader.evaluate((element) => {
    const ring = element.querySelector('.lds-dual-ring');
    if (!ring) return null;
    return getComputedStyle(ring, '::after').animationName;
  });
  expect(animation).toBe('none');
});
