import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * Three behaviours that need a real browser, because `CnClock.test.ts` and
 * `geometry.test.ts` run under jsdom:
 *
 * - The long-press timer races the click that follows pointer release on real
 *   hardware. A synthetic `MouseEvent('click')` never exercises that race —
 *   jsdom has no event loop separating a scheduled `setTimeout` from the next
 *   dispatched event the way a real pointer-down, wait, pointer-up sequence
 *   does.
 * - Whether the stroke a reader actually sees moves between the field-border,
 *   hover and focus tokens is the cascade evaluating `:hover` and
 *   `:focus-within` against live pointer and focus state, which jsdom does
 *   not simulate.
 * - Whether a one-slice clock's path paints a filled disc, rather than the
 *   degenerate line a coincident-endpoint arc collapses to, is a rendering
 *   fact: `SVGGraphicsElement.getBBox()` measures the rasteriser's geometry
 *   and is not implemented in jsdom at all.
 */

const BOOK = '/extensions/clock';

/** The specimen is an Astro island: interacting before it hydrates does nothing. */
async function open(page: Page) {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
}

/**
 * One `DsComposition themes` block, scoped by its caption. `DsComposition`
 * renders the slot twice, Light then Dark; the semantics and geometry under
 * test resolve once, so the Light panel — the first `.themed` — answers for
 * both, matching `cn-toggle.spec.ts`'s convention.
 */
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

/**
 * A locator's resolved `stroke`, painted onto a 1x1 canvas and read back as
 * bytes. Chromium's computed style preserves an `oklch()`/`light-dark()`
 * declaration literally rather than resolving it to `rgb`, so the only way to
 * compare two such values is to let the canvas paint both and read the pixel
 * — the same device `color-book.spec.ts` uses for `background-color`.
 */
async function paintedStroke(locator: Locator) {
  return locator.evaluate((node) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = getComputedStyle(node).stroke;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a };
  });
}

/**
 * A `--cn-*` custom property's resolved colour, read from inside the given
 * panel so it inherits that panel's `color-scheme` (each `.themed` panel
 * sets it inline) rather than the document's ambient one. A probe element is
 * appended, given `color: var(--token)`, read back, painted onto a canvas the
 * same way `paintedStroke` reads the slice, and removed — the expected value
 * comes from the page's cascade, never a restated colour literal.
 */
async function tokenColor(panel: Locator, token: string) {
  return panel.evaluate((panelEl, name) => {
    const probe = document.createElement('div');
    probe.style.cssText = `position:fixed;visibility:hidden;color:var(${name});`;
    panelEl.appendChild(probe);
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
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
    // A real wait past the 500ms threshold: the component's setTimeout has
    // to fire before the up, exactly as a held pointer does on real
    // hardware.
    await page.waitForTimeout(650);
    await page.mouse.up(); // dispatches the trailing click Playwright would.

    // A long press alone wraps 2 to 1. A trailing increment sneaking through
    // would land on 2 (net zero) or 3 (both applied) — either reveals the
    // guard failed.
    await expect(dial).toHaveAttribute('aria-valuenow', '1');
  });

  test('a short click still increments by one, so the two paths are distinguished', async ({
    page,
  }) => {
    await open(page);
    const dial = canonical(page).getByRole('slider', { name: 'Alarm' });
    await expect(dial).toHaveAttribute('aria-valuenow', '2');

    await dial.click(); // Playwright's click is a fast down/up, well under 500ms.

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

    // Away from the dial, then focused without the pointer over it, so
    // `:focus-within` alone is under test.
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

    // pointer-events: none takes the dial out of hit-testing, so a real
    // pointer never lands on it either — force the hover to prove the
    // stylesheet's `:not([aria-disabled="true"])` guard, rather than only
    // that the browser could not reach it.
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

    // geometry.ts's RADIUS is 46 user units, so a genuine full disc spans a
    // 92-unit box on both axes. The single-arc path this replaces asked SVG
    // for an arc whose two endpoints coincide (start angle and start angle +
    // 2π land on the same point); per the SVG spec a coincident-endpoint arc
    // is omitted entirely, leaving `M cx cy L x y Z` — a line from the centre
    // to one point on the circle, collapsed to zero width on one axis. That
    // bounding box would fail the assertion below; the two-arc split does not.
    expect(bbox.width).toBeGreaterThan(85);
    expect(bbox.height).toBeGreaterThan(85);
  });
});
