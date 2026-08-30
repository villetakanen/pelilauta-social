import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * Tests long-press timing, CSS hover and focus stroke colors, and full-turn
 * SVG rendering in a browser environment.
 */

const BOOK = '/extensions/clock';

async function open(page: Page) {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
}

/** Returns the light-theme panel matching the specified caption. */
function lightPanel(page: Page, caption: string | RegExp): Locator {
  return page
    .locator('figure')
    .filter({ has: page.locator('figcaption', { hasText: caption }) })
    .locator('.themed')
    .first();
}

const canonical = (page: Page) => lightPanel(page, 'A four-slice clock');
const modes = (page: Page) =>
  lightPanel(page, 'Interactive, view-only, and disabled');
const weighted = (page: Page) => lightPanel(page, 'Weights [1, 2, 1]');

/** Renders an element's computed stroke color to a canvas and returns RGBA values. */
async function paintedStroke(locator: Locator) {
  return locator.evaluate((node) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    ctx.fillStyle = getComputedStyle(node).stroke;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a };
  });
}

/** Renders a CSS token color within a panel context and returns RGBA values. */
async function tokenColor(panel: Locator, token: string) {
  return panel.evaluate((panelEl, name) => {
    const probe = document.createElement('div');
    probe.style.cssText = `position:fixed;visibility:hidden;color:var(${name});`;
    panelEl.appendChild(probe);
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    ctx.fillStyle = getComputedStyle(probe).color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    probe.remove();
    return { r, g, b, a };
  }, token);
}

test.describe('long-press versus a plain click', () => {
  test('holding past 500ms decrements once, and the click on release does not also increment', async ({
    page,
  }) => {
    await open(page);
    const dial = canonical(page).getByRole('slider', { name: 'Alarm' });
    await expect(dial).toHaveAttribute('aria-valuenow', '2');

    await dial.scrollIntoViewIfNeeded();
    const box = await dial.boundingBox();
    if (!box) throw new Error('the dial has no box to press');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();

    await expect(dial).toHaveAttribute('aria-valuenow', '1');
  });

  test('a short click still increments by one, so the two paths are distinguished', async ({
    page,
  }) => {
    await open(page);
    const dial = canonical(page).getByRole('slider', { name: 'Alarm' });
    await expect(dial).toHaveAttribute('aria-valuenow', '2');

    await dial.click();

    await expect(dial).toHaveAttribute('aria-valuenow', '3');
  });
});

test.describe("the dividing stroke's hover and focus colour", () => {
  test('an interactive dial moves the stroke from field-border to its hover and focus shades', async ({
    page,
  }) => {
    await open(page);
    const panel = modes(page);
    const dial = panel.getByRole('slider', { name: 'Interactive clock' });
    const slice = dial.locator('.cn-clock-slice').first();

    const rest = await paintedStroke(slice);
    expect(rest).toEqual(await tokenColor(panel, '--cn-color-field-border'));

    await dial.scrollIntoViewIfNeeded();
    const box = await dial.boundingBox();
    if (!box) throw new Error('the dial has no box to hover');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    expect(await paintedStroke(slice)).toEqual(
      await tokenColor(panel, '--cn-color-field-border-hover'),
    );

    await page.mouse.move(0, 0);
    await dial.focus();
    expect(await paintedStroke(slice)).toEqual(
      await tokenColor(panel, '--cn-color-field-border-focus'),
    );
  });

  test('a view-only dial ignores hover, keeping the resting field-border shade', async ({
    page,
  }) => {
    await open(page);
    const panel = modes(page);
    const dial = panel.getByRole('img', { name: /View-only clock/ });
    const slice = dial.locator('.cn-clock-slice').first();
    const rest = await tokenColor(panel, '--cn-color-field-border');
    expect(await paintedStroke(slice)).toEqual(rest);

    await dial.scrollIntoViewIfNeeded();
    const box = await dial.boundingBox();
    if (!box) throw new Error('the dial has no box to hover');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    expect(await paintedStroke(slice)).toEqual(rest);
  });

  test('a disabled dial ignores hover, keeping the resting field-border shade', async ({
    page,
  }) => {
    await open(page);
    const panel = modes(page);
    const dial = panel.getByRole('slider', { name: 'Disabled clock' });
    await expect(dial).toHaveAttribute('aria-disabled', 'true');
    const slice = dial.locator('.cn-clock-slice').first();
    const rest = await tokenColor(panel, '--cn-color-field-border');
    expect(await paintedStroke(slice)).toEqual(rest);

    await dial.hover({ force: true });

    expect(await paintedStroke(slice)).toEqual(rest);
  });
});

test.describe('the full-turn disc', () => {
  test('a one-slice clock paints a filled disc, not the hairline a coincident-endpoint arc would leave', async ({
    page,
  }) => {
    await open(page);
    const dial = weighted(page).getByRole('img', { name: /Full-turn clock/ });
    const slice = dial.locator('.cn-clock-slice').first();

    const bbox = await slice.evaluate((el) => {
      const box = (el as unknown as SVGGraphicsElement).getBBox();
      return { width: box.width, height: box.height };
    });

    expect(bbox.width).toBeGreaterThan(85);
    expect(bbox.height).toBeGreaterThan(85);
  });
});
