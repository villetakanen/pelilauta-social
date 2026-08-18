import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What needs a browser: the theme derivation (which scheme the root carries
 * with no override, and that the write and the event follow from it), the
 * accessible-name algorithm over the control's real, rendered markup, and
 * geometry a style container query resolves — none of that can be parsed out
 * of the stylesheet or the component source.
 *
 * `CnThemeSwitch` is icon-only wherever it is mounted: it declares
 * `--cn-chrome-presentation: compact` on its own scope
 * (`.cn-theme-switch-scope`, the button's parent and the element a chrome
 * action's style query reads), so no surrounding container can label it.
 * The book for `/components/cn-theme-switch` renders one live specimen; the
 * design site's own shell mounts a second, independent instance in its
 * masthead. Every locator below reads that rendered specimen rather than a
 * hand-written fixture — see
 * docs/lessons/a-hand-written-fixture-hid-a-live-accessibility-defect.md for
 * the defect that pattern once hid — and every expected length or colour is
 * resolved from a token on this same page, the way `chrome-actions.spec.ts`
 * does with its `resolveLength` and `resolveColor` helpers.
 */

const BOOK = '/components/cn-theme-switch';

const rootScheme = () =>
  document.documentElement.style.colorScheme || '(unset)';

/**
 * The book's own rendered specimen, scoped to `<main id="content">` — the
 * shell's own switch in the masthead (apps/design/src/layouts/Book.astro)
 * lives in `<header class="masthead">`, a sibling of `<main>`, so this scope
 * excludes that second instance structurally, never by caption text. One
 * live specimen exists, so no presentation-matching lookup is needed.
 */
const specimen = (page: Page) => page.locator('#content .cn-theme-switch');

async function activate(page: Page, control: Locator) {
  // The control is an island: a click before it hydrates changes nothing.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    window.addEventListener('cn-theme-change', () => {
      document.body.dataset.themeChanged = 'yes';
    });
  });
  await control.click();
}

/**
 * Resolve a length expression exactly as the stylesheet would, on a
 * throwaway element on this same page — never a hardcoded pixel value.
 */
const resolveLength = (page: Page, property: string, expr: string) =>
  page.evaluate(
    ([property, expr]) => {
      const node = document.createElement('div');
      node.style.position = 'absolute';
      node.style.visibility = 'hidden';
      // biome-ignore lint/suspicious/noExplicitAny: dynamic CSS property name
      (node.style as any)[property] = expr;
      document.body.append(node);
      // biome-ignore lint/suspicious/noExplicitAny: dynamic CSS property name
      const value = (getComputedStyle(node) as any)[property];
      node.remove();
      return value;
    },
    [property, expr] as const,
  );

/**
 * Resolve a colour reference — a custom-property token, or a literal CSS
 * colour keyword — on a throwaway element on this same page.
 */
const resolveColor = (page: Page, colorExpr: string) =>
  page.evaluate((colorExpr) => {
    const node = document.createElement('div');
    node.setAttribute('style', `color: ${colorExpr};`);
    document.body.append(node);
    const value = getComputedStyle(node).color;
    node.remove();
    return value;
  }, colorExpr);

test.describe('with no colour scheme on the root', () => {
  test('a light preference flips to dark, and reports it', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(BOOK);
    await expect(page.evaluate(rootScheme)).resolves.toBe('(unset)');
    const control = specimen(page);

    await activate(page, control);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
    await expect(page.locator('body')).toHaveAttribute(
      'data-theme-changed',
      'yes',
    );
  });

  test('a dark preference flips to light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);
    const control = specimen(page);

    await activate(page, control);

    await expect(page.evaluate(rootScheme)).resolves.toBe('light');
  });

  /*
   * `prefers-color-scheme` resolves to light for a reader who expresses no
   * preference, and `color-scheme: dark light` paints what the reader prefers,
   * so this document is light and the activation reaches dark.
   */
  test('no preference flips to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'no-preference' });
    await page.goto(BOOK);
    const control = specimen(page);

    await activate(page, control);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
  });
});

test.describe('with a colour scheme on the root', () => {
  test('the root value flips, and the change is reported', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);
    await page.evaluate(() => {
      document.documentElement.style.colorScheme = 'light';
    });
    const control = specimen(page);

    await activate(page, control);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
    await expect(page.locator('body')).toHaveAttribute(
      'data-theme-changed',
      'yes',
    );
  });

  test('a second activation returns to the first theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);
    await page.evaluate(() => {
      document.documentElement.style.colorScheme = 'light';
    });
    const control = specimen(page);

    await activate(page, control);
    await control.click();

    await expect(page.evaluate(rootScheme)).resolves.toBe('light');
  });
});

test('the control keeps its size through an activation', async ({ page }) => {
  await page.goto(BOOK);
  const control = specimen(page);
  await control.scrollIntoViewIfNeeded();
  const before = await control.boundingBox();

  await activate(page, control);

  const after = await control.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
});

test.describe('accessible name', () => {
  test('is the label alone, and nothing else', async ({ page }) => {
    await page.goto(BOOK);
    const control = specimen(page);

    await expect(control).toHaveAccessibleName('Switch theme');

    // The decorative Icon (Icon.svelte) renders `aria-hidden="true"` on its
    // <svg> and no role or label of its own — confirmed here against the
    // accessibility tree the button's real, rendered markup produces,
    // rather than a hand-picked assumption about what "decorative" emits.
    // `ariaSnapshot` renders the control as a single `button "<name>"` line
    // with no children at all when nothing else in it is exposed to the
    // tree — an `img` node, or an accessible name carrying the icon's own
    // words, would show up as a nested line here.
    const snapshot = await control.ariaSnapshot();
    expect(snapshot).toBe('- button "Switch theme"');
  });

  test('the label is clipped from view but present to assistive technology', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const control = specimen(page);

    const label = await control
      .locator('> span:not(.cn-icon)')
      .evaluate((node) => ({
        clipPath: getComputedStyle(node).clipPath,
        ariaHidden: node.getAttribute('aria-hidden'),
      }));

    // Present to assistive technology: never removed from the tree.
    expect(label.ariaHidden).toBeNull();
    // Clipped from view: the switch is icon-only wherever it is mounted.
    expect(label.clipPath).not.toBe('none');

    await expect(control).toHaveAccessibleName('Switch theme');
  });

  test('declares its own compact presentation, resisting a labelled ancestor', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const control = specimen(page);

    // `.cn-theme-switch-scope` (the button's parent) declares
    // `--cn-chrome-presentation: compact` on itself, so no ancestor further
    // out can override it — the actual guarantee CnThemeSwitch.svelte exists
    // to provide. Proven here by setting `labelled` directly on an existing,
    // static ancestor already in the book's own rendered markup (the
    // `Composition` panel), never by hand-writing a stand-in control.
    await control.evaluate((node) => {
      let ancestor: HTMLElement | null = node.parentElement;
      while (ancestor && !ancestor.classList.contains('composition')) {
        ancestor = ancestor.parentElement;
      }
      if (!ancestor) {
        throw new Error('No .composition ancestor found on the book page.');
      }
      ancestor.style.setProperty('--cn-chrome-presentation', 'labelled');
    });

    const target = await resolveLength(
      page,
      'width',
      'calc(var(--cn-grid) * 7)',
    );
    const box = await control.evaluate((node) => {
      const style = getComputedStyle(node);
      return { inline: style.width, block: style.height };
    });
    expect(box.inline).toBe(target);
    expect(box.block).toBe(target);

    const clipPath = await control
      .locator('> span:not(.cn-icon)')
      .evaluate((node) => getComputedStyle(node).clipPath);
    expect(clipPath).not.toBe('none');

    await expect(control).toHaveAccessibleName('Switch theme');
  });
});

test('the control exposes no pressed or other accessible state, before and after an activation', async ({
  page,
}) => {
  await page.goto(BOOK);
  const control = specimen(page);

  const stateAttributes = () =>
    control.evaluate((node) => ({
      pressed: node.getAttribute('aria-pressed'),
      expanded: node.getAttribute('aria-expanded'),
      checked: node.getAttribute('aria-checked'),
      current: node.getAttribute('aria-current'),
      role: node.getAttribute('role'),
    }));

  for (const value of Object.values(await stateAttributes())) {
    expect(value).toBeNull();
  }

  await activate(page, control);

  for (const value of Object.values(await stateAttributes())) {
    expect(value).toBeNull();
  }
});

test('the control carries no button surface, no elevation, no link underline, and the compact chrome-action geometry', async ({
  page,
}) => {
  await page.goto(BOOK);
  const control = specimen(page);
  const transparent = await resolveColor(page, 'transparent');
  const target = await resolveLength(page, 'width', 'calc(var(--cn-grid) * 7)');
  const diameter = await resolveLength(
    page,
    'width',
    'calc(var(--cn-grid) * 6)',
  );
  const radius = await resolveLength(
    page,
    'borderRadius',
    'calc(var(--cn-grid) * 3)',
  );

  const surface = await control.evaluate((node) => {
    const own = getComputedStyle(node);
    const before = getComputedStyle(node, '::before');
    return {
      textDecorationLine: own.textDecorationLine,
      backgroundImage: own.backgroundImage,
      backgroundColor: own.backgroundColor,
      boxShadow: own.boxShadow,
      targetInline: own.width,
      targetBlock: own.height,
      surfaceInline: before.width,
      surfaceBlock: before.height,
      surfaceRadius: before.borderRadius,
      surfaceBackground: before.backgroundColor,
    };
  });

  // No content-button surface, no elevation, no link underline.
  expect(surface.textDecorationLine).toBe('none');
  expect(surface.backgroundImage).toBe('none');
  expect(surface.backgroundColor).toBe(transparent);
  expect(surface.boxShadow).toBe('none');
  expect(surface.surfaceBackground).toBe(transparent);

  // The compact chrome-action geometry: a 7-grid square target, a 6-grid
  // circular state surface centred within it.
  expect(surface.targetInline).toBe(target);
  expect(surface.targetBlock).toBe(target);
  expect(surface.surfaceInline).toBe(diameter);
  expect(surface.surfaceBlock).toBe(diameter);
  expect(surface.surfaceRadius).toBe(radius);
});

test.describe('the activation replica', () => {
  test("does not change the control's footprint or move neighbouring content, and lands on the icon at rest", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const control = specimen(page);
    // A fixed, always-present neighbour below the book content: if the
    // activation reflowed the page, this would move.
    const footer = page.locator('footer.site-footer');

    await control.scrollIntoViewIfNeeded();
    const controlBefore = await control.boundingBox();
    const footerBefore = await footer.boundingBox();

    await activate(page, control);

    // Guarded: two absent boxes compare equal, so an unmatched locator would
    // otherwise satisfy both comparisons below without measuring anything.
    expect(controlBefore).not.toBeNull();
    expect(footerBefore).not.toBeNull();

    const controlAfter = await control.boundingBox();
    const footerAfter = await footer.boundingBox();
    expect(controlAfter).toEqual(controlBefore);
    expect(footerAfter).toEqual(footerBefore);

    // The replica is a sibling of the button inside the switch's own
    // `.cn-theme-switch-scope`, never a descendant.
    const scope = control.locator('..');
    const burst = scope.locator('.burst');
    await expect(burst).toBeVisible();
    const icon = control.locator('.cn-icon').first();

    const burstBox = await burst.boundingBox();
    const iconBox = await icon.boundingBox();
    if (!burstBox || !iconBox) {
      throw new Error('The burst or the icon did not render a box.');
    }

    const burstCenter = {
      x: burstBox.x + burstBox.width / 2,
      y: burstBox.y + burstBox.height / 2,
    };
    const iconCenter = {
      x: iconBox.x + iconBox.width / 2,
      y: iconBox.y + iconBox.height / 2,
    };
    const grid = Number.parseFloat(
      await resolveLength(page, 'width', 'var(--cn-grid)'),
    );

    // Horizontally the replica's `translate` is built to centre on the glyph
    // exactly (CnThemeSwitch.svelte). Vertically it lands a fixed
    // quarter-grid below the glyph's own centre by design, so the bound
    // there is loose — wide enough to allow that deliberate offset, narrow
    // enough that a replica landing elsewhere in the control, or off it,
    // still fails.
    expect(Math.abs(burstCenter.x - iconCenter.x)).toBeLessThan(1);
    expect(Math.abs(burstCenter.y - iconCenter.y)).toBeLessThanOrEqual(grid);
  });

  /*
   * `translate` is a property distinct from `transform`, composed after it:
   * scaling the replica about its own centre (the `scale` keyframe) leaves a
   * `translate` offset undisturbed throughout the animation. Nesting that
   * same offset inside `transform: translate(...) scale(...)` instead would
   * multiply it by the growing scale — a live defect this slice found, which
   * only sampling more than once, across the animation, can catch: a single
   * reading taken at rest (scale settled at its final value under
   * `forwards`) cannot tell "always centred" from "centred once it stopped
   * moving".
   */
  test("the replica's centre stays on the icon throughout the scale animation, not only at rest", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const control = specimen(page);
    const icon = control.locator('.cn-icon').first();
    const scope = control.locator('..');

    // Before the box is read, not after: the activation's click scrolls the
    // control into view itself, which would invalidate a box measured here.
    await control.scrollIntoViewIfNeeded();
    const iconBox = await icon.boundingBox();
    if (!iconBox) throw new Error('The icon did not render a box.');
    const iconCenter = {
      x: iconBox.x + iconBox.width / 2,
      y: iconBox.y + iconBox.height / 2,
    };

    await activate(page, control);
    const burst = scope.locator('.burst');
    await expect(burst).toBeVisible();

    const durationMs = await burst.evaluate((node) => {
      const value = getComputedStyle(node).animationDuration;
      return (
        Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000)
      );
    });
    const grid = Number.parseFloat(
      await resolveLength(page, 'width', 'var(--cn-grid)'),
    );

    let waited = 0;
    for (const fraction of [0.1, 0.5, 0.9]) {
      const elapseAt = durationMs * fraction;
      await page.waitForTimeout(Math.max(0, elapseAt - waited));
      waited = elapseAt;

      const box = await burst.boundingBox();
      if (!box) throw new Error('The burst did not render a box.');
      const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

      expect(Math.abs(center.x - iconCenter.x)).toBeLessThan(1);
      expect(Math.abs(center.y - iconCenter.y)).toBeLessThanOrEqual(grid);
    }
  });
});
