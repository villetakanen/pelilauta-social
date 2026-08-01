import { expect, type Page, test } from '@playwright/test';

/**
 * The content container's behavioural scenarios. These need a browser: the
 * measure resolves against the root font size, and what a container query
 * reports cannot be read out of a stylesheet at all.
 *
 * Spec: specs/design-system/content-containers/spec.md
 */

const BOOK = '/base/content-containers';
const MEASURE_STEPS = 83;
const GAP_STEPS = 2;
const GRID_REM = 0.5;

/** A grid-step count in CSS pixels, as the page currently resolves it. */
const steps = (page: Page, count: number) =>
  page.evaluate(
    ([n, gridRem]) =>
      n *
      gridRem *
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    [count, GRID_REM] as const,
  );

const boxes = async (page: Page) => {
  const main = await page.locator('main#content').boundingBox();
  // The container is the column, so its own box is what we measure.
  const column = await page.locator('main#content > article').boundingBox();
  if (!main || !column) throw new Error('container not rendered');
  return { main, column };
};

test('wide: one centred column at the measure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  const measure = await steps(page, MEASURE_STEPS);
  const { main, column } = await boxes(page);
  expect(main.width).toBeGreaterThan(measure);
  expect(column.width).toBeCloseTo(measure, 0);

  const left = column.x - main.x;
  const right = main.x + main.width - (column.x + column.width);
  expect(left).toBeCloseTo(right, 0);
});

test('narrow: a --cn-gap gutter each side, content fills between', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto(BOOK);

  const gap = await steps(page, GAP_STEPS);
  const { main, column } = await boxes(page);
  expect(column.x - main.x).toBeCloseTo(gap, 0);
  expect(column.width).toBeCloseTo(main.width - 2 * gap, 0);
});

test('the content width does not jump across the threshold', async ({
  page,
}) => {
  await page.goto(BOOK);
  const measure = await steps(page, MEASURE_STEPS);
  const gap = await steps(page, GAP_STEPS);
  const threshold = Math.round(measure + 2 * gap);

  await page.setViewportSize({ width: threshold - 12, height: 720 });
  const below = (await boxes(page)).column.width;

  await page.setViewportSize({ width: threshold + 60, height: 720 });
  const above = (await boxes(page)).column.width;

  expect(above).toBeCloseTo(measure, 0);
  // Continuous: just below the threshold the column is short by at most the
  // window's own shortfall, never by a mode's worth of width.
  expect(below).toBeLessThanOrEqual(measure);
  expect(measure - below).toBeLessThan(2 * gap + 40);
});

test('a query against cn-content resolves against the column, not the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  // The page is ~72rem and the column 41.5rem. A 50rem query is true of one and
  // false of the other, which is what makes this discriminating: if the
  // container element were the full-width wrapper, both probes would match.
  await page.addStyleTag({
    content: `
      #probe-narrow, #probe-wide { color: rgb(1, 1, 1); }
      @container cn-content (min-width: 40rem) { #probe-narrow { color: rgb(0, 255, 0); } }
      @container cn-content (min-width: 50rem) { #probe-wide { color: rgb(0, 255, 0); } }
    `,
  });
  await page.evaluate(() => {
    const article = document.querySelector('main#content > article');
    for (const id of ['probe-narrow', 'probe-wide']) {
      const probe = document.createElement('p');
      probe.id = id;
      probe.textContent = id;
      article?.append(probe);
    }
  });

  await expect(page.locator('#probe-narrow')).toHaveCSS(
    'color',
    'rgb(0, 255, 0)',
  );
  await expect(page.locator('#probe-wide')).toHaveCSS('color', 'rgb(1, 1, 1)');
});

test('a container marked full width spans the page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  // Bleed is a container-level decision, so this is a sibling of the book's
  // article rather than something inside it.
  await page.evaluate(() => {
    const section = document.createElement('section');
    section.id = 'bleed';
    section.className = 'cn-grid-full';
    section.textContent = 'full width';
    document.querySelector('main#content')?.append(section);
  });

  const measure = await steps(page, MEASURE_STEPS);
  const { main } = await boxes(page);
  const bleed = await page.locator('#bleed').boundingBox();
  if (!bleed) throw new Error('the full-width container did not render');

  expect(bleed.width).toBeGreaterThan(measure);
  expect(bleed.width).toBeCloseTo(main.width, 0);
});

test('the column widens proportionally when the reader enlarges their text', async ({
  page,
}) => {
  // Wide enough that the enlarged measure still fits beside the 18rem nav, which
  // also grows: at a 24px root the measure is 996px and the nav 432px.
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);
  const before = (await boxes(page)).column.width;

  // The reader's preference, which no design-system stylesheet may set.
  await page.addStyleTag({ content: 'html { font-size: 24px; }' });

  const after = (await boxes(page)).column.width;
  expect(after / before).toBeCloseTo(24 / 16, 2);
});

test('stacked containers are one --cn-line apart', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  await page.evaluate(() => {
    const section = document.createElement('section');
    section.id = 'second';
    section.textContent = 'the next container';
    document.querySelector('main#content')?.append(section);
  });

  const line = await steps(page, 3);
  const first = await page.locator('main#content > article').boundingBox();
  const second = await page.locator('#second').boundingBox();
  if (!first || !second) throw new Error('containers did not render');

  expect(second.y - (first.y + first.height)).toBeCloseTo(line, 0);
});
