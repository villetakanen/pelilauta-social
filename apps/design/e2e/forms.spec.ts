import { expect, test } from '@playwright/test';

/**
 * What only a browser knows about a fieldset and legend, once forms.css and
 * the anonymous box a browser generates around the non-legend children of a
 * fieldset have both applied. typography.css declares the colour and the h3
 * type treatment a legend takes. typography.test.ts and typography.mdx cover
 * them.
 */

const BOOK = '/base/forms';

test.beforeEach(async ({ page }) => {
  await page.goto(BOOK);
});

/** The pixel value `--cn-line` resolves to, read from the page under test. */
const cnLine = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.marginBlockEnd = 'var(--cn-line)';
    document.body.append(probe);
    const value = getComputedStyle(probe).marginBlockEnd;
    probe.remove();
    return value;
  });

test('a fieldset carries no border, padding, background or shadow', async ({
  page,
}) => {
  const fieldset = page.locator('[data-testid="titled-fieldset"]').first();
  await expect(fieldset).toHaveCSS('border-top-width', '0px');
  await expect(fieldset).toHaveCSS('padding-top', '0px');
  await expect(fieldset).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(fieldset).toHaveCSS('box-shadow', 'none');
});

test('the legend-to-stack interval and the gaps between children are --cn-line', async ({
  page,
}) => {
  const line = await cnLine(page);
  const fieldset = page.locator('[data-testid="titled-fieldset"]').first();
  const legend = fieldset.locator('legend');
  const children = fieldset.locator(':scope > :not(legend)');

  const legendBox = await legend.boundingBox();
  const boxes = await children.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        top: rect.top - Number.parseFloat(style.marginTop),
        bottom: rect.bottom + Number.parseFloat(style.marginBottom),
      };
    }),
  );

  expect(legendBox).toBeTruthy();
  const lineValue = Number.parseFloat(line);
  expect(
    boxes[0].top - (legendBox?.y ?? 0) - (legendBox?.height ?? 0),
  ).toBeCloseTo(lineValue, 0);
  for (let i = 1; i < boxes.length; i += 1) {
    expect(boxes[i].top - boxes[i - 1].bottom).toBeCloseTo(lineValue, 0);
  }
});

test('an untitled fieldset starts its first child at its own content-box top', async ({
  page,
}) => {
  const fieldset = page.locator('[data-testid="untitled-fieldset"]').first();
  const firstChild = fieldset.locator(':scope > *').first();

  const fieldsetBox = await fieldset.boundingBox();
  const childBox = await firstChild.boundingBox();
  const marginTop = await firstChild.evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).marginTop),
  );

  expect(fieldsetBox).toBeTruthy();
  expect(childBox).toBeTruthy();
  expect((childBox?.y ?? 0) - marginTop).toBeCloseTo(fieldsetBox?.y ?? 0, 0);
});

test('a fieldset in a narrow container is not wider than its container', async ({
  page,
}) => {
  const fieldset = page.locator('[data-testid="narrow-fieldset"]').first();
  const container = page
    .locator('.composition.narrow')
    .filter({ has: page.locator('[data-testid="narrow-fieldset"]') })
    .first();

  const fieldsetBox = await fieldset.boundingBox();
  const containerBox = await container.boundingBox();

  expect(fieldsetBox).toBeTruthy();
  expect(containerBox).toBeTruthy();
  expect(fieldsetBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
    containerBox?.width ?? 0,
  );

  const legend = fieldset.locator('legend');
  const legendBox = await legend.boundingBox();
  expect(legendBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
    containerBox?.width ?? 0,
  );
});
