import { expect, type Locator, test } from '@playwright/test';
import {
  contrast as oklchContrast,
  parseOklch,
} from '../../../packages/design-system/books/specimens/color';

/** Browser-only CnCard guarantees: cascade, geometry, focus, and containment. */
const BOOK = '/components/cn-card';

const rgb = (value: string) =>
  value
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number) ?? [];

const luminance = (value: string) => {
  const channels = rgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (foreground: string, background: string) => {
  const oklchForeground = parseOklch(foreground);
  const oklchBackground = parseOklch(background);
  if (oklchForeground && oklchBackground) {
    return oklchContrast(oklchForeground, oklchBackground);
  }
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
};

const styles = (locator: Locator) =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      backgroundBlendMode: style.backgroundBlendMode,
      color: style.color,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontWeight: style.fontWeight,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

test.beforeEach(async ({ page }) => {
  await page.goto(BOOK);
  await expect(
    page.getByRole('heading', { name: 'CnCard', level: 1 }),
  ).toBeVisible();
});

test('the linked title is the only keyboard destination added by CnCard', async ({
  page,
}) => {
  const variant = page.locator(
    '[data-mode="light"] [data-variant="cover-noun"]',
  );
  const links = variant.locator('a');
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveAttribute('tabindex', '-1');

  const titleLink = variant.locator('.title a');
  await titleLink.focus();
  const focused = await styles(titleLink);
  expect(focused.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(2);
});

test('a long title is clamped to two lines in a narrow CnCard', async ({
  page,
}) => {
  const title = page
    .locator('[data-mode="light"] [data-variant="long-narrow"] .title')
    .first();
  const geometry = await title.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      clamp: style.webkitLineClamp,
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
  expect(geometry.clamp).toBe('2');
  expect(geometry.height).toBeLessThanOrEqual(geometry.lineHeight * 2 + 2);
});

test('the cover is 16:9 and its primary tint occupies at most 44 percent', async ({
  page,
}) => {
  const variant = page.locator(
    '[data-mode="dark"] [data-variant="cover-noun"]',
  );
  const image = variant.locator('.cover img');
  const tint = variant.locator('.tint');
  const cover = variant.locator('.cover');
  const boxes = await Promise.all([
    image.boundingBox(),
    tint.boundingBox(),
    cover.boundingBox(),
  ]);
  if (!boxes[0] || !boxes[1] || !boxes[2])
    throw new Error('cover did not render');
  expect(boxes[0].width / boxes[0].height).toBeCloseTo(16 / 9, 2);
  expect(boxes[1].height / boxes[2].height).toBeLessThanOrEqual(0.441);
  expect((await styles(tint)).backgroundBlendMode).toBe('hard-light');
});

test('actions form a seven-grid-unit bottom row with split children', async ({
  page,
}) => {
  const card = page.locator(
    '[data-mode="light"] [data-variant="eyebrow-actions"] .cn-card',
  );
  const actions = card.locator('.actions');
  const result = await actions.evaluate((element) => {
    const card = element.closest('.cn-card');
    const children = [...element.children].map((child) =>
      child.getBoundingClientRect(),
    );
    const rect = element.getBoundingClientRect();
    const cardRect = card?.getBoundingClientRect();
    const cardPaddingBottom = card
      ? Number.parseFloat(getComputedStyle(card).paddingBottom)
      : 0;
    const probe = document.createElement('span');
    probe.style.display = 'block';
    probe.style.blockSize = 'calc(7 * var(--cn-grid))';
    element.append(probe);
    const expectedHeight = probe.getBoundingClientRect().height;
    probe.remove();
    return {
      height: rect.height,
      expectedHeight,
      cardBottom: cardRect?.bottom,
      cardPaddingBottom,
      actionsBottom: rect.bottom,
      firstStart: children[0]?.left,
      lastEnd: children.at(-1)?.right,
      actionsStart: rect.left,
      actionsEnd: rect.right,
    };
  });
  expect(result.height).toBeCloseTo(result.expectedHeight, 1);
  expect(result.actionsBottom).toBeCloseTo(
    (result.cardBottom ?? 0) - result.cardPaddingBottom,
    1,
  );
  expect(result.firstStart).toBeGreaterThan(result.actionsStart);
  expect(result.lastEnd).toBeLessThan(result.actionsEnd);
});

test('the CnCard title retains v20 h4 metrics in a narrow container', async ({
  page,
}) => {
  const title = page
    .locator('[data-mode="light"] [data-variant="long-narrow"] .title')
    .first();
  const actual = await styles(title);
  const expected = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.fontSize = 'var(--cn-font-size-h4)';
    probe.style.fontWeight = 'var(--cn-font-weight-h4)';
    probe.style.lineHeight = 'var(--cn-line-height-h4)';
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
    };
    probe.remove();
    return result;
  });
  expect(actual.fontSize).toBe(expected.fontSize);
  expect(actual.fontWeight).toBe(expected.fontWeight);
  expect(actual.lineHeight).toBe(expected.lineHeight);
});

test('a flag class added on the client raises the flag on an unhydrated CnCard', async ({
  page,
}) => {
  // Holds the published state hook against the component's scoped styles: the app
  // toggles these classes on cards it never hydrates, and Svelte's scoping and CSS
  // pruning could disconnect the rule from the class without any specimen changing.
  const card = page.locator(
    '[data-mode="light"] [data-variant="basic"] .cn-card',
  );
  const flag = () =>
    card.evaluate((element) => {
      const style = getComputedStyle(element, '::after');
      return { opacity: style.opacity, background: style.backgroundColor };
    });

  expect((await flag()).opacity).toBe('0');

  for (const [state, role] of [
    ['has-notify', '--cn-color-info'],
    ['has-alert', '--cn-color-warning'],
  ] as const) {
    const expected = await card.evaluate((element, token) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      element.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }, role);

    await card.evaluate((element, className) => {
      element.classList.add(className);
    }, state);
    // The transition has to settle before the computed opacity is the resting one.
    await expect
      .poll(async () => (await flag()).opacity, { timeout: 2000 })
      .toBe('1');
    expect((await flag()).background).toBe(expected);

    await card.evaluate((element, className) => {
      element.classList.remove(className);
    }, state);
    await expect
      .poll(async () => (await flag()).opacity, { timeout: 2000 })
      .toBe('0');
  }
});

test('a covered noun stacks above the alert flag', async ({ page }) => {
  const card = page.locator(
    '[data-mode="light"] [data-variant="cover-noun-alert"] .cn-card',
  );
  const levels = await card.evaluate((element) => {
    const noun = element.querySelector('.cover-noun');
    if (!noun) throw new Error('covered noun did not render');
    return {
      flag: Number(getComputedStyle(element, '::after').zIndex),
      noun: Number(getComputedStyle(noun).zIndex),
    };
  });
  expect(levels.noun).toBeGreaterThan(levels.flag);
});

for (const mode of ['light', 'dark'] as const) {
  test(`CnCard foregrounds meet AA on every elevation in ${mode}`, async ({
    page,
  }) => {
    for (const level of [0, 1, 2, 3, 4]) {
      const card = page.locator(
        `[data-mode="${mode}"] [data-elevation="${level}"] .cn-card`,
      );
      const background = (await styles(card)).background;
      for (const selector of ['.title', '.card-info']) {
        const foreground = (await styles(card.locator(selector))).color;
        expect(
          contrast(foreground, background),
          `${selector} on elevation ${level}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test(`the elevation-4 link retains the high foreground in ${mode}`, async ({
    page,
  }) => {
    const link = page.locator(
      `[data-mode="${mode}"] [data-elevation="4"] .cn-card a`,
    );
    const expected = await link.evaluate((element) => {
      const theme = element.closest('[data-mode]');
      if (!theme) throw new Error('CnCard specimen has no theme context');
      const probe = document.createElement('span');
      probe.style.color = 'var(--cn-text-high)';
      theme.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });

    expect((await styles(link)).color).toBe(expected);
    await link.hover();
    expect((await styles(link)).color).toBe(expected);
    await link.focus();
    const focused = await styles(link);
    expect(focused.color).toBe(expected);
    expect(focused.outlineColor).toBe(expected);
  });
}

test('a cover that cannot load falls back to the system artwork', async ({
  page,
}) => {
  const img = page.locator(
    '[data-mode="light"] [data-variant="cover-failed"] .cover img',
  );

  // The supplied URL is untouched: the fallback is painted behind the image, not
  // substituted for it, which is what lets it work with no script on the page.
  await expect(img).toHaveAttribute(
    'src',
    '/card-cover-that-does-not-exist.webp',
  );

  const painted = await img.evaluate((element) => {
    const image = element as HTMLImageElement;
    return {
      naturalWidth: image.naturalWidth,
      background: getComputedStyle(image).backgroundImage,
      backgroundSize: getComputedStyle(image).backgroundSize,
    };
  });
  // The image itself really did fail, so what a reader sees is the fallback.
  expect(painted.naturalWidth).toBe(0);
  expect(painted.background).toContain('data:image/svg+xml');
  expect(painted.backgroundSize).toBe('cover');

  // The region keeps the geometry a working cover would have had.
  const box = await img.boundingBox();
  expect(box).not.toBeNull();
  if (box) expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
});
