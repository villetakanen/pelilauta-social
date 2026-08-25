import { expect, type Page, test } from '@playwright/test';

/**
 * The behavioural scenarios of the content containers. These need a browser:
 * the measure resolves against the root font size, and a stylesheet does not
 * state what a container query reports.
 */

const BOOK = '/base/content-containers';
const MEASURE_STEPS = 83;
const GAP_STEPS = 2;
/** The rhythm: what a content area puts between its children, and between containers. */
const LINE_STEPS = 3;
const GRID_REM = 0.5;
/** The triad's fixed tracks, and the width its row needs, in grid steps. */
const TRIAD_TRACKS = [51, 32, 32];
const TRIAD_STEPS = 51 + GAP_STEPS + 32 + GAP_STEPS + 32;
/** The golden's, the same way: the measure beside one small column. */
const GOLDEN_TRACKS = [MEASURE_STEPS, 32];
const GOLDEN_STEPS = MEASURE_STEPS + GAP_STEPS + 32;

/** A grid-step count in CSS pixels, as the page currently resolves it. */
const steps = (page: Page, count: number) =>
  page.evaluate(
    ([n, gridRem]) =>
      n *
      gridRem *
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    [count, GRID_REM] as const,
  );

/**
 * What the tray takes from the page. The design site mounts one, so the window
 * is wider than the container by the tray inline size, and a threshold applies
 * to the container. Every viewport below adds this back.
 */
const trayInset = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main#content');
    if (!main) return 0;
    return Number.parseFloat(getComputedStyle(main).marginInlineStart) || 0;
  });

/*
 * These tests measure final positions. A resize animates the inline margin of
 * the main element as the tray width follows, so a measurement taken straight
 * after a resize catches that margin in flight.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent =
        '*, *::before, *::after { transition: none !important }';
      document.head.append(style);
    });
  });
});

const boxes = async (page: Page) => {
  const main = await page.locator('main#content').boundingBox();
  // The article spans the page for breakouts, and its blocks are the column, so
  // measure the box of a block.
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

  const inset = await trayInset(page);
  await page.setViewportSize({ width: threshold - 12 + inset, height: 720 });
  const below = (await boxes(page)).column.width;

  await page.setViewportSize({ width: threshold + 60 + inset, height: 720 });
  const above = (await boxes(page)).column.width;

  expect(above).toBeCloseTo(measure, 0);
  // The narrowing is continuous: below the threshold the column is short by at
  // most the shortfall of the window, and not by the width of a whole mode.
  expect(below).toBeLessThanOrEqual(measure);
  expect(measure - below).toBeLessThan(2 * gap + 40);
});

test('an unnamed query resolves against the column, not the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  // The page is ~72rem and the column 41.5rem. A 50rem query is true of one and
  // false of the other, so the two probes separate the column from the page: if
  // the container element were the full-width wrapper, both would match.
  await page.addStyleTag({
    content: `
      #probe-narrow, #probe-wide { color: rgb(1, 1, 1); }
      @container (min-width: 40rem) { #probe-narrow { color: rgb(0, 255, 0); } }
      @container (min-width: 50rem) { #probe-wide { color: rgb(0, 255, 0); } }
    `,
  });
  await page.evaluate(() => {
    // A block of the article is the container, so the probes sit inside one.
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

  // The box the container sits in offers its whole content box. Only a container
  // that takes the measure is narrowed, so a plain element needs no class to stay
  // wide.
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

  // Wider than the flow, and the whole width the surrounding box offered the
  // container. That box states the page-edge inset, so a breakout stays inside it.
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

test('a stack keeps its rhythm, and its last container closes it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  // The parent states no separation, so the measured interval is only what the
  // containers state. `flow-root` keeps the margin of the last child inside the
  // parent box, where the test can read it, and adds no separation itself.
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'stack-host';
    host.style.display = 'flow-root';
    host.innerHTML = `
      <div id="stacked-1" class="content-prose"><p>first</p></div>
      <astro-island>
        <div id="stacked-2" class="content-golden"><div>second</div></div>
      </astro-island>
      <div id="stacked-3" class="content-triad"><div>third</div></div>
    `;
    document.querySelector('main#content')?.append(host);
  });

  const line = await steps(page, LINE_STEPS);
  const host = await page.locator('#stack-host').boundingBox();
  const stacked = await Promise.all(
    [1, 2, 3].map((n) => page.locator(`#stacked-${n}`).boundingBox()),
  );
  if (!host || stacked.some((box) => !box)) {
    throw new Error('the stack did not render');
  }
  const boxes = stacked as NonNullable<(typeof stacked)[number]>[];

  // The middle container is reached through an island, which is display: contents
  // and has no box to carry the interval.
  expect(boxes[1].y - (boxes[0].y + boxes[0].height)).toBeCloseTo(line, 0);
  expect(boxes[2].y - (boxes[1].y + boxes[1].height)).toBeCloseTo(line, 0);
  expect(host.y + host.height - (boxes[2].y + boxes[2].height)).toBeCloseTo(
    line,
    0,
  );
});

test("a content container among a content area's children adds its own separation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  await page.evaluate(() => {
    const area = document.querySelector('main#content > .content-prose');
    const block = document.createElement('div');
    block.innerHTML = `
      <p id="child-1">before</p>
      <div id="child-2" class="content-golden"><div>a nested container</div></div>
      <astro-island>
        <div id="child-3" class="content-triad"><div>another one</div></div>
      </astro-island>
      <p id="child-4">after</p>
    `;
    area?.append(...block.children);
  });

  const line = await steps(page, LINE_STEPS);
  const children = await Promise.all(
    [1, 2, 3, 4].map((n) => page.locator(`#child-${n}`).boundingBox()),
  );
  if (children.some((box) => !box)) {
    throw new Error('the content area did not render');
  }
  const boxes = children as NonNullable<(typeof children)[number]>[];
  const interval = (index: number) =>
    boxes[index + 1].y - (boxes[index].y + boxes[index].height);

  // Between two ordinary blocks the area's rhythm is the whole interval.
  expect(interval(0)).toBeCloseTo(line, 0);

  // A container states the separation after it wherever it sits, and the area
  // states its rhythm whatever the child is, so where a container precedes a
  // sibling both apply, through an island as well, which has no box.
  expect(interval(1)).toBeCloseTo(2 * line, 0);
  expect(interval(2)).toBeCloseTo(2 * line, 0);
});

/** The markup of one numbered child. Each is a surface, so its box paints. */
const child = (n: number) =>
  `<div id="region-${n}" class="surface">Region ${n}</div>`;

/**
 * A container of the given children in a box of a known width. This builds the box
 * rather than measuring one off the book, so a composition can sit either side of its
 * threshold without a viewport that also moves the navigation and the page inset.
 */
const compose = async (
  page: Page,
  mode: string,
  children: string,
  hostWidth: number,
) => {
  await page.evaluate(
    ({ mode, children, width }) => {
      document.querySelector('#container-host')?.remove();
      const host = document.createElement('div');
      host.id = 'container-host';
      host.style.inlineSize = `${width}px`;
      host.style.containerType = 'inline-size';
      host.innerHTML = `<div class="${mode}">${children}</div>`;
      document.querySelector('main#content')?.append(host);
    },
    { mode, children, width: hostWidth },
  );

  const host = await page.locator('#container-host').boundingBox();
  if (!host) throw new Error(`the ${mode} did not render`);
  return host;
};

/** The box of one element, by selector, or a failure naming what did not render. */
const box = async (page: Page, selector: string) => {
  const found = await page.locator(selector).boundingBox();
  if (!found) throw new Error(`${selector} did not render`);
  return found;
};

/** A container of `count` numbered children, and the box of each. */
const container = async (
  page: Page,
  mode: string,
  count: number,
  hostWidth: number,
  between = '',
) => {
  // The extra markup goes after the first child, where an injected script sibling
  // lands, and never last: a trailing one would take no column anyway.
  const children = Array.from({ length: count }, (_, i) => child(i + 1));
  const host = await compose(
    page,
    mode,
    `${children[0]}${between}${children.slice(1).join('')}`,
    hostWidth,
  );
  const regions = await Promise.all(
    Array.from({ length: count }, (_, i) => box(page, `#region-${i + 1}`)),
  );
  return { host, regions };
};

/**
 * The two row modes. Their compositions differ only in how many fixed tracks they
 * have and how wide those are, so one set of assertions covers both.
 */
const MODES = [
  {
    name: 'triad',
    mode: 'content-triad',
    tracks: TRIAD_TRACKS,
    threshold: TRIAD_STEPS,
  },
  {
    name: 'golden',
    mode: 'content-golden',
    tracks: GOLDEN_TRACKS,
    threshold: GOLDEN_STEPS,
  },
];

for (const { name, mode, tracks, threshold } of MODES) {
  const build = (page: Page, hostWidth: number, between = '') =>
    container(page, mode, tracks.length, hostWidth, between);
  /** Two rows' worth of children, for the wrapping cases. */
  const build2 = (page: Page, hostWidth: number) =>
    container(page, mode, 2 * tracks.length, hostWidth);
  const last = tracks.length - 1;

  for (const root of [16, 20]) {
    test(`${name}: the row appears at its threshold, at a ${root}px root`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(BOOK);
      // The text size the reader sets. The tracks are in rem, so the threshold
      // moves with it, and the width comes from the page rather than a literal.
      await page.addStyleTag({ content: `html { font-size: ${root}px; }` });

      const { host, regions } = await build(page, await steps(page, threshold));
      const gap = await steps(page, GAP_STEPS);

      for (const [index, track] of tracks.entries()) {
        expect(regions[index].width).toBeCloseTo(await steps(page, track), 0);
        expect(regions[index].y).toBeCloseTo(regions[0].y, 0);
        if (index === 0) continue;
        const previous = regions[index - 1];
        expect(regions[index].x - (previous.x + previous.width)).toBeCloseTo(
          gap,
          0,
        );
      }
      expect(regions[0].x).toBeCloseTo(host.x, 0);
    });

    test(`${name}: one pixel short of the threshold it stacks, at a ${root}px root`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(BOOK);
      await page.addStyleTag({ content: `html { font-size: ${root}px; }` });
      // The tray scales with the root, so the window has to grow with it.
      await page.setViewportSize({
        width: 1600 + (await trayInset(page)),
        height: 900,
      });

      const width = (await steps(page, threshold)) - 1;
      const { host, regions } = await build(page, width);
      const line = await steps(page, LINE_STEPS);

      for (const region of regions) {
        expect(region.width).toBeCloseTo(host.width, 0);
        expect(region.x).toBeCloseTo(host.x, 0);
      }
      expect(regions[1].y - (regions[0].y + regions[0].height)).toBeCloseTo(
        line,
        0,
      );
    });
  }

  test(`${name}: surplus width falls equally outside the row`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const surplus = await steps(page, 20);
    const { host, regions } = await build(
      page,
      (await steps(page, threshold)) + surplus,
    );

    const left = regions[0].x - host.x;
    const right = host.x + host.width - (regions[last].x + regions[last].width);
    expect(left).toBeCloseTo(right, 0);
    // Half the surplus, so the first golden column does not line up with a prose
    // flow above it even though the two are the same width.
    expect(left).toBeCloseTo(surplus / 2, 0);
  });

  test(`${name}: between the measure and the threshold every region fills the host`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const measure = await steps(page, MEASURE_STEPS);
    const { host, regions } = await build(page, await steps(page, 100));

    for (const region of regions) {
      expect(region.width).toBeCloseTo(host.width, 0);
      // A stacked child does not take the prose cap.
      expect(region.width).toBeGreaterThan(measure);
    }
  });

  test(`${name}: script, style and template children take no track`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const { regions } = await build(
      page,
      await steps(page, threshold),
      '<script></script><style></style><template></template>',
    );

    for (const [index, track] of tracks.entries()) {
      expect(regions[index].width).toBeCloseTo(await steps(page, track), 0);
      expect(regions[index].y).toBeCloseTo(regions[0].y, 0);
    }
  });

  test(`${name}: an astro-island keeps the track of the region it renders`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    // The hydration wrapper is display: contents, so the element it renders is the
    // grid item. A deferred child moves through its states inside one of these.
    const { regions } = await build(page, await steps(page, threshold));
    await page.evaluate(() => {
      const region = document.querySelector('#region-2');
      const island = document.createElement('astro-island');
      region?.replaceWith(island);
      if (region) island.append(region);
    });

    const wrapped = await page.locator('#region-2').boundingBox();
    if (!wrapped) throw new Error('the wrapped region did not render');
    expect(wrapped.width).toBeCloseTo(await steps(page, tracks[1]), 0);
    expect(wrapped.y).toBeCloseTo(regions[0].y, 0);
  });

  test(`${name}: a region reports its own track, named and unnamed`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    // Each child is also a surface, so it carries the name the surface states. An
    // unnamed query finds that same nearest boundary. Both report the track after
    // the surface inset, and not the surrounding box.
    await page.addStyleTag({
      content: `
        #probe-content, #probe-area, #probe-host { color: rgb(1, 1, 1); }
        @container (max-width: 16rem) { #probe-content { color: rgb(0, 255, 0); } }
        @container surface-area (max-width: 16rem) { #probe-area { color: rgb(0, 255, 0); } }
        @container (min-width: 40rem) { #probe-host { color: rgb(0, 255, 0); } }
      `,
    });
    await build(page, await steps(page, threshold));
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
    await expect(page.locator('#probe-host')).toHaveCSS(
      'color',
      'rgb(1, 1, 1)',
    );
  });

  test(`${name}: a wide descendant does not push its region past its track`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const { regions } = await build(page, await steps(page, threshold));
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

  test(`${name}: a short region ends at its content, not at its neighbour`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const { regions } = await build(page, await steps(page, threshold));
    await page.evaluate(() => {
      const tall = document.createElement('div');
      tall.style.blockSize = '30rem';
      document.querySelector('#region-1')?.append(tall);
    });

    // Scoped to the fixture: the book itself renders a container of each mode.
    const row = await page.locator(`#container-host > .${mode}`).boundingBox();
    const [primary, short] = await Promise.all([
      page.locator('#region-1').boundingBox(),
      page.locator('#region-2').boundingBox(),
    ]);
    if (!row || !primary || !short) throw new Error('the row did not render');

    // A grid item stretches to its row by default, which would paint a short
    // aside's surface down the whole of a long column beside it.
    expect(short.height).toBeCloseTo(regions[1].height, 0);
    expect(short.height).toBeLessThan(primary.height);
    // The row is still as tall as its tallest child.
    expect(row.height).toBeCloseTo(primary.height, 0);
  });

  test(`${name}: a prose container fills the region it sits in`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    // The first column is at most the measure, so the prose cap cannot narrow it.
    // A nested prose flow therefore fills the child and adds no inset.
    const { regions } = await build(page, await steps(page, threshold));
    await page.evaluate(() => {
      const prose = document.createElement('div');
      prose.className = 'content-prose';
      prose.innerHTML = '<p id="nested">nested prose</p>';
      document.querySelector('#region-1')?.replaceChildren(prose);
    });

    const nested = await page.locator('#nested').boundingBox();
    if (!nested) throw new Error('the nested prose did not render');
    // The child sets the surface inset, not the nested prose, so measure inside
    // the child.
    const inset = await page.evaluate(() =>
      Number.parseFloat(
        getComputedStyle(document.querySelector('#region-1') as Element)
          .paddingInline,
      ),
    );
    expect(nested.width).toBeCloseTo(regions[0].width - 2 * inset, 0);
  });

  test(`${name}: more children than columns fill successive rows`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const columns = tracks.length;
    const { regions } = await build2(page, await steps(page, threshold));
    const line = await steps(page, LINE_STEPS);

    // Source order across the rows: each child keeps the column its ordinal
    // assigns, and the second row starts again at the first column.
    for (const [index, region] of regions.entries()) {
      expect(region.width).toBeCloseTo(
        await steps(page, tracks[index % columns]),
        0,
      );
      expect(region.x).toBeCloseTo(regions[index % columns].x, 0);
      expect(region.y).toBeCloseTo(regions[index - (index % columns)].y, 0);
    }

    const first = regions[0];
    const second = regions[columns];
    expect(second.y - (first.y + first.height)).toBeCloseTo(line, 0);
  });

  test(`${name}: a partial last row leaves its remaining columns empty`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const columns = tracks.length;
    const { regions } = await container(
      page,
      mode,
      columns + 1,
      await steps(page, threshold),
    );

    // The one child of the last row keeps the first column's measure rather than
    // spreading over the columns beside it, which stay empty.
    const alone = regions[columns];
    expect(alone.width).toBeCloseTo(await steps(page, tracks[0]), 0);
    expect(alone.x).toBeCloseTo(regions[0].x, 0);
    expect(alone.y).toBeGreaterThan(regions[0].y + regions[0].height);
  });

  test(`${name}: a breakout spans every column of its row`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const columns = tracks.length;
    const filled = Array.from({ length: columns }, (_, i) => child(i + 1));
    const host = await compose(
      page,
      mode,
      `${filled.join('')}<div id="wide-child" class="breakout surface">Breakout</div>`,
      await steps(page, threshold),
    );

    const first = await box(page, '#region-1');
    const breakout = await box(page, '#wide-child');
    expect(breakout.width).toBeCloseTo(host.width, 0);
    expect(breakout.x).toBeCloseTo(host.x, 0);
    expect(breakout.y).toBeGreaterThan(first.y + first.height);
  });

  test(`${name}: a breakout begins a row of its own`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BOOK);

    const host = await compose(
      page,
      mode,
      `${child(1)}<div id="wide-child" class="breakout surface">Breakout</div>${child(2)}`,
      await steps(page, threshold),
    );
    const line = await steps(page, LINE_STEPS);

    // The row holding the first child has a column to spare, and the breakout
    // does not join it: a child forced to start at the first column ends the row
    // before it, and the child after the breakout starts another.
    const first = await box(page, '#region-1');
    const breakout = await box(page, '#wide-child');
    const after = await box(page, '#region-2');

    expect(first.width).toBeCloseTo(await steps(page, tracks[0]), 0);
    expect(breakout.width).toBeCloseTo(host.width, 0);
    expect(breakout.y - (first.y + first.height)).toBeCloseTo(line, 0);
    expect(after.x).toBeCloseTo(first.x, 0);
    expect(after.y - (breakout.y + breakout.height)).toBeCloseTo(line, 0);
  });
}
