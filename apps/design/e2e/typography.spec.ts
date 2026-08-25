import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser resolves about typography: where a rendered block ends, and which
 * step a heading takes once a container query resolves.
 *
 * No test states an expected pixel value. A length comes from a probe carrying the
 * token, and each downshifted heading is measured against the same heading in a
 * container wide enough to render it at full step. A token that moves therefore moves
 * both sides of the comparison, and only a broken rule separates them.
 */

const BOOK = '/principles/typography';

/** The rhythm, in CSS pixels, as the page resolves it. */
const lineUnit = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.blockSize = 'var(--cn-line)';
    document.body.append(probe);
    const resolved = probe.getBoundingClientRect().height;
    probe.remove();
    return resolved;
  });

type Block = { tag: string; gapAfter: number | null };

/** Each child of a region, and the space between it and the child after it. */
const blocks = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const region = document.querySelector(sel);
    if (!region) throw new Error(`${sel} is not on the page`);
    const children = [...region.children];
    return children.map((child, index) => {
      const box = child.getBoundingClientRect();
      const next = children[index + 1]?.getBoundingClientRect();
      return {
        tag: child.tagName.toLowerCase(),
        gapAfter: next ? next.top - box.bottom : null,
      };
    });
  }, selector);

/** The distance from the last child of an element to the inner edge below it. */
const spaceAfterLastChild = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const parent = document.querySelector(sel);
    const last = parent?.lastElementChild;
    if (!parent || !last) throw new Error(`${sel} holds no block`);
    const padding = Number.parseFloat(getComputedStyle(parent).paddingBlockEnd);
    return (
      parent.getBoundingClientRect().bottom -
      padding -
      last.getBoundingClientRect().bottom
    );
  }, selector);

test('every block of a flowing-text region is one line from the next', async ({
  page,
}) => {
  await page.goto(BOOK);

  const line = await lineUnit(page);
  const region = await blocks(page, '#prose-region');

  // The specimen carries one of each block the markdown renderer emits.
  expect(region.map((block: Block) => block.tag)).toEqual([
    'h3',
    'p',
    'ul',
    'blockquote',
    'pre',
    'table',
    'hr',
    'p',
  ]);
  for (const block of region.slice(0, -1)) {
    expect(block.gapAfter, `after ${block.tag}`).toBeCloseTo(line, 0);
  }
});

test('the last block of a region closes flush', async ({ page }) => {
  await page.goto(BOOK);

  expect(await spaceAfterLastChild(page, '#prose-region')).toBeCloseTo(0, 0);
  // :last-child resolves against each parent, so the quote closes flush inside
  // itself while one line still separates it from the block after it.
  expect(
    await spaceAfterLastChild(page, '#prose-region blockquote'),
  ).toBeCloseTo(0, 0);
});

test('a list keeps its items together', async ({ page }) => {
  await page.goto(BOOK);

  const items = await blocks(page, '#prose-region ul');
  expect(items.length).toBeGreaterThan(1);
  for (const item of items.slice(0, -1)) {
    expect(item.gapAfter).toBeCloseTo(0, 0);
  }
});

test('outside a region a block carries no margin', async ({ page }) => {
  await page.goto(BOOK);

  const plain = await blocks(page, '#plain-region');
  expect(plain.length).toBeGreaterThan(1);
  for (const block of plain.slice(0, -1)) {
    expect(block.gapAfter).toBeCloseTo(0, 0);
  }
});

test('a subtitle sits against the heading above it', async ({ page }) => {
  await page.goto(BOOK);

  const pairing = await blocks(page, '#type-pairing');
  const heading = pairing.findIndex((block: Block) => block.tag === 'h3');
  expect(heading).toBeGreaterThanOrEqual(0);
  expect(pairing[heading].gapAfter).toBeCloseTo(0, 0);
});

type Resolved = {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
};

type Downshift = {
  narrow: Record<string, Resolved>;
  wide: Record<string, Resolved>;
  reading: Resolved;
  emphasisWeight: string;
};

/**
 * The same headings in two containers, one either side of the small-screen breakpoint.
 * The threshold comes from the published token rather than a typed value, and each
 * width is set on the container, so the run exercises the container query.
 */
const downshift = (page: Page): Promise<Downshift> =>
  page.evaluate(() => {
    const read = (element: Element): Resolved => {
      const style = getComputedStyle(element);
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        fontWeight: style.fontWeight,
      };
    };

    const threshold = document.createElement('div');
    threshold.style.inlineSize = 'var(--cn-breakpoint-small)';
    document.body.append(threshold);
    const breakpoint = threshold.getBoundingClientRect().width;
    threshold.remove();

    const box = (width: number) => {
      const element = document.createElement('div');
      element.style.containerType = 'inline-size';
      element.style.inlineSize = `${width}px`;
      element.innerHTML =
        '<h1>Aa</h1><h2>Aa</h2><h3>Aa</h3><h4>Aa</h4><p>Aa</p>' +
        '<p style="font-weight: var(--cn-font-weight-emphasis)">Aa</p>';
      document.body.append(element);
      return element;
    };

    const narrowBox = box(breakpoint - 1);
    const wideBox = box(breakpoint + 1);
    const levels = ['h1', 'h2', 'h3', 'h4'];
    const steps = (host: HTMLElement) =>
      Object.fromEntries(
        levels.map((level) => [
          level,
          read(host.querySelector(level) as Element),
        ]),
      );

    const result = {
      narrow: steps(narrowBox),
      wide: steps(wideBox),
      reading: read(wideBox.querySelectorAll('p')[0]),
      emphasisWeight: read(wideBox.querySelectorAll('p')[1]).fontWeight,
    };
    narrowBox.remove();
    wideBox.remove();
    return result;
  });

test('a heading in a narrow container renders one step down', async ({
  page,
}) => {
  await page.goto(BOOK);

  const { narrow, wide } = await downshift(page);
  for (const [level, step] of [
    ['h1', 'h2'],
    ['h2', 'h3'],
    ['h3', 'h4'],
  ]) {
    expect(narrow[level].fontSize, `${level} size`).toBe(wide[step].fontSize);
    expect(narrow[level].lineHeight, `${level} line`).toBe(
      wide[step].lineHeight,
    );
    expect(narrow[level].letterSpacing, `${level} tracking`).toBe(
      wide[step].letterSpacing,
    );
    expect(narrow[level].fontWeight, `${level} weight`).toBe(
      wide[level].fontWeight,
    );
    expect(narrow[level].fontSize).not.toBe(wide[level].fontSize);
  }
});

test('an h4 in a narrow container renders at reading size and the emphasis weight', async ({
  page,
}) => {
  await page.goto(BOOK);

  const { narrow, wide, reading, emphasisWeight } = await downshift(page);
  expect(narrow.h4.fontSize).toBe(reading.fontSize);
  expect(narrow.h4.lineHeight).toBe(reading.lineHeight);
  expect(narrow.h4.letterSpacing).toBe(reading.letterSpacing);
  expect(narrow.h4.fontWeight).toBe(emphasisWeight);
  expect(narrow.h4.fontSize).not.toBe(wide.h4.fontSize);
});

/** A box, and the width its parent offers inside its padding. */
const mediaFit = (page: Page) =>
  page.evaluate(() => {
    const region = document.querySelector('#media-region');
    const image = region?.querySelector('img');
    const icon = region?.querySelector('.cn-icon');
    const glyph = icon?.querySelector('svg');
    if (!region || !image || !icon || !glyph) {
      throw new Error('the media specimen is not on the page');
    }
    const style = getComputedStyle(region);
    return {
      offered:
        region.getBoundingClientRect().width -
        Number.parseFloat(style.paddingInlineStart) -
        Number.parseFloat(style.paddingInlineEnd),
      image: image.getBoundingClientRect(),
      intrinsic: { width: image.naturalWidth, height: image.naturalHeight },
      icon: icon.getBoundingClientRect(),
      glyph: glyph.getBoundingClientRect(),
    };
  });

test('an image wider than its region fits and keeps its ratio', async ({
  page,
}) => {
  await page.goto(BOOK);

  const { offered, image, intrinsic } = await mediaFit(page);
  expect(intrinsic.width).toBeGreaterThan(offered);
  expect(image.width).toBeCloseTo(offered, 0);
  expect(image.height).toBeCloseTo(
    (offered * intrinsic.height) / intrinsic.width,
    0,
  );
});

test('a component sizing its own glyph keeps that size inside a region', async ({
  page,
}) => {
  await page.goto(BOOK);

  const { icon, glyph } = await mediaFit(page);
  expect(icon.height).toBeGreaterThan(0);
  expect(glyph.height).toBeCloseTo(icon.height, 0);
  expect(glyph.width).toBeCloseTo(icon.width, 0);
});
