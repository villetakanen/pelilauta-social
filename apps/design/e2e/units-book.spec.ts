import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const declarationPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
const unitsSource = readFileSync(
  new URL('../../../packages/design-system/styles/units.css', import.meta.url),
  'utf8',
);
const declared = [...unitsSource.matchAll(declarationPattern)].map((m) => m[1]);

test('units book lists every declared token and its shadows resolve', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/tokens/units');
  await expect(
    page.getByRole('heading', { name: 'Units and grid', level: 1 }),
  ).toBeVisible();

  // Every token in the production file is on the page, and nothing invented.
  const shown = await page
    .locator('[data-unit-token], [data-radius-token]')
    .evaluateAll((nodes) =>
      nodes.map(
        (node) =>
          node.getAttribute('data-unit-token') ??
          node.getAttribute('data-radius-token'),
      ),
    );
  expect(new Set(shown)).toEqual(new Set(declared));

  // The grid resolves to the documented 8px.
  const grid = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--cn-grid')
      .trim(),
  );
  expect(grid).toBe('0.5rem');

  // The defect this slice repairs: the elevation shadows derive from --cn-grid
  // and could not resolve on this site before it was owned here. A shadow that
  // fails to resolve computes to 'none'.
  for (const level of [1, 2, 3, 4]) {
    const computed = await page
      .locator(`[data-computed="--cn-shadow-elevation-${level}"]`)
      .innerText();
    expect(computed, `elevation-${level} should compute`).not.toBe('none');
    expect(computed).toMatch(/rgb|rgba|oklch/);
  }

  expect(consoleErrors).toEqual([]);
});
