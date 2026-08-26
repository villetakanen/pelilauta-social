import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnAppBar`: whether its `<header>` actually
 * resolves to the `banner` landmark role, which depends on whether an
 * ancestor is sectioning content — not something a parser can see; whether a
 * real `@container` query, matched against a real `app-chrome` container,
 * actually flips the leading-region glyph and the title at the real width
 * threshold; and whether a scroll-driven `animation-timeline: scroll()`
 * actually reaches full opacity as the document moves, none of which the
 * stylesheet or the component source states on its own.
 *
 * `CnAppBar` answers the `app-chrome` container's own inline size, never the
 * window (`specs/design-system/app-chrome/spec.md`). Two kinds of
 * subject appear below, and only one of them may legitimately drive a bar by
 * resizing the Playwright viewport:
 *
 * - The design site's own shell mounts the bar inside `CnAppChrome`
 *   (`apps/design/src/layouts/Book.astro`), whose `.app-chrome` establishes
 *   `container: app-chrome / inline-size` at `100dvw`
 *   (`packages/design-system/components/CnAppChrome.astro`). There, and only
 *   there, the window and the container are the same box, so setting the
 *   viewport does select the bar's band — legitimately, because the two
 *   coincide, not because the bar answers the window.
 * - `CnAppBarSpecimens.astro`'s bounded `.frame`s establish that same
 *   container themselves, independent of the window
 *   (`packages/design-system/books/specimens/CnAppBarSpecimens.astro`). The
 *   test under "the container decides the band" below holds the window at a
 *   width from the opposite band and proves the frame's own width still wins
 *   — the contract nothing else in this file would otherwise cover.
 *
 * Once `apps/design/src/layouts/Book.astro` mounts the bar as the design
 * site's own shell, every page — including this one — carries two kinds of
 * `.cn-app-bar`: the shell's own live instance, a direct child of `.shell`
 * and thus never nested inside `<main>`, `<article>`, `<aside>`, `<nav>` or
 * `<section>`; and this book's specimens, rendered by `Composition` inside
 * `#content`, which sits inside `<main>` and so can never expose the banner
 * role no matter what the component does. A page-wide `getByRole('banner')`
 * would resolve to whichever of those the browser picks, silently testing
 * the wrong instance for anything but the landmark check itself. Every
 * locator below is therefore anchored explicitly to one instance or the
 * other — `shellBar()` for the shell's own bar, `specimenFigure()` scoped to
 * `#content` for this book's own — and no assertion in this file calls
 * `getByRole('banner')`.
 *
 * Every expected length is resolved from `--cn-grid` on this same page,
 * under the same scheme, the way `chrome-actions.spec.ts` resolves its own
 * geometry — never a hardcoded pixel value.
 */

const BOOK = '/components/cn-app-bar';

/**
 * The shell's own bar: a direct child of `.shell`, per
 * `apps/design/src/layouts/Book.astro`, and therefore the only `.cn-app-bar`
 * on the page that sits outside `<main id="content">` — the one instance
 * the browser can expose as the `banner` landmark at all.
 */
// The shell places the bar in the design system's chrome layer.
const shellBar = (page: Page) =>
  page.locator('.app-chrome > header.cn-app-bar');

/**
 * The `figure` a `<Composition>` wraps one of this book's own specimens in,
 * found by a distinctive substring of its own caption — scoped to `#content`
 * so it can never match the shell's own bar, which carries no figure at all.
 */
const specimenFigure = (page: Page, captionSubstring: string) =>
  page.locator('#content figure').filter({ hasText: captionSubstring });

/** The rendered bar inside a specimen figure — Light and Dark render one each; the first is enough for geometry, which does not vary by scheme. */
const barIn = (figure: Locator) => figure.locator('header.cn-app-bar').first();

/**
 * `CnAppBarSpecimens` group="bands": one frame bounded above
 * `--cn-breakpoint-small`, one below, each establishing the `app-chrome`
 * container itself — independent of the window. `mode` defaults to the
 * first (Light) pane, which is enough for geometry that does not vary by
 * scheme.
 */
const bandFrame = (
  page: Page,
  band: 'wide' | 'small',
  mode: 'light' | 'dark' = 'light',
) =>
  specimenFigure(page, 'above and below')
    .locator(`[data-mode="${mode}"]`)
    .locator(`.frame.${band}`);

const barInFrame = (frame: Locator) => frame.locator('header.cn-app-bar');

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
 * The accessible role a node resolves to, read off the real accessibility
 * tree rather than assumed from markup. `locator.ariaSnapshot()` renders the
 * node itself as the outermost YAML item only when the node is a landmark or
 * otherwise carries a role of its own; nested inside `<main>`, this bar
 * carries none, so its snapshot instead flattens straight to its children —
 * the shell's own bar therefore opens with a `banner` line and the
 * specimen's never does.
 */
const roleOf = async (locator: Locator) => {
  const snapshot = await locator.ariaSnapshot();
  return snapshot.match(/^-\s*([a-z]+)/)?.[1];
};

test.describe('the landmark', () => {
  test("the shell's own bar, mounted outside any sectioning content, resolves to the banner landmark", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const bar = shellBar(page);
    await expect(bar).toHaveCount(1);

    const nested = await bar.evaluate((node) =>
      Boolean(node.closest('main, article, aside, nav, section')),
    );
    expect(nested).toBe(false);

    expect(await roleOf(bar)).toBe('banner');
  });

  test("this book's own specimens, nested inside <main>, never resolve to the banner landmark", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const figure = specimenFigure(page, 'with a context noun');
    const bar = barIn(figure);
    await expect(bar).toHaveCount(1);

    const nested = await bar.evaluate((node) => Boolean(node.closest('main')));
    expect(nested).toBe(true);

    expect(await roleOf(bar)).not.toBe('banner');
  });
});

test.describe('the veil', () => {
  test('is absent while the shell is at its top, and present once the document has scrolled', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const bar = shellBar(page);
    await expect(bar).toHaveCount(1);

    const veilOpacity = () =>
      bar.evaluate((node) => getComputedStyle(node, '::before').opacity);

    await expect.poll(veilOpacity).toBe('0');

    // animation-range: calc(--cn-grid * 2) calc(--cn-grid * 12) — nothing at
    // the top, full once that much of the document has passed beneath.
    // Scrolling well past the range's far end holds the animation at its
    // last frame rather than mid-fade, so the assertion is not racing a
    // partial value.
    const rangeEnd = Number.parseFloat(
      await resolveLength(page, 'width', 'calc(var(--cn-grid) * 12)'),
    );
    await page.evaluate((y) => window.scrollTo(0, y), rangeEnd * 4);

    await expect.poll(veilOpacity).toBe('1');
  });

  test('never renders on the modal bar', async ({ page }) => {
    await page.goto(BOOK);
    const figure = specimenFigure(page, 'modal bar');
    const bar = barIn(figure);

    const veil = await bar.evaluate(
      (node) => getComputedStyle(node, '::before').content,
    );
    expect(veil).toBe('none');
  });
});

test.describe('below and above --cn-breakpoint-small', () => {
  test('the start edge reserves eight grid units and the glyph is absent below the breakpoint, and neither above it', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const eightGrid = await resolveLength(
      page,
      'paddingInlineStart',
      'calc(var(--cn-grid) * 8)',
    );
    // Above the breakpoint a rail stands beneath the bar, and the bar's mark
    // stands on the rail's axis: the rail's box inset plus the inset that
    // centres an Icon in a compact chrome action's target.
    const railAxis = await resolveLength(
      page,
      'paddingInlineStart',
      'calc((var(--cn-width-rail-collapsed) - var(--cn-grid) * 7) / 2 + (var(--cn-grid) * 7 - var(--cn-icon-size)) / 2)',
    );

    const wideBar = barInFrame(bandFrame(page, 'wide'));
    expect(
      await wideBar.evaluate((n) => getComputedStyle(n).paddingInlineStart),
    ).toBe(railAxis);
    await expect(wideBar.locator('.identity > .cn-icon')).toBeVisible();

    const smallBar = barInFrame(bandFrame(page, 'small'));
    expect(
      await smallBar.evaluate((n) => getComputedStyle(n).paddingInlineStart),
    ).toBe(eightGrid);
    await expect(smallBar.locator('.identity > .cn-icon')).toBeHidden();
  });

  test('the shorter title displays below the breakpoint, and the full title above it', async ({
    page,
  }) => {
    await page.goto(BOOK);

    const wideBar = barInFrame(bandFrame(page, 'wide'));
    await expect(wideBar.locator('.full-title')).toBeVisible();
    await expect(wideBar.locator('.short-title')).toBeHidden();

    const smallBar = barInFrame(bandFrame(page, 'small'));
    await expect(smallBar.locator('.full-title')).toBeHidden();
    await expect(smallBar.locator('.short-title')).toBeVisible();
    await expect(smallBar.locator('.short-title')).toHaveText('Vartijat');
  });

  test('a bar given a destination carries one link, named by its wordmark', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const bar = barIn(specimenFigure(page, 'with a context noun'));

    // The glyph and the wordmark are one region and one destination, so a
    // reader pressing either half reaches the same place and hears one link.
    const identity = bar.locator('a.identity');
    await expect(identity).toHaveCount(1);
    await expect(identity).toHaveAttribute('href', '#cn-app-bar');
    await expect(identity).toHaveAccessibleName('Aamunkoin vartijat');
    await expect(identity.locator('.cn-icon')).toHaveCount(1);

    // Chrome, not running text.
    expect(
      await identity.evaluate(
        (node) => getComputedStyle(node).textDecorationLine,
      ),
    ).toBe('none');
  });

  test("the bar's block size is unchanged across both bands, on the default and the modal bar alike", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const eightGridBlock = await resolveLength(
      page,
      'height',
      'calc(var(--cn-grid) * 8)',
    );
    const modalBar = barIn(specimenFigure(page, 'modal bar'));

    for (const band of ['wide', 'small'] as const) {
      const bar = barInFrame(bandFrame(page, band));
      expect(await bar.evaluate((n) => getComputedStyle(n).height)).toBe(
        eightGridBlock,
      );
    }
    expect(await modalBar.evaluate((n) => getComputedStyle(n).height)).toBe(
      eightGridBlock,
    );
  });
});

test.describe('the container decides the band, not the window', () => {
  test('a bar bounded below the breakpoint keeps its small-band rules while the window sits above it', async ({
    page,
  }) => {
    await page.goto(BOOK);
    // Larger than --cn-breakpoint-small by a wide margin, so a
    // window-driven bar would rest in the wide band here — the opposite of
    // what this asserts.
    await page.setViewportSize({ width: 1920, height: 1080 });

    const eightGrid = await resolveLength(
      page,
      'paddingInlineStart',
      'calc(var(--cn-grid) * 8)',
    );
    const bar = barInFrame(bandFrame(page, 'small'));
    expect(
      await bar.evaluate((n) => getComputedStyle(n).paddingInlineStart),
    ).toBe(eightGrid);
    await expect(bar.locator('.identity > .cn-icon')).toBeHidden();
    await expect(bar.locator('.short-title')).toBeVisible();
  });
});

test.describe('the modal bar', () => {
  test('carries the back action in its leading region, and renders no actions', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const figure = specimenFigure(page, 'modal bar');
    const bar = barIn(figure);

    await expect(bar.getByRole('button', { name: 'Takaisin' })).toHaveCount(1);
    await expect(bar.locator('.actions')).toHaveCount(0);
  });
});
