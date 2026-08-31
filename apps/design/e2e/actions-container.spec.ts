import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about the `.actions` container.
 *
 * Every claim here is a computed-geometry fact: where the cascade puts a
 * control's centre and edges relative to the container's box, whether a row
 * that cannot fit clips instead of growing, and what `display` resolves to for
 * the default and `.inline` containers. None of that is readable from the
 * stylesheet, because it depends on the flex layout algorithm resolving actual
 * control content against the container's actual inline size. What the
 * stylesheet alone can state — the block-size formula, the gap token, the
 * `margin: 0` declaration, the import order against `sortable-list.css` — is
 * covered instead by packages/design-system/test/actions-container.test.ts.
 *
 * The subject is the links-actions-buttons book, and every container measured is
 * one the book renders, or a probe built from the same markup shape. The book
 * frames each specimen in two panels that force a `color-scheme` inline, so both
 * schemes resolve on one page load.
 *
 * The expected block-size and interval are never written down as pixels. Each is
 * resolved from `--cn-grid` and `--cn-gap` through a probe under the same panel,
 * the way apps/design/e2e/chip.spec.ts resolves its tokens.
 */

const BOOK = '/base/links-actions-buttons';

/** One scheme panel of a themed composition. */
const panel = (mode: 'light' | 'dark') => `.themed[data-mode="${mode}"]`;

/** One `ActionsSpecimens` group, inside a scheme panel. */
const specimen = (name: string, mode: 'light' | 'dark') =>
  `${panel(mode)} .actions-specimens[data-group="${name}"]`;

type Tokens = {
  grid: number;
  gap: number;
};

/** `--cn-grid` and `--cn-gap`, as this panel resolves them. */
const tokens = (page: Page, scope: string): Promise<Tokens> =>
  page.evaluate((selector) => {
    const host = document.querySelector(selector);
    if (!host) throw new Error(`no scope at ${selector}`);
    const probe = document.createElement('div');
    host.append(probe);

    const read = (declaration: string, property: string) => {
      probe.setAttribute('style', declaration);
      return Number.parseFloat(
        getComputedStyle(probe).getPropertyValue(property),
      );
    };

    const values = {
      grid: read('height: var(--cn-grid);', 'height'),
      gap: read('row-gap: var(--cn-gap);', 'row-gap'),
    };
    probe.remove();
    return values;
  }, scope);

type Rect = { left: number; right: number; top: number; bottom: number };

type Geometry = {
  display: string;
  rect: Rect;
  controls: Rect[];
};

/** The container's box, its computed display, and each control's box. */
const geometry = (page: Page, containerSelector: string): Promise<Geometry> =>
  page.locator(containerSelector).evaluate((node) => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const controls = [...node.children].map((child) =>
      child.getBoundingClientRect(),
    );
    return {
      display: style.display,
      rect: {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      },
      controls: controls.map((box) => ({
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      })),
    };
  });

const centerY = (box: Rect) => box.top + (box.bottom - box.top) / 2;

for (const mode of ['light', 'dark'] as const) {
  test.describe(`in the ${mode} panel`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BOOK);
    });

    test('the default container is six grid units high and centres both controls', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const geo = await geometry(page, `${specimen('default', mode)} .actions`);

      expect(geo.rect.bottom - geo.rect.top).toBeGreaterThanOrEqual(
        6 * roles.grid - 1,
      );
      expect(geo.rect.bottom - geo.rect.top).toBeLessThanOrEqual(
        6 * roles.grid + 1,
      );
      for (const control of geo.controls) {
        expect(Math.abs(centerY(control) - centerY(geo.rect))).toBeLessThan(1);
      }
    });

    test('the default container keeps the gap interval and pins its first and last control to its edges', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const geo = await geometry(page, `${specimen('default', mode)} .actions`);
      const [first, last] = geo.controls;

      expect(last.left - first.right).toBeGreaterThanOrEqual(roles.gap - 1);
      expect(Math.abs(first.left - geo.rect.left)).toBeLessThan(1);
      expect(Math.abs(last.right - geo.rect.right)).toBeLessThan(1);
    });

    test('justify-start gathers both controls at the inline start', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const geo = await geometry(
        page,
        `${specimen('alignment', mode)} .actions.justify-start`,
      );
      const [first, last] = geo.controls;

      expect(Math.abs(first.left - geo.rect.left)).toBeLessThan(1);
      expect(last.right).toBeLessThan(geo.rect.right);
      expect(last.left - first.right).toBeGreaterThanOrEqual(roles.gap - 1);
    });

    test('justify-end gathers both controls at the inline end', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const geo = await geometry(
        page,
        `${specimen('alignment', mode)} .actions.justify-end`,
      );
      const [first, last] = geo.controls;

      expect(Math.abs(last.right - geo.rect.right)).toBeLessThan(1);
      expect(first.left).toBeGreaterThan(geo.rect.left);
      expect(last.left - first.right).toBeGreaterThanOrEqual(roles.gap - 1);
    });

    test('justify-center gathers both controls at the inline centre', async ({
      page,
    }) => {
      const roles = await tokens(page, panel(mode));
      const geo = await geometry(
        page,
        `${specimen('alignment', mode)} .actions.justify-center`,
      );
      const [first, last] = geo.controls;
      const leadingSpace = first.left - geo.rect.left;
      const trailingSpace = geo.rect.right - last.right;

      expect(Math.abs(leadingSpace - trailingSpace)).toBeLessThan(1);
      expect(last.left - first.right).toBeGreaterThanOrEqual(roles.gap - 1);
    });

    test('the inline modifier computes inline-flex, the default container computes flex', async ({
      page,
    }) => {
      const inlineGeo = await geometry(
        page,
        `${specimen('inline', mode)} .actions.inline`,
      );
      const defaultGeo = await geometry(
        page,
        `${specimen('default', mode)} .actions`,
      );

      expect(inlineGeo.display).toBe('inline-flex');
      expect(defaultGeo.display).toBe('flex');
    });
  });
}

/**
 * Mount a probe `.actions` container, constrained narrower than its controls
 * need, at the top of the book's content. It is a real `.actions` container in
 * the real page, so the same overflow rule that governs a book specimen governs
 * this one.
 */
const mountOverflowProbe = async (page: Page) => {
  await page.evaluate(() => {
    document.getElementById('actions-overflow-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'actions-overflow-probe';
    host.innerHTML = `
      <div style="inline-size: 8rem; max-inline-size: 8rem;">
        <div class="actions">
          <button type="button">A control with a long label</button>
          <button type="button">Another long-labelled control</button>
          <button type="button">A third long-labelled control</button>
        </div>
      </div>
    `;
    document.querySelector('main#content')?.prepend(host);
  });
  return page.locator('#actions-overflow-probe .actions');
};

test.describe('the row that cannot fit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BOOK);
  });

  test('clips its overflow instead of wrapping or growing', async ({
    page,
  }) => {
    const roles = await tokens(page, 'main#content');
    const probe = await mountOverflowProbe(page);

    const geo = await probe.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return {
        height: box.bottom - box.top,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      };
    });

    expect(geo.height).toBeGreaterThanOrEqual(6 * roles.grid - 1);
    expect(geo.height).toBeLessThanOrEqual(6 * roles.grid + 1);
    expect(geo.scrollWidth).toBeGreaterThan(geo.clientWidth);
  });
});
