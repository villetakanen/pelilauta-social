import { expect, type Page, test } from '@playwright/test';

/**
 * The editor shell's geometry: a container query and `100cqw` inside it, so
 * neither resolves outside a browser. `specs/editor/shell/spec.md` states the
 * contract this proves — the text column stands at the published page's
 * measure, the gutter outside it, and the frontmatter region beside or above
 * the canvas depending on whether `content-golden` composes wide.
 *
 * Every threshold below is derived from `--cn-grid`, `--cn-gap` and
 * `--cn-measure` as the page resolves them, never restated as a literal —
 * `packages/editor/test/shellGeometry.test.ts` already guards the one literal
 * the component itself carries, the stacking condition, against
 * `content-containers.css`; this file only has to agree with both.
 */

const ROUTE = '/extensions/editor-shell';
const SECONDARY_GRID_UNITS = 32;

const shell = (page: Page) => page.locator('.cn-editor-shell');
const canvas = (page: Page) => page.locator('.cn-editor-shell__canvas');
const frontmatter = (page: Page) =>
  page.locator('.cn-editor-shell__frontmatter');
const gutters = (page: Page) => page.locator('.cm-gutters');
const content = (page: Page) => page.locator('.cm-content');

/**
 * A custom property's resolved length, in CSS pixels. A custom property's
 * declared value is text — `41.5rem` — so the only way to learn what it
 * resolves to on this page, at this root font size, is to let a real box use
 * it and measure the box.
 */
async function resolvePx(page: Page, value: string): Promise<number> {
  return page.evaluate((cssValue) => {
    const probe = document.createElement('div');
    probe.style.cssText = `position:fixed;visibility:hidden;inline-size:${cssValue};block-size:0;`;
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }, value);
}

interface Tokens {
  grid: number;
  gap: number;
  measure: number;
}

async function readTokens(page: Page): Promise<Tokens> {
  const [grid, gap, measure] = await Promise.all([
    resolvePx(page, 'var(--cn-grid)'),
    resolvePx(page, 'var(--cn-gap)'),
    resolvePx(page, 'var(--cn-measure)'),
  ]);
  return { grid, gap, measure };
}

/** Golden's small secondary, the shell's addition read back in pixels. */
const secondary = (t: Tokens) => t.grid * SECONDARY_GRID_UNITS;

/**
 * Golden's wide-composition literal, `58.5rem`, restated as the sum it is —
 * the measure, a gap, and the secondary — rather than as that literal, so a
 * root font-size change moves it exactly as it moves the container query.
 */
const wideThresholdContent = (t: Tokens) => t.measure + t.gap + secondary(t);

/** The viewport a host needs to offer that content-box width, given its own
 * inline padding on both sides. */
const viewportFor = (t: Tokens, contentWidth: number) =>
  contentWidth + 2 * t.gap;

async function box(locator: ReturnType<typeof shell>) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('expected element did not render');
  return rect;
}

async function open(page: Page, path: string, width = 1600) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await expect(content(page)).toBeVisible();
}

/** The host's content-box start and width — inset from the shell's box
 * by the padding-inline the shell states on itself. */
function hostContent(host: { x: number; width: number }, t: Tokens) {
  return { start: host.x + t.gap, width: host.width - 2 * t.gap };
}

test.describe('editor shell geometry', () => {
  test("wide: the canvas text stands at golden's track, the gutter stands outside it, and the frontmatter stands at the small measure", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await open(page, ROUTE);
    const t = await readTokens(page);
    // Comfortably clear of the threshold — 40 grid units of surplus, well
    // past the 5-grid-unit gutter it has to hold.
    const width = viewportFor(t, wideThresholdContent(t)) + 40 * t.grid;
    await page.setViewportSize({ width: Math.ceil(width), height: 900 });

    const host = hostContent(await box(shell(page)), t);
    const surplus = (host.width - wideThresholdContent(t)) / 2;
    const trackStart = host.start + surplus;

    const cm = await box(content(page));
    const gut = await box(gutters(page));
    const fm = await box(frontmatter(page));

    expect(cm.x).toBeCloseTo(trackStart, 0);
    // The gutter bleeds into the surplus, entirely before the measure.
    expect(gut.x + gut.width).toBeLessThanOrEqual(cm.x + 1);
    expect(gut.x).toBeGreaterThanOrEqual(host.start - 1);
    expect(fm.x).toBeCloseTo(trackStart + t.measure + t.gap, 0);
    expect(fm.width).toBeCloseTo(secondary(t), 0);

    expect(consoleErrors).toEqual([]);
  });

  test("at golden's exact wide threshold, the composition is still wide and nothing overflows the shell", async ({
    page,
  }) => {
    await open(page, ROUTE);
    const t = await readTokens(page);
    const width = viewportFor(t, wideThresholdContent(t));
    await page.setViewportSize({ width: Math.round(width), height: 900 });

    const hostBox = await box(shell(page));
    const host = hostContent(hostBox, t);
    const canvasBox = await box(canvas(page));
    const fm = await box(frontmatter(page));
    const gut = await box(gutters(page));

    // Two tracks, side by side — not stacked.
    expect(Math.abs(fm.y - canvasBox.y)).toBeLessThanOrEqual(1);
    // There is no surplus left for the gutter to bleed into, so it stands
    // inside the shell rather than past its edge.
    expect(gut.x).toBeGreaterThanOrEqual(host.start - 1);
  });

  test('one pixel below the threshold, the frontmatter region stacks above the full-width canvas', async ({
    page,
  }) => {
    await open(page, ROUTE);
    const t = await readTokens(page);
    const width = viewportFor(t, wideThresholdContent(t)) - 1;
    await page.setViewportSize({ width: Math.round(width), height: 900 });

    const hostBox = await box(shell(page));
    const host = hostContent(hostBox, t);
    const canvasBox = await box(canvas(page));
    const fm = await box(frontmatter(page));

    expect(fm.y).toBeLessThan(canvasBox.y);
    expect(canvasBox.width).toBeCloseTo(host.width, 0);
  });

  test('at a narrow viewport, the same stacked composition holds', async ({
    page,
  }) => {
    await open(page, ROUTE, 420);
    const hostBox = await box(shell(page));
    const canvasBox = await box(canvas(page));
    const fm = await box(frontmatter(page));

    expect(fm.y).toBeLessThan(canvasBox.y);
    expect(canvasBox.width).toBeCloseTo(
      hostBox.width - 2 * (await readTokens(page)).gap,
      0,
    );
  });

  test("?fields=off: no frontmatter region, and the canvas column centres at the measure — prose's placement", async ({
    page,
  }) => {
    await open(page, `${ROUTE}?fields=off`);
    const t = await readTokens(page);

    await expect(frontmatter(page)).toHaveCount(0);

    const host = hostContent(await box(shell(page)), t);
    const cm = await box(content(page));

    const hostCenter = host.start + host.width / 2;
    const cmCenter = cm.x + cm.width / 2;

    expect(cmCenter).toBeCloseTo(hostCenter, 0);
    expect(cm.width).toBeCloseTo(t.measure, 0);
  });

  test("?gutter=off: no gutter, and the canvas text starts exactly at golden's primary track", async ({
    page,
  }) => {
    await open(page, `${ROUTE}?gutter=off`);
    const t = await readTokens(page);
    const width = viewportFor(t, wideThresholdContent(t)) + 40 * t.grid;
    await page.setViewportSize({ width: Math.ceil(width), height: 900 });

    await expect(gutters(page)).toHaveCount(0);

    const host = hostContent(await box(shell(page)), t);
    const surplus = (host.width - wideThresholdContent(t)) / 2;
    const trackStart = host.start + surplus;

    const cm = await box(content(page));
    expect(cm.x).toBeCloseTo(trackStart, 0);
  });

  test('the page never scrolls, and the shell fills the viewport, at every width tested', async ({
    page,
  }) => {
    await open(page, ROUTE);
    const t = await readTokens(page);
    const widths = [
      Math.ceil(viewportFor(t, wideThresholdContent(t)) + 40 * t.grid),
      Math.round(viewportFor(t, wideThresholdContent(t))),
      Math.round(viewportFor(t, wideThresholdContent(t))) - 1,
      420,
    ];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });

      const overflow = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight);

      const hostBox = await box(shell(page));
      expect(hostBox.height).toBeCloseTo(900, 0);
    }
  });
});
