import { expect, type Page, test } from '@playwright/test';

/**
 * Behavioural scenarios for the application frame. These need a browser: the bar
 * clearance and the page-edge inset are token lengths that resolve against the
 * root font size, and what a container query reports cannot be read out of a
 * stylesheet at all.
 *
 * The design site's shell is the subject: `Book.astro` puts the class on the
 * `<main>` holding the page body, which is what a consumer does.
 */

const BOOK = '/base/content-containers';
const GAP_STEPS = 2;
const BAR_STEPS = 8;
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

test('the page begins below the bar and one --cn-gap from each edge', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  const gap = await steps(page, GAP_STEPS);
  const bar = await steps(page, BAR_STEPS);
  const frame = await page.locator('main#content').boundingBox();
  // The first child spans the width the frame offers, whatever composition it
  // arranges inside itself, so its box sits exactly at the frame's inset.
  const first = await page
    .locator('main#content > .content-prose')
    .first()
    .boundingBox();
  if (!frame || !first) throw new Error('the frame did not render');

  expect(first.x - frame.x).toBeCloseTo(gap, 0);
  expect(frame.x + frame.width - (first.x + first.width)).toBeCloseTo(gap, 0);
  expect(first.y - frame.y).toBeCloseTo(bar, 0);
});

test('a main that has not opted in carries no inset, clearance or context', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  // The class is the whole opt-in, and nothing here may reach a main that has
  // not taken it.
  const bare = await page.evaluate(() => {
    const main = document.createElement('main');
    document.body.append(main);
    const style = getComputedStyle(main);
    const read = {
      paddingInlineStart: style.paddingInlineStart,
      paddingInlineEnd: style.paddingInlineEnd,
      paddingBlockStart: style.paddingBlockStart,
      containerType: style.containerType,
    };
    main.remove();
    return read;
  });

  expect(bare.paddingInlineStart).toBe('0px');
  expect(bare.paddingInlineEnd).toBe('0px');
  expect(bare.paddingBlockStart).toBe('0px');
  expect(bare.containerType).toBe('normal');
});

test('a child queries the frame content-box width, not the window', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BOOK);

  const width = await page.evaluate(() => {
    const main = document.querySelector('main#content');
    if (!main) return 0;
    const style = getComputedStyle(main);
    return (
      main.getBoundingClientRect().width -
      Number.parseFloat(style.paddingInlineStart) -
      Number.parseFloat(style.paddingInlineEnd)
    );
  });
  expect(width).toBeGreaterThan(0);

  // The two probes bracket the frame's content-box width by one pixel, so only
  // that width answers both the way the assertions expect: the window is wider
  // by the inset and the ceded rail, and a nearer boundary would be narrower.
  await page.addStyleTag({
    content: `
      #frame-probe-under, #frame-probe-over { color: rgb(1, 1, 1); }
      @container (min-width: ${width - 1}px) {
        #frame-probe-under { color: rgb(0, 255, 0); }
      }
      @container (min-width: ${width + 1}px) {
        #frame-probe-over { color: rgb(0, 255, 0); }
      }
    `,
  });
  await page.evaluate(() => {
    const main = document.querySelector('main#content');
    for (const id of ['frame-probe-under', 'frame-probe-over']) {
      const probe = document.createElement('p');
      probe.id = id;
      probe.textContent = id;
      main?.append(probe);
    }
  });

  await expect(page.locator('#frame-probe-under')).toHaveCSS(
    'color',
    'rgb(0, 255, 0)',
  );
  await expect(page.locator('#frame-probe-over')).toHaveCSS(
    'color',
    'rgb(1, 1, 1)',
  );
});
