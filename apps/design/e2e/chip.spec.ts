import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about the chip.
 *
 * Every claim here is resolved by the cascade: which rule reaches an element that
 * carries `.chip` alongside its own element type, what a colour resolves to under
 * a scheme, and where a row of chips lands once it has to wrap. None can be parsed
 * out of the stylesheet.
 *
 * The subject is the Chip book, and every chip measured is one the book renders.
 * The book frames each colour specimen in two panels that force a
 * `color-scheme` inline, so both schemes resolve on one page load and a probe
 * mounted in a panel reads that panel's tokens.
 *
 * The expected colours are never written down. Each one is compared against an
 * element styled from the token the surface is built on, resolved by the same panel.
 */

const BOOK = '/base/chip';

/** One scheme panel of a themed composition. */
const panel = (mode: 'light' | 'dark') => `.themed[data-mode="${mode}"]`;

/** A specimen group, inside a scheme panel or standing alone. */
const group = (name: string, scope = '') =>
  `${scope} [data-variant="${name}"]`.trim();

type Tokens = {
  buttonText: string;
  promotedSurface: string;
  onButton: string;
  onSurface: string;
  focusRing: string;
  grid: string;
  disabledOpacity: string;
};

/** The roles the chip is built from, as the given scope resolves them. */
const tokens = (page: Page, scope: string): Promise<Tokens> =>
  page.evaluate((selector) => {
    const host = document.querySelector(selector);
    if (!host) throw new Error(`no scope at ${selector}`);
    const probe = document.createElement('div');
    host.append(probe);

    const read = (declaration: string, property: string) => {
      probe.setAttribute('style', declaration);
      return getComputedStyle(probe).getPropertyValue(property);
    };

    const values = {
      buttonText: read(
        'background-color: var(--cn-button-text);',
        'background-color',
      ),
      promotedSurface: read(
        'background-image: linear-gradient(in oklab 137deg, var(--cn-button-text), color-mix(in oklab, light-dark(var(--cn-color-primary-60), var(--cn-color-primary-50)) 33%, transparent));',
        'background-image',
      ),
      onButton: read('color: var(--cn-on-button);', 'color'),
      onSurface: read('color: var(--cn-on-surface);', 'color'),
      focusRing: read('color: var(--cn-focus-ring);', 'color'),
      grid: read('row-gap: var(--cn-grid);', 'row-gap'),
      disabledOpacity: read('opacity: var(--cn-disabled-opacity);', 'opacity'),
    };
    probe.remove();
    return values;
  }, scope);

type Surface = {
  backgroundColor: string;
  backgroundImage: string;
  color: string;
  cursor: string;
  radius: number;
  height: number;
  textDecorationLine: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  opacity: string;
  pointerEvents: string;
  /** `none` where the hover overlay is not published for this host. */
  overlay: string;
  overlayBackground: string;
  overlayTransition: string;
};

const surface = (chip: Locator): Promise<Surface> =>
  chip.evaluate((node) => {
    const style = getComputedStyle(node);
    const after = getComputedStyle(node, '::after');
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      color: style.color,
      cursor: style.cursor,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      height: node.getBoundingClientRect().height,
      textDecorationLine: style.textDecorationLine,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      overlay: after.content,
      overlayBackground: after.backgroundColor,
      overlayTransition: after.transitionDuration,
    };
  });

for (const mode of ['light', 'dark'] as const) {
  test.describe(`in the ${mode} panel`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BOOK);
    });

    test('a chip link is a full pill on the text-button surface', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const chip = page.locator(`${group('hosts', panel(mode))} a.chip`);
      const resolved = await surface(chip);

      expect(resolved.backgroundColor).toBe(roles.buttonText);
      // A failed var() falls back to transparent, which a missing rule would also
      // produce.
      expect(resolved.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(resolved.color).toBe(roles.onSurface);
      expect(resolved.backgroundImage).toBe('none');
      // A pill, not a rounded rectangle: the radius reaches the chip's half height.
      expect(resolved.radius).toBeGreaterThanOrEqual(resolved.height / 2);
      expect(resolved.textDecorationLine).toBe('none');
      expect(resolved.cursor).toBe('pointer');
    });

    test('a read-only chip does not answer the pointer', async ({ page }) => {
      const chip = page.locator(`${group('hosts', panel(mode))} span.chip`);
      const resting = await surface(chip);
      await chip.hover();
      const hovered = await surface(chip);

      expect(hovered.backgroundColor).toBe(resting.backgroundColor);
      expect(hovered.backgroundImage).toBe(resting.backgroundImage);
      expect(resting.cursor).toBe('default');
      // The wash is published for a link and a command only, so the span has no
      // overlay to paint.
      expect(resting.overlay).toBe('none');
      expect(hovered.overlay).toBe('none');
    });

    test('hover washes an interactive chip over its resting surface', async ({
      page,
    }) => {
      const chip = page.locator(`${group('hosts', panel(mode))} a.chip`);
      const resting = await surface(chip);
      await chip.hover();
      const hovered = await surface(chip);

      expect(resting.overlayBackground).toBe('rgba(0, 0, 0, 0)');
      expect(hovered.overlayBackground).not.toBe('rgba(0, 0, 0, 0)');
      // The wash is an overlay, so the surface and foreground below it are intact.
      expect(hovered.backgroundColor).toBe(resting.backgroundColor);
      expect(hovered.color).toBe(resting.color);
    });

    test('a promoted chip shifts hue and keeps the chip foreground', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const base = page.locator(
        `${group('variants', panel(mode))} a.chip:not(.promoted)`,
      );
      const promoted = page.locator(
        `${group('variants', panel(mode))} a.chip.promoted`,
      );
      const [plain, coloured] = await Promise.all([
        surface(base),
        surface(promoted),
      ]);

      expect(coloured.backgroundImage).toBe(roles.promotedSurface);
      expect(coloured.backgroundImage).not.toBe('none');
      expect(coloured.backgroundImage).not.toBe(plain.backgroundImage);
      // The promotion is a hue shift at the chip's weight, so the foreground is the
      // one a plain chip resolves rather than a filled control's.
      expect(coloured.color).toBe(plain.color);
      expect(coloured.color).toBe(roles.onSurface);
      expect(roles.onSurface).not.toBe(roles.onButton);
    });
  });
}

test.describe('the chip book', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BOOK);
  });

  test('a label chip stays inert and its remove control acts', async ({
    page,
  }) => {
    const host = page
      .locator(`${group('content', panel('light'))} div.chip`)
      .first();
    const remove = host.locator('button:not([disabled])');

    await remove.evaluate((node) => {
      Object.assign(window, { removals: 0 });
      node.addEventListener('click', () => {
        (window as unknown as { removals: number }).removals += 1;
      });
    });
    await remove.click();
    expect(
      await page.evaluate(
        () => (window as unknown as { removals: number }).removals,
      ),
    ).toBe(1);

    const inert = await host.evaluate((node) => ({
      tabIndex: node.tabIndex,
      role: node.getAttribute('role'),
      cursor: getComputedStyle(node).cursor,
      overlay: getComputedStyle(node, '::after').content,
    }));
    expect(inert.tabIndex).toBe(-1);
    expect(inert.role).toBeNull();
    expect(inert.cursor).toBe('default');
    expect(inert.overlay).toBe('none');

    // Hovering the label rather than the control leaves the host as it was.
    await host.locator('> span').hover();
    expect(
      await host.evaluate((node) => getComputedStyle(node, '::after').content),
    ).toBe('none');

    // The remove control keeps its own accessible name, and the chip's scale: a
    // button presentation here would stand taller than the chip that holds it.
    await expect(remove).toHaveAccessibleName('Remove Removable label');
    const scale = await host.evaluate((node) => {
      const control = node.querySelector('button');
      if (!control) throw new Error('no remove control');
      return {
        chip: node.getBoundingClientRect().height,
        control: control.getBoundingClientRect().height,
      };
    });
    expect(scale.control).toBeLessThan(scale.chip);
  });

  test('a disabled command chip stays visible, dimmed and unreachable by pointer', async ({
    page,
  }) => {
    const roles = await tokens(page, panel('light'));
    const chip = page.locator(
      `${group('hosts', panel('light'))} button.chip[disabled]`,
    );

    await chip.evaluate((node) => {
      Object.assign(window, { activations: 0 });
      node.addEventListener('click', () => {
        (window as unknown as { activations: number }).activations += 1;
      });
    });

    const box = await chip.boundingBox();
    if (!box) throw new Error('the disabled chip has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    expect(
      await page.evaluate(
        () => (window as unknown as { activations: number }).activations,
      ),
    ).toBe(0);

    const resolved = await surface(chip);
    expect(resolved.opacity).toBe(roles.disabledOpacity);
    expect(Number.parseFloat(resolved.opacity)).toBeGreaterThan(0);
    expect(resolved.pointerEvents).toBe('none');
    await expect(chip).toBeVisible();
    // Dimmed, not removed: the command is still announced.
    await expect(chip).toHaveAccessibleName('Disabled');
  });

  test('a chip row wraps at the grid gap and keeps each chip intrinsic', async ({
    page,
  }) => {
    const scope = group('wrapping');
    const roles = await tokens(page, scope);
    const geometry = await page.locator(scope).evaluate((node) => {
      const style = getComputedStyle(node);
      const chips = [...node.children].map((chip) => {
        const own = getComputedStyle(chip);
        return {
          top: Math.round(chip.getBoundingClientRect().top),
          overflow: chip.scrollWidth - chip.clientWidth,
          flexGrow: own.flexGrow,
          flexShrink: own.flexShrink,
        };
      });
      return {
        flexWrap: style.flexWrap,
        rowGap: style.rowGap,
        columnGap: style.columnGap,
        rows: new Set(chips.map((chip) => chip.top)).size,
        chips,
      };
    });

    expect(geometry.flexWrap).toBe('wrap');
    expect(geometry.rowGap).toBe(roles.grid);
    expect(geometry.columnGap).toBe(roles.grid);
    expect(geometry.rows).toBeGreaterThan(1);
    for (const chip of geometry.chips) {
      // A squeezed chip would push its own label out of its box.
      expect(chip.overflow).toBeLessThanOrEqual(0);
      expect(chip.flexGrow).toBe('0');
      expect(chip.flexShrink).toBe('0');
    }
  });

  test('keyboard focus draws the focus ring on a chip link', async ({
    page,
  }) => {
    const roles = await tokens(page, panel('light'));
    const chip = page.locator(`${group('hosts', panel('light'))} a.chip`);

    // The first chip is the first focusable element in the content, and the skip
    // link is the first in the page — so the focus arrives by keyboard, which is
    // what :focus-visible asks.
    await page.keyboard.press('Tab');
    await page.locator('a.skip-link').press('Enter');
    await page.keyboard.press('Tab');
    await expect(chip).toBeFocused();

    const resolved = await surface(chip);
    expect(resolved.outlineStyle).toBe('solid');
    expect(resolved.outlineWidth).toBe('2px');
    expect(resolved.outlineColor).toBe(roles.focusRing);
  });

  test('reduced motion lands a state change without a transition', async ({
    page,
  }) => {
    const chip = page.locator(`${group('hosts', panel('light'))} a.chip`);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const moving = await surface(chip);
    expect(Number.parseFloat(moving.overlayTransition)).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const still = await surface(chip);
    expect(still.overlayTransition).toBe('0s');
  });
});
