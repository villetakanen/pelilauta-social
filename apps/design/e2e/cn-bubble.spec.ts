import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnBubble`: which edge the tail grows from,
 * which corner the shape leaves square, how much room the bubble keeps beside
 * itself for the tail, and what the colour roles resolve to per scheme. All of
 * it is cascade, and none of it is readable from the markup that
 * packages/design-system/test/cn-bubble.test.ts asserts.
 *
 * Locators read the book page's `BubbleSpecimen`. The page mounts it twice, once
 * per colour scheme, and the first is the Light one; geometry resolves the same
 * in both, so one panel answers for it. A claim about colour reads both.
 */

const BOOK = '/components/cn-bubble';

const specimen = (page: Page) => page.locator('.bubble-specimen').first();
const bubbles = (root: Locator) => root.locator('.cn-bubble');
const flip = (root: Locator) => root.getByRole('button');

/** The specimen is an Astro island: the flip records nothing before it hydrates. */
async function open(page: Page) {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
  return specimen(page);
}

/** The bubble's box, its reserved margins, and its four corner radii. */
function shape(bubble: Locator) {
  return bubble.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      height: box.height,
      marginStart: Number.parseFloat(style.marginLeft),
      marginEnd: Number.parseFloat(style.marginRight),
      startStart: Number.parseFloat(style.borderTopLeftRadius),
      startEnd: Number.parseFloat(style.borderTopRightRadius),
      endStart: Number.parseFloat(style.borderBottomLeftRadius),
      endEnd: Number.parseFloat(style.borderBottomRightRadius),
      background: style.backgroundColor,
      color: style.color,
    };
  });
}

/** The tail, read off the pseudo-element that draws it. */
function tail(bubble: Locator) {
  return bubble.evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return {
      content: style.content,
      offsetStart: Number.parseFloat(style.left),
      offsetEnd: Number.parseFloat(style.right),
      startWidth: Number.parseFloat(style.borderLeftWidth),
      endWidth: Number.parseFloat(style.borderRightWidth),
      startColor: style.borderLeftColor,
      endColor: style.borderRightColor,
    };
  });
}

/**
 * One gap, in pixels. The token is a calc over the grid, so a custom property
 * read returns the expression; a probe sized by it returns the value.
 */
function gap(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.display = 'block';
    probe.style.blockSize = 'var(--cn-gap)';
    document.body.append(probe);
    const resolved = probe.getBoundingClientRect().height;
    probe.remove();
    return resolved;
  });
}

test.describe('the default variant', () => {
  test('the tail grows from the inline start, out of the square corner', async ({
    page,
  }) => {
    const root = await open(page);
    const bubble = bubbles(root).first();
    const unit = await gap(page);

    const { marginStart, marginEnd, startStart, startEnd, endStart, endEnd } =
      await shape(bubble);
    expect(marginStart).toBeCloseTo(unit, 0);
    expect(marginEnd).toBe(0);
    expect(startStart).toBe(0);
    for (const radius of [startEnd, endStart, endEnd])
      expect(radius).toBeGreaterThan(0);

    const drawn = await tail(bubble);
    expect(drawn.offsetStart).toBeCloseTo(-unit, 0);
    expect(drawn.endWidth).toBeCloseTo(unit, 0);
    expect(drawn.startWidth).toBe(0);
    expect(drawn.endColor).toBe((await shape(bubble)).background);
  });
});

test.describe('the reply variant', () => {
  test('the tail grows from the inline end, out of the square corner', async ({
    page,
  }) => {
    const root = await open(page);
    const bubble = bubbles(root).nth(1);
    const unit = await gap(page);

    const { marginStart, marginEnd, startStart, startEnd, endStart, endEnd } =
      await shape(bubble);
    expect(marginEnd).toBeCloseTo(unit, 0);
    expect(marginStart).toBe(0);
    expect(startEnd).toBe(0);
    for (const radius of [startStart, endStart, endEnd])
      expect(radius).toBeGreaterThan(0);

    const drawn = await tail(bubble);
    expect(drawn.offsetEnd).toBeCloseTo(-unit, 0);
    expect(drawn.startWidth).toBeCloseTo(unit, 0);
    expect(drawn.endWidth).toBe(0);
    expect(drawn.startColor).toBe((await shape(bubble)).background);
  });

  test('it differs from the default variant in shape, not only in colour', async ({
    page,
  }) => {
    const root = await open(page);
    const other = await shape(bubbles(root).first());
    const own = await shape(bubbles(root).nth(1));

    expect(own.background).not.toBe(other.background);
    expect(own.startStart).not.toBe(other.startStart);
    expect(own.startEnd).not.toBe(other.startEnd);
    // The two variants share their foreground in both schemes, so the shape
    // above is the whole of what a reader who cannot see colour has to go on.
    expect(own.color).toBe(other.color);
  });
});

test('a short message keeps the bubble four gaps deep', async ({ page }) => {
  const root = await open(page);
  const unit = await gap(page);

  expect((await shape(bubbles(root).nth(1))).height).toBeGreaterThanOrEqual(
    unit * 4,
  );
});

test('the tail is decoration, so it adds no node to the conversation', async ({
  page,
}) => {
  const root = await open(page);
  const drawn = await tail(bubbles(root).first());

  // A pseudo-element drawing an empty string reaches no accessibility tree.
  expect(drawn.content).toBe('""');
  expect(await root.getByRole('article').count()).toBe(
    await bubbles(root).count(),
  );
});

test.describe('the semantic bands', () => {
  test('a leading header reaches the block-start edge, a trailing footer the block-end edge', async ({
    page,
  }) => {
    const root = await open(page);
    const bubble = bubbles(root).first();
    const box = await shape(bubble);

    const header = await bubble
      .locator('header')
      .evaluate((element) => element.getBoundingClientRect().top);
    const footer = await bubble
      .locator('footer')
      .evaluate((element) => element.getBoundingClientRect().bottom);

    expect(header).toBeCloseTo(box.top, 0);
    expect(footer).toBeCloseTo(box.bottom, 0);
  });
});

test.describe('changing the variant', () => {
  test('the shape and the colours move, the message and its semantics stay', async ({
    page,
  }) => {
    const root = await open(page);
    const bubble = bubbles(root).nth(1);
    const before = await shape(bubble);
    const message = await bubble.textContent();

    await flip(root).click();
    await expect(bubble).not.toHaveClass(/reply/);

    const after = await shape(bubble);
    expect(after.marginStart).toBeCloseTo(before.marginEnd, 0);
    expect(after.startStart).toBe(before.startEnd);
    expect(after.background).not.toBe(before.background);
    expect(await bubble.textContent()).toBe(message);
    expect(await bubble.evaluate((element) => element.tagName)).toBe('ARTICLE');
  });
});

test.describe('the mark', () => {
  /**
   * The book renders the same specimen twice at one viewport: once in a column
   * wide enough to keep the mark, once in a narrow one. Both panels therefore
   * answer to the same window, and only the column differs — which is the whole
   * of the claim that a container decides this and the viewport does not.
   */
  const wide = (page: Page) =>
    page.locator('#content figure .themed .bubble-specimen').first();
  const narrow = (page: Page) =>
    page.locator('#content figure .narrow .bubble-specimen').first();
  const marks = (root: Locator) => root.locator('.cn-bubble-mark');

  test('a wide column keeps the mark, a narrow one at the same viewport drops it', async ({
    page,
  }) => {
    await open(page);

    await expect(marks(wide(page)).first()).toBeVisible();
    expect(await marks(narrow(page)).count()).toBeGreaterThan(0);
    await expect(marks(narrow(page)).first()).toBeHidden();
  });

  test('the mark stands beyond the reserved margin, on the edge the tail occupies', async ({
    page,
  }) => {
    const root = wide(page);
    await open(page);
    const unit = await gap(page);

    const bubble = bubbles(root).first();
    const box = await bubble.evaluate(
      (element) => element.getBoundingClientRect().left,
    );
    const mark = await marks(root)
      .first()
      .evaluate((element) => element.getBoundingClientRect().right);

    // The mark ends where the reserved margin begins, so the tail spans between.
    expect(mark).toBeLessThanOrEqual(box - unit + 1);
  });

  test('the reply variant carries the mark to the other edge', async ({
    page,
  }) => {
    const root = wide(page);
    await open(page);

    const reply = bubbles(root).nth(1);
    const edges = await reply.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right };
    });
    const mark = await marks(root)
      .nth(1)
      .evaluate((element) => element.getBoundingClientRect().left);

    expect(mark).toBeGreaterThanOrEqual(edges.right - 1);
    expect(mark).toBeGreaterThan(edges.left);
  });

  test('the mark is decoration, so it adds no node to the conversation', async ({
    page,
  }) => {
    const root = wide(page);
    await open(page);

    await expect(marks(root).first()).toHaveAttribute('aria-hidden', 'true');
    expect(await root.getByRole('img').count()).toBe(0);
    expect(await root.locator('.cn-bubble-mark a').count()).toBe(0);
  });
});

test('the colour roles resolve differently in Light and Dark', async ({
  page,
}) => {
  await open(page);
  const panels = page.locator('#content figure .themed');
  expect(await panels.count()).toBe(2);

  for (const variant of ['.cn-bubble:not(.reply)', '.cn-bubble.reply']) {
    const painted = await page
      .locator(`#content figure .themed ${variant}`)
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return `${style.backgroundColor} ${style.color}`;
        }),
      );

    expect(painted.length).toBe(2);
    expect(painted[0]).not.toBe(painted[1]);
  }
});
