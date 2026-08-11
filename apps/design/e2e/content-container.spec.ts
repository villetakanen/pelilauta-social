import { expect, type Page, test } from '@playwright/test';

/**
 * The content container's behavioural scenarios. These need a browser: the
 * measure resolves against the root font size, and what a container query
 * reports cannot be read out of a stylesheet at all.
 *
 * Spec: specs/design-system/content-container-layouts/spec.md
 */

const BOOK = '/base/content-containers';
const MEASURE_STEPS = 83;
const GAP_STEPS = 2;
const GRID_REM = 0.5;
/** The triad's fixed tracks, and the width its row needs, in grid steps. */
const TRIAD_TRACKS = [51, 32, 32];
const TRIAD_STEPS = 51 + GAP_STEPS + 32 + GAP_STEPS + 32;

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
  // The article spans the page for breakouts; its blocks are the column, so a
  // block's box is what we measure.
  const column = await page
    .locator('main#content > .content-prose > p')
    .first()
    .boundingBox();
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
    // A block of the article is the container, so the probes live inside one.
    const article = document.querySelector('main#content > .content-prose');
    const host = document.createElement('div');
    for (const id of ['probe-narrow', 'probe-wide']) {
      const probe = document.createElement('p');
      probe.id = id;
      probe.textContent = id;
      host.append(probe);
    }
    article?.append(host);
  });

  await expect(page.locator('#probe-narrow')).toHaveCSS(
    'color',
    'rgb(0, 255, 0)',
  );
  await expect(page.locator('#probe-wide')).toHaveCSS('color', 'rgb(1, 1, 1)');
});

test('a container that asks for nothing takes the width it is offered', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  // The host offers its full content box. Only a container that asks for the
  // measure is narrowed, so a plain one needs no class to stay wide.
  await page.evaluate(() => {
    const section = document.createElement('section');
    section.id = 'wide';
    section.textContent = 'as wide as it was offered';
    document.querySelector('main#content')?.append(section);
  });

  const measure = await steps(page, MEASURE_STEPS);
  const gap = await steps(page, GAP_STEPS);
  const { main } = await boxes(page);
  const wide = await page.locator('#wide').boundingBox();
  if (!wide) throw new Error('the container did not render');

  expect(wide.width).toBeGreaterThan(measure);
  expect(wide.width).toBeCloseTo(main.width - 2 * gap, 0);
});

test('a breakout spans the width its prose container was offered', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  await page.evaluate(() => {
    const block = document.createElement('div');
    block.id = 'breakout';
    block.className = 'breakout';
    block.innerHTML = '<div style="inline-size: 60rem;">wide content</div>';
    document.querySelector('main#content > .content-prose')?.append(block);
  });

  const measure = await steps(page, MEASURE_STEPS);
  const gap = await steps(page, GAP_STEPS);
  const { main } = await boxes(page);
  const breakout = await page.locator('#breakout').boundingBox();
  if (!breakout) throw new Error('the breakout did not render');

  // Wider than the flow, and the whole width the host offered its container —
  // the page-edge inset is the host's, so a breakout does not eat into it.
  expect(breakout.width).toBeGreaterThan(measure);
  expect(breakout.width).toBeCloseTo(main.width - 2 * gap, 0);
  const left = breakout.x - main.x;
  const right = main.x + main.width - (breakout.x + breakout.width);
  expect(left).toBeCloseTo(right, 0);
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
  const first = await page
    .locator('main#content > .content-prose')
    .boundingBox();
  const second = await page.locator('#second').boundingBox();
  if (!first || !second) throw new Error('containers did not render');

  expect(second.y - (first.y + first.height)).toBeCloseTo(line, 0);
});

/**
 * A triad in a host of a known width. The host is built here rather than measured
 * off the book, so a composition can be put either side of its threshold without
 * a viewport that also moves the navigation and the page inset.
 */
const triad = async (page: Page, hostWidth: number, between = '') => {
  await page.evaluate(
    ({ width, between }) => {
      document.querySelector('#triad-host')?.remove();
      const host = document.createElement('div');
      host.id = 'triad-host';
      host.style.inlineSize = `${width}px`;
      host.style.containerType = 'inline-size';
      const region = (n: number) =>
        `<div id="region-${n}" class="surface">Region ${n}</div>`;
      host.innerHTML = `<div class="content-triad">${region(1)}${between}${region(2)}${region(3)}</div>`;
      document.querySelector('main#content')?.append(host);
    },
    { width: hostWidth, between },
  );

  const host = await page.locator('#triad-host').boundingBox();
  const regions = await Promise.all(
    [1, 2, 3].map((n) => page.locator(`#region-${n}`).boundingBox()),
  );
  if (!host || regions.some((box) => !box)) {
    throw new Error('the triad did not render');
  }
  return { host, regions: regions as NonNullable<(typeof regions)[number]>[] };
};

for (const root of [16, 20]) {
  test(`triad: the row appears at its threshold, at a ${root}px root`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);
    // The reader's own text size. The tracks are in rem, so the threshold moves
    // with it — which is why the width comes from the page rather than a literal.
    await page.addStyleTag({ content: `html { font-size: ${root}px; }` });

    const { host, regions } = await triad(page, await steps(page, TRIAD_STEPS));
    const gap = await steps(page, GAP_STEPS);

    for (const [index, track] of TRIAD_TRACKS.entries()) {
      expect(regions[index].width).toBeCloseTo(await steps(page, track), 0);
      expect(regions[index].y).toBeCloseTo(regions[0].y, 0);
    }
    expect(regions[1].x - (regions[0].x + regions[0].width)).toBeCloseTo(
      gap,
      0,
    );
    expect(regions[2].x - (regions[1].x + regions[1].width)).toBeCloseTo(
      gap,
      0,
    );
    expect(regions[0].x).toBeCloseTo(host.x, 0);
  });

  test(`triad: one pixel short of the threshold it stacks, at a ${root}px root`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);
    await page.addStyleTag({ content: `html { font-size: ${root}px; }` });

    const width = (await steps(page, TRIAD_STEPS)) - 1;
    const { host, regions } = await triad(page, width);
    const gap = await steps(page, GAP_STEPS);

    for (const region of regions) {
      expect(region.width).toBeCloseTo(host.width, 0);
      expect(region.x).toBeCloseTo(host.x, 0);
    }
    expect(regions[1].y - (regions[0].y + regions[0].height)).toBeCloseTo(
      gap,
      0,
    );
  });
}

test('triad: surplus width falls equally outside the row', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);

  const surplus = await steps(page, 20);
  const { host, regions } = await triad(
    page,
    (await steps(page, TRIAD_STEPS)) + surplus,
  );

  const left = regions[0].x - host.x;
  const right = host.x + host.width - (regions[2].x + regions[2].width);
  expect(left).toBeCloseTo(right, 0);
  expect(left).toBeCloseTo(surplus / 2, 0);
});

test('triad: between the measure and the threshold every region fills the host', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);

  const measure = await steps(page, MEASURE_STEPS);
  const { host, regions } = await triad(page, await steps(page, 100));

  for (const region of regions) {
    expect(region.width).toBeCloseTo(host.width, 0);
    // A stacked region does not inherit the prose cap.
    expect(region.width).toBeGreaterThan(measure);
  }
});

test('triad: script, style and template children take no track', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);

  const { regions } = await triad(
    page,
    await steps(page, TRIAD_STEPS),
    '<script></script><style></style><template></template>',
  );

  for (const [index, track] of TRIAD_TRACKS.entries()) {
    expect(regions[index].width).toBeCloseTo(await steps(page, track), 0);
    expect(regions[index].y).toBeCloseTo(regions[0].y, 0);
  }
});

test('triad: an astro-island keeps the track of the region it renders', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);

  // The hydration wrapper is display: contents, so the element it renders is the
  // grid item. A deferred region moves through its states inside one of these.
  const { regions } = await triad(page, await steps(page, TRIAD_STEPS));
  await page.evaluate(() => {
    const region = document.querySelector('#region-2');
    const island = document.createElement('astro-island');
    region?.replaceWith(island);
    if (region) island.append(region);
  });

  const wrapped = await page.locator('#region-2').boundingBox();
  if (!wrapped) throw new Error('the wrapped region did not render');
  expect(wrapped.width).toBeCloseTo(await steps(page, 32), 0);
  expect(wrapped.y).toBeCloseTo(regions[0].y, 0);
});

test('triad: a region reports its own track, under both container names', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);

  // Each region is also a surface, so it answers to cn-content and surface-area
  // at once. Both report the track after the surface inset, never the host.
  await page.addStyleTag({
    content: `
      #probe-content, #probe-area, #probe-host { color: rgb(1, 1, 1); }
      @container cn-content (max-width: 16rem) { #probe-content { color: rgb(0, 255, 0); } }
      @container surface-area (max-width: 16rem) { #probe-area { color: rgb(0, 255, 0); } }
      @container cn-content (min-width: 40rem) { #probe-host { color: rgb(0, 255, 0); } }
    `,
  });
  await triad(page, await steps(page, TRIAD_STEPS));
  await page.evaluate(() => {
    for (const id of ['probe-content', 'probe-area', 'probe-host']) {
      const probe = document.createElement('p');
      probe.id = id;
      probe.textContent = id;
      document.querySelector('#region-2')?.append(probe);
    }
  });

  await expect(page.locator('#probe-content')).toHaveCSS(
    'color',
    'rgb(0, 255, 0)',
  );
  await expect(page.locator('#probe-area')).toHaveCSS(
    'color',
    'rgb(0, 255, 0)',
  );
  await expect(page.locator('#probe-host')).toHaveCSS('color', 'rgb(1, 1, 1)');
});

test('triad: a wide descendant does not push its region past its track', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BOOK);

  const { regions } = await triad(page, await steps(page, TRIAD_STEPS));
  await page.evaluate(() => {
    const wide = document.createElement('div');
    wide.style.inlineSize = '60rem';
    wide.textContent = 'oversized';
    document.querySelector('#region-1')?.append(wide);
  });

  const held = await page.locator('#region-1').boundingBox();
  if (!held) throw new Error('the region did not render');
  expect(held.width).toBeCloseTo(regions[0].width, 0);
});
