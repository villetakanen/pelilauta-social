import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnRail`: which of its two widths and two
 * presentations a real `@container` query resolves; whether the toggle
 * pair the container displays is actually gone from the tab order and from
 * assistive technology, and the other pair actually stands; whether `Escape`,
 * the focus boundary and the scrim actually work, which needs the page's own
 * script running; and the accessible name a real `nav` landmark resolves to.
 * None of that can be read off the stylesheet or the markup on their own.
 *
 * `CnRail` answers the `app-chrome` container's own inline size, never the
 * window (`specs/design-system/rail/spec.md`, Architecture). Two kinds of
 * subject appear below, and only one of them may legitimately drive a rail by
 * resizing the Playwright viewport:
 *
 * - The design site's own shell mounts a rail inside `CnAppChrome`
 *   (`apps/design/src/layouts/Book.astro`), whose `.app-chrome` establishes
 *   `container: app-chrome / inline-size` at `100dvw`
 *   (`packages/design-system/components/CnAppChrome.astro`). There, and only
 *   there, the window and the container are the same box, so setting the
 *   viewport does select the rail's band — legitimately, because the two
 *   coincide, not because the rail answers the window. Every test that opens
 *   or closes the rail interactively uses this instance, rather than a
 *   `RailSpecimens` frame: a frame's own `transform` — stated to give it a
 *   containing block for its absolutely positioned rail — combines with its
 *   `container-type` to leave the covering drawer's fixed-position width
 *   unresolved in this browser, stretching it to the frame's own inline size
 *   instead of `--cn-width-rail-expanded`. The shell carries no such
 *   transform and is not affected; this is a `RailSpecimens` frame
 *   construction question, not a `CnRail` defect, and is reported as such
 *   rather than folded into a weaker assertion here.
 * - `RailSpecimens.astro`'s bounded `.frame`s establish that same container
 *   themselves, at a width the frame states, wholly independent of the
 *   window (`packages/design-system/books/specimens/RailSpecimens.astro`).
 *   The tests under "the container decides the band" below hold the window
 *   at a size from the opposite band and prove the frame's own width still
 *   wins — the contract nothing else in this file would otherwise cover.
 *   Only the resting state is asserted there, which the drawer-width
 *   quirk above does not reach.
 *
 * Every expected length is resolved from a token on this same page, the way
 * `cn-app-bar.spec.ts` and `chrome-actions.spec.ts` resolve their own
 * geometry — never a hardcoded pixel value.
 *
 * The shell-driven tests below load `NEUTRAL_BOOK`
 * (`/components/cn-app-bar`) rather than this book's own page. This book's
 * own page (`BOOK`) renders `RailSpecimens`' canonical specimen in its own
 * content, inside the very `[data-cn-rail-scope]` the shell's cede rule
 * reads (`packages/design-system/styles/rail.css`); that specimen's wide
 * control rests checked by markup and never changes, so its presence alone
 * satisfies `:has(.cn-rail-toggle.wide:checked)` regardless of what the
 * shell's own rail does, pinning `--cn-rail-occupies` to the expanded width
 * on this one page. `cn-app-bar`'s book carries no rail specimen of its own,
 * so it is the page where the shell's cede mechanism is actually being
 * tested, not incidentally short-circuited by this book's own content. This
 * is a discovered gap in how `Book.astro` marks its scope — not a defect
 * this file's subject, `CnRail`, is answerable for — reported rather than
 * quietly worked around.
 */

const BOOK = '/components/cn-rail';
const NEUTRAL_BOOK = '/components/cn-app-bar';

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
 * The rail's own width and opacity transitions mean a computed style read
 * immediately after a resize or a click can catch the animation mid-flight.
 * Read `--cn-duration-ui` off the page itself and wait past it — never a
 * guessed sleep, the way `chrome-actions.spec.ts` waits past its own
 * transitions.
 */
const waitPastTransition = async (page: Page) => {
  const durationMs = await page.evaluate(() => {
    const node = document.createElement('div');
    node.style.transitionDuration = 'var(--cn-duration-ui)';
    document.body.append(node);
    const value = getComputedStyle(node).transitionDuration;
    node.remove();
    return Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);
  });
  await page.waitForTimeout(durationMs + 50);
};

/** The `--cn-chrome-presentation` this rail itself resolved, trimmed. */
const presentationOf = (rail: Locator) =>
  rail.evaluate((node) =>
    getComputedStyle(node).getPropertyValue('--cn-chrome-presentation').trim(),
  );

/**
 * The design site's own rail — a direct descendant of `.app-chrome`, per
 * `Book.astro`. Its container is the window itself (see the file header),
 * which is what makes every viewport-driven test below legitimate.
 */
const shellRail = (page: Page) => page.locator('.app-chrome [data-cn-rail]');

/**
 * The `figure` a `<Composition>` wraps one of this book's own specimens in,
 * found by a distinctive substring of its own caption.
 */
const specimenFigure = (page: Page, captionSubstring: string) =>
  page.locator('#content figure').filter({ hasText: captionSubstring });

/** One pane — Light or Dark — of a `RailSpecimens` group. */
const paneIn = (figure: Locator, mode: 'light' | 'dark' = 'light') =>
  figure.locator(`[data-mode="${mode}"]`);

const railIn = (scope: Locator) => scope.locator('[data-cn-rail]');

const CANONICAL_CAPTION =
  'CnRail, expanded, with a header, two destinations and a footer, in Light and Dark';
const BOXES_CAPTION =
  'The same rail with a header and a footer, and with neither, collapsed, in Light and Dark';

/** `RailSpecimens group="canonical"` — bounded in the expanded (desktop) band. */
const canonicalRail = (page: Page) =>
  railIn(paneIn(specimenFigure(page, CANONICAL_CAPTION)));

/** `RailSpecimens group="boxes"` — both frames bounded in the collapsed (tablet) band. */
const boxesFrames = (page: Page) =>
  paneIn(specimenFigure(page, BOXES_CAPTION)).locator('.frame');
const boxesFullRail = (page: Page) => railIn(boxesFrames(page).nth(0));
const boxesBodyOnlyRail = (page: Page) => railIn(boxesFrames(page).nth(1));

/** The three band widths this file resizes the shell's own rail to, each well
 * inside the band it names rather than at its edge. */
const bandWidths = async (page: Page) => {
  const small = Number.parseFloat(
    await resolveLength(page, 'width', 'var(--cn-breakpoint-small)'),
  );
  const tablet = Number.parseFloat(
    await resolveLength(page, 'width', 'var(--cn-breakpoint-tablet)'),
  );
  return {
    small: Math.round(small) - 60,
    tablet: Math.round(small) + 200,
    desktop: Math.round(tablet) + 240,
  };
};

test.describe('the container decides the band, not the window', () => {
  test('a rail bounded in the collapsed band rests collapsed while the window sits in the expanded band', async ({
    page,
  }) => {
    await page.goto(BOOK);
    // Larger than any band the stylesheet defines, so a window-driven rail
    // would rest expanded here — the opposite of what this asserts.
    await page.setViewportSize({ width: 1920, height: 1080 });

    const collapsed = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-collapsed)',
    );
    const rail = boxesFullRail(page);
    expect(await rail.evaluate((n) => getComputedStyle(n).width)).toBe(
      collapsed,
    );
    expect(await presentationOf(rail)).toBe('compact');
    await expect(rail.locator('.cn-rail-trigger.wide')).toBeHidden();
  });

  test('a rail bounded in the expanded band rests expanded while the window sits in the small band', async ({
    page,
  }) => {
    await page.goto(BOOK);
    // Narrower than --cn-breakpoint-small, so a window-driven rail would
    // rest absent here — the opposite of what this asserts.
    await page.setViewportSize({ width: 320, height: 640 });

    const expanded = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-expanded)',
    );
    const rail = canonicalRail(page);
    expect(await rail.evaluate((n) => getComputedStyle(n).width)).toBe(
      expanded,
    );
    expect(await presentationOf(rail)).toBe('labelled');
    await expect(rail.locator('.cn-rail-trigger.narrow')).toBeHidden();
  });
});

test.describe("resting and asked-for widths, on the design site's own rail", () => {
  // Legitimate here, and only here: see the file header.
  let widths: { small: number; tablet: number; desktop: number };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(NEUTRAL_BOOK);
    widths = await bandWidths(page);
    await page.close();
  });

  test('the small band: the rail rests absent and its trigger stands alone; asking for it opens covering the page over a scrim', async ({
    page,
  }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.small, height: 900 });
    await waitPastTransition(page);
    const rail = shellRail(page);
    const drawer = rail.locator('.cn-rail-drawer');
    const scrim = rail.locator('.cn-rail-scrim');
    const trigger = rail.locator('.cn-rail-trigger.narrow');

    await expect(drawer).toBeHidden();
    await expect(trigger).toBeVisible();

    const expanded = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-expanded)',
    );
    await trigger.click();
    await waitPastTransition(page);
    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((n) => getComputedStyle(n).width)).toBe(
      expanded,
    );
    expect(await scrim.evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
  });

  test('the tablet band: the rail rests collapsed at the collapsed width, ceding it; asking for it covers the page at the expanded width over a scrim, ceding only the collapsed width', async ({
    page,
  }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.tablet, height: 900 });
    await waitPastTransition(page);
    const rail = shellRail(page);
    const main = page.locator('.app-main');
    const collapsed = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-collapsed)',
    );
    const expanded = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-expanded)',
    );

    expect(await rail.evaluate((n) => getComputedStyle(n).width)).toBe(
      collapsed,
    );
    expect(await presentationOf(rail)).toBe('compact');
    expect(
      await main.evaluate((n) => getComputedStyle(n).marginInlineStart),
    ).toBe(collapsed);

    const trigger = rail.locator('.cn-rail-trigger.narrow');
    const drawer = rail.locator('.cn-rail-drawer');
    const scrim = rail.locator('.cn-rail-scrim');
    await trigger.click();
    await waitPastTransition(page);

    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((n) => getComputedStyle(n).width)).toBe(
      expanded,
    );
    expect(await scrim.evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
    // A covering rail is never ceded to: the main region keeps only the
    // collapsed width it already held.
    expect(
      await main.evaluate((n) => getComputedStyle(n).marginInlineStart),
    ).toBe(collapsed);
  });

  test('the desktop band: the rail rests expanded beside the page at the expanded width, ceding it, with no scrim; asking for it collapses beside the page at the collapsed width', async ({
    page,
  }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.desktop, height: 900 });
    await waitPastTransition(page);
    const rail = shellRail(page);
    const main = page.locator('.app-main');
    const collapsed = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-collapsed)',
    );
    const expanded = await resolveLength(
      page,
      'width',
      'var(--cn-width-rail-expanded)',
    );

    expect(await rail.evaluate((n) => getComputedStyle(n).width)).toBe(
      expanded,
    );
    expect(await presentationOf(rail)).toBe('labelled');
    expect(
      await main.evaluate((n) => getComputedStyle(n).marginInlineStart),
    ).toBe(expanded);
    await expect(rail.locator('.cn-rail-scrim')).toBeHidden();

    const trigger = rail.locator('.cn-rail-trigger.wide');
    await trigger.click();
    await waitPastTransition(page);

    expect(await rail.evaluate((n) => getComputedStyle(n).width)).toBe(
      collapsed,
    );
    expect(await presentationOf(rail)).toBe('compact');
    expect(
      await main.evaluate((n) => getComputedStyle(n).marginInlineStart),
    ).toBe(collapsed);
  });
});

test.describe('exactly one trigger stands, in the tab order and to assistive technology', () => {
  let widths: { small: number; tablet: number; desktop: number };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(NEUTRAL_BOOK);
    widths = await bandWidths(page);
    await page.close();
  });

  for (const band of ['small', 'tablet', 'desktop'] as const) {
    test(`at the ${band} band`, async ({ page }) => {
      await page.goto(NEUTRAL_BOOK);
      await page.setViewportSize({ width: widths[band], height: 900 });
      const rail = shellRail(page);
      const narrowTrigger = rail.locator('.cn-rail-trigger.narrow');
      const wideTrigger = rail.locator('.cn-rail-trigger.wide');
      const narrowToggle = rail.locator('.cn-rail-toggle.narrow');
      const wideToggle = rail.locator('.cn-rail-toggle.wide');

      const [standingTrigger, absentTrigger, standingToggle, absentToggle] =
        band === 'desktop'
          ? [wideTrigger, narrowTrigger, wideToggle, narrowToggle]
          : [narrowTrigger, wideTrigger, narrowToggle, wideToggle];

      await expect(standingTrigger).toBeVisible();
      await expect(absentTrigger).toBeHidden();

      // The checkbox the container removes has no box to lay out — the
      // same thing the component's own script reads (`offsetParent !==
      // null`) to decide what stands in the tab order, so this proves the
      // same fact the script depends on.
      expect(
        await standingToggle.evaluate(
          (n) => (n as HTMLElement).offsetParent !== null,
        ),
      ).toBe(true);
      expect(
        await absentToggle.evaluate(
          (n) => (n as HTMLElement).offsetParent !== null,
        ),
      ).toBe(false);

      // Assistive technology: exactly one checkbox is named by the label.
      await expect(
        rail.getByRole('checkbox', { name: 'Design system books' }),
      ).toHaveCount(1);
    });
  }
});

test('the narrow control rests unchecked and the wide rests checked, as the document states', async ({
  page,
}) => {
  await page.goto(NEUTRAL_BOOK);
  const rail = shellRail(page);
  const narrow = rail.locator('.cn-rail-toggle.narrow');
  const wide = rail.locator('.cn-rail-toggle.wide');

  // `defaultChecked` reflects the `checked` attribute the markup itself
  // carries, unaffected by any interaction a prior assertion may have run.
  expect(
    await narrow.evaluate((n) => (n as HTMLInputElement).defaultChecked),
  ).toBe(false);
  expect(
    await wide.evaluate((n) => (n as HTMLInputElement).defaultChecked),
  ).toBe(true);
});

test('crossing between bands leaves each toggle at the state it held', async ({
  page,
}) => {
  await page.goto(NEUTRAL_BOOK);
  const widths = await bandWidths(page);

  await page.setViewportSize({ width: widths.tablet, height: 900 });
  const rail = shellRail(page);
  const narrowToggle = rail.locator('.cn-rail-toggle.narrow');
  await rail.locator('.cn-rail-trigger.narrow').click();
  await expect(narrowToggle).toBeChecked();

  // Cross into the desktop band, where the narrow pair is out of view.
  await page.setViewportSize({ width: widths.desktop, height: 900 });
  expect(
    await narrowToggle.evaluate((n) => (n as HTMLInputElement).checked),
  ).toBe(true);

  // Cross back: the narrow pair still covers, exactly as left.
  await page.setViewportSize({ width: widths.tablet, height: 900 });
  await waitPastTransition(page);
  await expect(rail.locator('.cn-rail-drawer')).toBeVisible();
  await expect(narrowToggle).toBeChecked();
});

test.describe("keyboard and focus, on the design site's own rail", () => {
  // Legitimate here, and only here: see the file header.
  let widths: { small: number; tablet: number; desktop: number };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(NEUTRAL_BOOK);
    widths = await bandWidths(page);
    await page.close();
  });

  test('the scrim closes a covering rail, and Escape closes it again after reopening, each time returning focus to the toggle', async ({
    page,
  }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.tablet, height: 900 });
    const rail = shellRail(page);
    const trigger = rail.locator('.cn-rail-trigger.narrow');
    const toggle = rail.locator('.cn-rail-toggle.narrow');
    const scrim = rail.locator('.cn-rail-scrim');

    await trigger.click();
    await expect(toggle).toBeChecked();

    // Clicking a <label> natively moves focus to the control it labels —
    // the scrim needs no script of its own for this. A plain click, not a
    // forced one: the scrim is genuinely the topmost, visible, actionable
    // element here once covering, and `force` skips a step Chromium's own
    // label-focusing needs.
    await scrim.click();
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeFocused();

    await trigger.click();
    await expect(toggle).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeFocused();
  });

  test('Escape does nothing where nothing covers', async ({ page }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.desktop, height: 900 });
    // Beside the page, at rest, nothing covers anything.
    const rail = shellRail(page);
    const toggle = rail.locator('.cn-rail-toggle.wide');
    await toggle.focus();
    await expect(toggle).toBeChecked();

    await page.keyboard.press('Escape');
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeFocused();
  });

  test('focus stays within a covering rail, wrapping at both ends', async ({
    page,
  }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.tablet, height: 900 });
    const rail = shellRail(page);
    const toggle = rail.locator('.cn-rail-toggle.narrow');
    await rail.locator('.cn-rail-trigger.narrow').click();
    await expect(toggle).toBeChecked();

    const stopCount = await rail
      .locator('.cn-rail-drawer')
      .evaluate((drawer) => {
        const FOCUSABLE =
          'a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';
        return drawer.querySelectorAll(FOCUSABLE).length;
      });
    expect(stopCount).toBeGreaterThan(0);

    await toggle.focus();
    for (let i = 0; i < stopCount; i++) {
      await page.keyboard.press('Tab');
      const stillWithin = await rail.evaluate((r) =>
        r.contains(document.activeElement),
      );
      expect(stillWithin).toBe(true);
    }
    // One stop past the last, Tab wraps back to the toggle.
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();

    // Shift+Tab from the toggle wraps to the last stop, still inside.
    await page.keyboard.press('Shift+Tab');
    await expect(toggle).not.toBeFocused();
    const stillWithinAfterWrap = await rail.evaluate((r) =>
      r.contains(document.activeElement),
    );
    expect(stillWithinAfterWrap).toBe(true);
  });

  test('focus can leave where nothing covers', async ({ page }) => {
    await page.goto(NEUTRAL_BOOK);
    await page.setViewportSize({ width: widths.desktop, height: 900 });
    // Beside the page, the rail covers nothing, so Tab is free to leave it.
    const rail = shellRail(page);
    const lastLink = rail.getByRole('link').last();
    await lastLink.focus();
    await page.keyboard.press('Tab');
    const stillWithin = await rail.evaluate((r) =>
      r.contains(document.activeElement),
    );
    expect(stillWithin).toBe(false);
  });
});

test.describe('the three boxes', () => {
  test('a header, a body and a footer each render what they hold', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const rail = boxesFullRail(page);
    await expect(rail.locator('.cn-rail-header')).toHaveCount(1);
    await expect(rail.locator('.cn-rail-body')).toHaveCount(1);
    await expect(rail.locator('.cn-rail-footer')).toHaveCount(1);
    await expect(
      rail.locator('.cn-rail-header').getByRole('link', { name: 'Haku' }),
    ).toHaveCount(1);
    await expect(rail.locator('.cn-rail-body').getByRole('link')).toHaveCount(
      2,
    );
    await expect(
      rail
        .locator('.cn-rail-footer')
        .getByRole('link', { name: 'Ilmoitukset' }),
    ).toHaveCount(1);
  });

  test('an empty header or footer renders no space and no line', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const rail = boxesBodyOnlyRail(page);
    // The rail's own logic (`Astro.slots.has`) does not render the box at
    // all when it holds nothing — not merely hide it — so neither its space
    // nor, for the footer, its line exists in the tree.
    await expect(rail.locator('.cn-rail-header')).toHaveCount(0);
    await expect(rail.locator('.cn-rail-footer')).toHaveCount(0);
    await expect(rail.locator('.cn-rail-body')).toHaveCount(1);
  });

  test('the footer draws a line above itself when it renders', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const footer = boxesFullRail(page).locator('.cn-rail-footer');
    // `1px solid`, exactly as the component states it — a literal in the
    // component's own source, not a token, so it is compared directly.
    expect(
      await footer.evaluate((n) => getComputedStyle(n).borderBlockStartWidth),
    ).toBe('1px');
    expect(
      await footer.evaluate((n) => getComputedStyle(n).borderBlockStartStyle),
    ).toBe('solid');
  });
});

test('the landmark carries the label as its accessible name', async ({
  page,
}) => {
  await page.goto(BOOK);
  // The default Playwright viewport (1280×720) sits in the expanded band, so
  // the shell's own rail — and its drawer — are visible without resizing.
  const shellNav = shellRail(page).locator('nav');
  await expect(shellNav).toHaveAccessibleName('Design system books');

  const specimenNav = canonicalRail(page).locator('nav');
  await expect(specimenNav).toHaveAccessibleName('Kirjaston sivut');
});

test('opening a rail a book renders in its own content moves nothing around it', async ({
  page,
}) => {
  await page.goto(BOOK);
  const main = page.locator('.app-main');
  const marginBefore = await main.evaluate(
    (n) => getComputedStyle(n).marginInlineStart,
  );

  const rail = boxesFullRail(page);
  await rail.locator('.cn-rail-trigger.narrow').click();
  await expect(rail.locator('.cn-rail-toggle.narrow')).toBeChecked();

  // A book's specimen carries no `data-cn-rail-scope`, so nothing reads its
  // state — unlike the shell's own rail, whose scope this same margin
  // answers (see the resting/asked-for widths tests above).
  expect(
    await main.evaluate((n) => getComputedStyle(n).marginInlineStart),
  ).toBe(marginBefore);
});
