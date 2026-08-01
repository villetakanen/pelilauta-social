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
