import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnFooter`: which of its three
 * container-query arrangements a real `@container` query resolves at a real
 * inline size; whether the equal-width tracks a real flex layout produces
 * actually land at the same width regardless of how much content each region
 * asks for; whether the second-row region a real `margin-inline: auto`
 * produces actually lands centred; and whether the `<footer>` actually
 * resolves `contentinfo` semantics with its explicit role. None of that can
 * be read off the stylesheet or the markup on their own.
 *
 * `CnFooter` answers its own container's inline size, never the viewport
 * (`specs/design-system/components/cn-footer/spec.md`, Regression
 * Guardrails). `FooterSpecimens.astro` gives each arrangement a bounded
 * `.frame` sitting well inside its band, wholly independent of the window —
 * no test below resizes the Playwright viewport, and none needs to: the
 * frame's own width is what drives the container query.
 *
 * Each `figure` below is found by a substring of its own caption, the way
 * `cn-app-bar.spec.ts` and `cn-rail.spec.ts` scope their own specimens.
 */

const BOOK = '/components/cn-footer';

const WIDE_CAPTION = 'three equal tracks on one row';
const INTERMEDIATE_CAPTION = 'the third centered beneath';
const STACKED_CAPTION = 'all three regions in one column';

/**
 * The `figure` a `<DsComposition>` wraps one of this book's own specimens
 * in, found by a distinctive substring of its own caption.
 */
const specimenFigure = (page: Page, captionSubstring: string) =>
  page.locator('#content figure').filter({ hasText: captionSubstring });

/** One pane — Light or Dark — of a `FooterSpecimens` group. Geometry does
 * not vary by scheme, so Light is enough unless a test says otherwise. */
const paneIn = (figure: Locator, mode: 'light' | 'dark' = 'light') =>
  figure.locator(`.pane[data-mode="${mode}"]`);

const footerIn = (pane: Locator) => pane.locator('footer.cn-footer');

/**
 * The flex direction the arrangement resolved to. The footer element itself
 * only establishes the container — a container cannot answer its own query —
 * so the laid-out element is the inner `.cn-footer-regions`.
 */
const flexDirectionOf = (footer: Locator) =>
  footer
    .locator('.cn-footer-regions')
    .evaluate((n) => getComputedStyle(n).flexDirection);

/** The footer's own three regions, in source order. */
const regionsOf = (footer: Locator) => footer.locator('.cn-footer-region');

/** A region's bounding box, asserted non-null for callers that then read it. */
const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box as { x: number; y: number; width: number; height: number };
};

test.describe('the landmark and its hook', () => {
  test('the root element is a footer, carries the .cn-footer class hook, and resolves contentinfo semantics', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const footer = footerIn(paneIn(specimenFigure(page, WIDE_CAPTION)));
    await expect(footer).toHaveCount(1);

    expect(await footer.evaluate((n) => n.tagName)).toBe('FOOTER');
    expect(
      await footer.evaluate((n) => n.classList.contains('cn-footer')),
    ).toBe(true);
    await expect(footer).toHaveRole('contentinfo');
  });
});

test.describe('wide: >= 58.5rem', () => {
  test('all three regions stand in one row, in equal-width tracks, regardless of differing content length', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const footer = footerIn(paneIn(specimenFigure(page, WIDE_CAPTION)));
    const regions = regionsOf(footer);
    await expect(regions).toHaveCount(3);

    expect(await flexDirectionOf(footer)).toBe('row');

    const [first, second, third] = await Promise.all([
      boxOf(regions.nth(0)),
      boxOf(regions.nth(1)),
      boxOf(regions.nth(2)),
    ]);

    // One row: the same block-axis position.
    expect(second.y).toBeCloseTo(first.y, 0);
    expect(third.y).toBeCloseTo(first.y, 0);

    // Source order along the inline axis.
    expect(first.x).toBeLessThan(second.x);
    expect(second.x).toBeLessThan(third.x);

    // Equal-width tracks — the guardrail: the specimen's three regions carry
    // deliberately differing content lengths, so an equal result here is the
    // flex rule holding, not a coincidence of the fixture.
    expect(second.width).toBeCloseTo(first.width, 0);
    expect(third.width).toBeCloseTo(first.width, 0);
  });
});

test.describe('intermediate: >= 38.0rem and < 58.5rem', () => {
  test('the first two regions share an equal-width first row, and the third stands centered on the row beneath', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const footer = footerIn(paneIn(specimenFigure(page, INTERMEDIATE_CAPTION)));
    const regions = regionsOf(footer);
    await expect(regions).toHaveCount(3);

    const [first, second, third] = await Promise.all([
      boxOf(regions.nth(0)),
      boxOf(regions.nth(1)),
      boxOf(regions.nth(2)),
    ]);
    const footerBox = await boxOf(footer);

    // First row: the first two regions, equal width, in source order.
    expect(second.y).toBeCloseTo(first.y, 0);
    expect(first.x).toBeLessThan(second.x);
    expect(second.width).toBeCloseTo(first.width, 0);

    // Second row: strictly beneath the first.
    expect(third.y).toBeGreaterThan(first.y + first.height - 1);

    // Centered on the footer's own inline axis.
    const thirdCenter = third.x + third.width / 2;
    const footerCenter = footerBox.x + footerBox.width / 2;
    expect(thirdCenter).toBeCloseTo(footerCenter, 0);
  });
});

test.describe('stacked: < 38.0rem', () => {
  test('all three regions stack in one column, in source order', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const footer = footerIn(paneIn(specimenFigure(page, STACKED_CAPTION)));
    const regions = regionsOf(footer);
    await expect(regions).toHaveCount(3);

    expect(await flexDirectionOf(footer)).toBe('column');

    const [first, second, third] = await Promise.all([
      boxOf(regions.nth(0)),
      boxOf(regions.nth(1)),
      boxOf(regions.nth(2)),
    ]);

    // One column: the same inline-axis position.
    expect(second.x).toBeCloseTo(first.x, 0);
    expect(third.x).toBeCloseTo(first.x, 0);

    // Source order along the block axis, each fully above the next.
    expect(second.y).toBeGreaterThan(first.y + first.height - 1);
    expect(third.y).toBeGreaterThan(second.y + second.height - 1);
  });
});

test.describe('the container decides the arrangement, not the window', () => {
  test('a footer bounded below 38.0rem stacks while the window sits well above every threshold', async ({
    page,
  }) => {
    await page.goto(BOOK);
    // Larger than the wide threshold by a wide margin, so a window-driven
    // footer would render its wide, single-row arrangement here — the
    // opposite of what this asserts.
    await page.setViewportSize({ width: 1920, height: 1080 });

    const footer = footerIn(paneIn(specimenFigure(page, STACKED_CAPTION)));
    expect(await flexDirectionOf(footer)).toBe('column');

    const regions = regionsOf(footer);
    const [first, second] = await Promise.all([
      boxOf(regions.nth(0)),
      boxOf(regions.nth(1)),
    ]);
    expect(second.y).toBeGreaterThan(first.y + first.height - 1);
  });
});

test.describe('rendering with no client-side script', () => {
  test.use({ javaScriptEnabled: false });

  test('the wide arrangement still resolves: three equal-width regions in one row', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const footer = footerIn(paneIn(specimenFigure(page, WIDE_CAPTION)));
    const regions = regionsOf(footer);
    await expect(regions).toHaveCount(3);

    expect(await flexDirectionOf(footer)).toBe('row');

    const [first, second, third] = await Promise.all([
      boxOf(regions.nth(0)),
      boxOf(regions.nth(1)),
      boxOf(regions.nth(2)),
    ]);
    expect(second.y).toBeCloseTo(first.y, 0);
    expect(second.width).toBeCloseTo(first.width, 0);
    expect(third.width).toBeCloseTo(first.width, 0);
  });
});
