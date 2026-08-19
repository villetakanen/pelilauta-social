import { expect, test } from '@playwright/test';

/**
 * What only a browser knows about colour.
 *
 * The declaration counts this spec used to assert are source facts, and the
 * TokenTable specimen now makes them true by construction — it renders what it
 * parses and fails the build when a selection matches nothing. Its parser is
 * asserted in packages/design-system/test/token-table.test.ts, and the contrast
 * guardrails in test/color-contrast.test.ts, neither of which needs a page.
 *
 * What survives here is the one claim no parser can make: that a `light-dark()`
 * declaration actually resolves to different colours under the two schemes. That
 * is a cascade fact, and the whole semantic layer rests on it.
 */
// --cn-surface is the role the whole elevation scale is built on, and its two
// light-dark() arms are different reference steps.
const swatch = '[data-swatch="--cn-surface"]';

for (const scheme of ['light', 'dark'] as const) {
  test(`the colour lexicon renders under the ${scheme} scheme`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/tokens/color');

    await expect(
      page.getByRole('heading', { name: 'Colour', level: 1 }),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
}

test('a semantic role resolves to a different colour in each scheme', async ({
  page,
}) => {
  const resolved = async (scheme: 'light' | 'dark') => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/tokens/color');
    return page
      .locator(swatch)
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);
  };

  const light = await resolved('light');
  const dark = await resolved('dark');

  // Both must be real colours, not a failed var() falling back to transparent.
  expect(light).toMatch(/^(rgb|oklch|color)/);
  expect(dark).toMatch(/^(rgb|oklch|color)/);
  expect(light).not.toBe(dark);
});

// Chromium's computed style preserves an oklch() background literally rather
// than resolving it to rgb, so read the actually-painted pixel through a
// canvas instead of parsing the declaration's own numbers.
const channels = (element: import('@playwright/test').Locator) =>
  element.evaluate((node) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = getComputedStyle(node).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
  });
const isGrey = ({ r, g, b }: { r: number; g: number; b: number }) =>
  Math.abs(r - g) < 2 && Math.abs(g - b) < 2;

for (const family of ['primary', 'surface'] as const) {
  test(`the theme-swap demo redeclares ${family} chroma inside its container only`, async ({
    page,
  }) => {
    // The demo performs the substitution contract: toggling one core family's
    // toggle replaces its 13 steps with a zero-chroma ramp on the container. A
    // grey has equal RGB channels; the shipped step-60 does not (hue 242 at
    // step 60 has real chroma too). The page outside the container, and the
    // other core family, must not notice.
    await page.goto('/principles/color-system');
    const demo = page.locator('.theme-swap-demo');
    const toggle = demo.getByRole('button', { name: `${family[0].toUpperCase()}${family.slice(1)}: Grayscale` });
    await expect(toggle).toBeVisible();

    const swatch60 = demo.locator(`[title="--chroma-${family}-60"]`);
    const before = await channels(swatch60);
    expect(isGrey(before), `shipped ${family}-60 is chromatic, got ${JSON.stringify(before)}`).toBe(false);

    const outside = await page.evaluate(
      (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
      `--chroma-${family}-60`,
    );

    await toggle.click();
    await expect(
      demo.getByRole('button', { name: `${family[0].toUpperCase()}${family.slice(1)}: Colour` }),
    ).toHaveAttribute('aria-pressed', 'true');

    const after = await channels(swatch60);
    expect(isGrey(after), `swapped ${family}-60 should be grey, got ${JSON.stringify(after)}`).toBe(true);

    // Lightness survives the swap: grey at the same step stays mid-toned, not black or white.
    expect(after.r).toBeGreaterThan(64);
    expect(after.r).toBeLessThan(224);

    // The override never leaks to the document root.
    const outsideAfter = await page.evaluate(
      (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
      `--chroma-${family}-60`,
    );
    expect(outsideAfter).toBe(outside);
  });
}
