import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnChatBar`: which of its two responsive
 * presentations a real `@container` query resolves for a given `app-chrome`
 * box, whether the placement root actually lets a pointer through to the
 * document beneath it, whether Enter, Shift+Enter, composition and the
 * disabled state actually gate input the way the source states, and what
 * `field-sizing: content` actually grows and clips at the stated ceiling.
 * None of that can be read off the stylesheet or the markup on their own.
 *
 * `CnChatBar` answers the `app-chrome` container's own inline size, never
 * the window (`specs/design-system/components/cn-chat-bar/spec.md`,
 * Architecture). `ChatBarSpecimens.svelte` gives it two bounded frames — one
 * inside the small band, one past it — that both stand on the page at once,
 * so the container-vs-window distinction is provable without resizing the
 * Playwright viewport at all: both presentations are on screen together, and
 * a real window resize never being involved is exactly the point.
 *
 * Every expected length is resolved from a token on this same page, the way
 * `cn-rail.spec.ts` and `content-container.spec.ts` resolve their own
 * geometry — never a hardcoded pixel value. `--cn-measure` and
 * `--cn-z-chat-bar` are now published to `:root`, so the assertions that
 * read them resolve against real values.
 *
 * `ChatBarSpecimens` renders with no `client:*` directive (its own doc
 * comment: "Static … with no client-side behaviour to demonstrate"), so it
 * carries no hydrated Svelte instance at all — geometry, cascade and native
 * `disabled`/`inert` enforcement are exactly what a browser gives it without
 * a script running. The page hydrates `ChatBarDemo` as its one `client:load` island,
 * and is the only fixture that can prove a send intent, a bound value or a
 * composition guard.
 */

const BOOK = '/components/cn-chat-bar';

const NARROW_CAPTION =
  'Empty, multiline, supporting content, a draft past the frame, and disabled, in the small band';
const WIDE_CAPTION = 'The same five compositions past the small breakpoint';

type Band = 'narrow' | 'wide';
type Composition =
  | 'empty'
  | 'multiline'
  | 'supporting-content'
  | 'at-the-ceiling'
  | 'disabled';

/**
 * Resolve a length or other CSS value exactly as the stylesheet would, on a
 * throwaway element on this same page — never a hardcoded pixel value.
 */
const resolveValue = (page: Page, property: string, expr: string) =>
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
      return value as string;
    },
    [property, expr] as const,
  );

const resolvePx = async (page: Page, property: string, expr: string) =>
  Number.parseFloat(await resolveValue(page, property, expr));

/**
 * The `figure` a `<Composition>` wraps one of this book's own specimen
 * groups in, found by a distinctive substring of its own caption — the same
 * approach `cn-rail.spec.ts` uses for `RailSpecimens`.
 */
const specimenFigure = (page: Page, captionSubstring: string) =>
  page.locator('#content figure').filter({ hasText: captionSubstring });

/** One pane — Light or Dark — of a themed, stacked specimen group. */
const paneIn = (figure: Locator, mode: 'light' | 'dark' = 'light') =>
  figure.locator(`[data-mode="${mode}"]`);

/** The frame for one band's one composition — the real markup, not a stand-in. */
const cellFrame = (
  page: Page,
  band: Band,
  composition: Composition,
  mode: 'light' | 'dark' = 'light',
) =>
  paneIn(
    specimenFigure(page, band === 'narrow' ? NARROW_CAPTION : WIDE_CAPTION),
    mode,
  )
    .locator('.chat-bar-specimens')
    .locator(`.cell[data-composition="${composition}"] .frame`);

const placementRoot = (frame: Locator) =>
  frame.locator('.cn-chat-bar-placement');
const surfaceOf = (frame: Locator) => frame.locator('.cn-chat-bar');

/** `ChatBarDemo` — the page's one hydrated, controlled consumer. */
const demo = (page: Page) => page.locator('.chat-bar-demo');
const demoTextarea = (page: Page) => demo(page).locator('textarea');
const demoReadout = (page: Page) => demo(page).locator('p.text-label');

const EMPTY_READOUT = 'Ei lähetettyjä viestejä.';

/** The demo is an Astro island: an interaction before it hydrates does nothing. */
async function openDemo(page: Page) {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
}

async function clearAndType(page: Page, text: string) {
  const textarea = demoTextarea(page);
  await textarea.click();
  await textarea.fill('');
  await page.keyboard.type(text);
  return textarea;
}

/**
 * Scrolled into view first: several frames on this book page sit below the
 * fold, and a raw `boundingBox()` on an out-of-viewport element yields
 * coordinates a synthetic click can't land on and, worse, a position that
 * shifts by a sub-pixel once something later in the same test scrolls it
 * into view on its own (e.g. a native `focus()`).
 */
const box = async (locator: Locator) => {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  if (!b) throw new Error('not rendered');
  return b;
};

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

test.describe('the small band', () => {
  test('the surface stands at the container block end', async ({ page }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'empty');
    const rootBox = await box(placementRoot(frame));
    const surfaceBox = await box(surfaceOf(frame));

    // No padding applies to the placement root in the small band, so the
    // surface sits flush with the root's own block end.
    expect(surfaceBox.y + surfaceBox.height).toBeCloseTo(
      rootBox.y + rootBox.height,
      0,
    );
  });

  test('it spans the container inline size and stays inside it', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'empty');
    const frameBox = await box(frame);
    const rootBox = await box(placementRoot(frame));
    const surfaceBox = await box(surfaceOf(frame));

    expect(surfaceBox.width).toBeCloseTo(rootBox.width, 0);
    expect(surfaceBox.x).toBeGreaterThanOrEqual(frameBox.x - 0.5);
    expect(surfaceBox.x + surfaceBox.width).toBeLessThanOrEqual(
      frameBox.x + frameBox.width + 0.5,
    );
    expect(surfaceBox.y).toBeGreaterThanOrEqual(frameBox.y - 0.5);
    expect(surfaceBox.y + surfaceBox.height).toBeLessThanOrEqual(
      frameBox.y + frameBox.height + 0.5,
    );
  });

  test('supporting content appears above the input row', async ({ page }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'supporting-content');
    const inputBox = await box(frame.locator('.input-row'));
    const supportingBox = await box(frame.locator('.supporting'));

    expect(supportingBox.y).toBeLessThan(inputBox.y);
  });
});

test.describe('the wider band', () => {
  test('the surface is inset from the block end by --cn-gap', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'wide', 'empty');
    // The root, not the frame: the root sits at the frame's padding edge,
    // one border-width in from the frame's own (border-box) boundingBox, and
    // that border would otherwise read as a false pixel of extra inset.
    const rootBox = await box(placementRoot(frame));
    const surfaceBox = await box(surfaceOf(frame));

    // The wider band pads the placement root by --cn-gap on every side
    // (`.cn-chat-bar-placement { padding: var(--cn-gap); }`), rather than
    // setting an explicit `bottom` on the surface itself, so the inset is
    // read from the rendered geometry, not a CSS offset property.
    const gap = await resolvePx(page, 'padding', 'var(--cn-gap)');
    expect(
      rootBox.y + rootBox.height - (surfaceBox.y + surfaceBox.height),
    ).toBeCloseTo(gap, 0);
  });

  test('the surface is centred in the container', async ({ page }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'wide', 'empty');
    const frameBox = await box(frame);
    const surfaceBox = await box(surfaceOf(frame));

    const leftInset = surfaceBox.x - frameBox.x;
    const rightInset =
      frameBox.x + frameBox.width - (surfaceBox.x + surfaceBox.width);
    expect(leftInset).toBeCloseTo(rightInset, 0);
  });

  test('its inline size does not exceed --cn-measure', async ({ page }) => {
    await page.goto(BOOK);
    const surfaceBox = await box(surfaceOf(cellFrame(page, 'wide', 'empty')));

    const measure = await resolvePx(page, 'maxWidth', 'var(--cn-measure)');
    expect(surfaceBox.width).toBeLessThanOrEqual(measure + 0.5);
  });
});

test('two differently sized app-chrome containers each take their own presentation, in one viewport', async ({
  page,
}) => {
  await page.goto(BOOK);
  const narrowFrame = cellFrame(page, 'narrow', 'empty');
  const wideFrame = cellFrame(page, 'wide', 'empty');
  const narrowSurface = surfaceOf(narrowFrame);
  const wideSurface = surfaceOf(wideFrame);

  // The small band: no padding on the placement root, no radius.
  expect(
    await placementRoot(narrowFrame).evaluate(
      (el) => getComputedStyle(el).padding,
    ),
  ).toBe('0px');
  expect(
    await narrowSurface.evaluate((el) => getComputedStyle(el).borderRadius),
  ).toBe('0px');

  // The wider band: --cn-gap padding on the placement root, a pill at rest.
  const gapPadding = await resolveValue(page, 'padding', 'var(--cn-gap)');
  expect(
    await placementRoot(wideFrame).evaluate(
      (el) => getComputedStyle(el).padding,
    ),
  ).toBe(gapPadding);
  /*
   * Half the resting row, which is a supplied action's seven units — a length,
   * so a bar grown by its draft keeps the same corner.
   */
  const largeRadius = await resolveValue(
    page,
    'borderRadius',
    'calc(var(--cn-grid) * 3.5)',
  );
  expect(
    await wideSurface.evaluate((el) => getComputedStyle(el).borderRadius),
  ).toBe(largeRadius);
});

test('--cn-z-chat-bar stands between the floating-action and scrim roles', async ({
  page,
}) => {
  await page.goto(BOOK);
  const surface = surfaceOf(cellFrame(page, 'wide', 'empty'));

  const zChatBar = Number.parseFloat(
    await surface.evaluate((el) => getComputedStyle(el).zIndex),
  );
  const zFab = await resolvePx(page, 'zIndex', 'var(--cn-z-fab)');
  const zScrim = await resolvePx(page, 'zIndex', 'var(--cn-z-scrim)');

  expect(zChatBar).toBeGreaterThan(zFab);
  expect(zChatBar).toBeLessThan(zScrim);
});

test.describe('pointer pass-through', () => {
  test('a press outside the visible surface reaches the document beneath; a press on the surface does not', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'empty');
    const surface = surfaceOf(frame);

    await page.evaluate(() => {
      (
        window as unknown as { lastClickInSurface?: boolean }
      ).lastClickInSurface = undefined;
      document.addEventListener('click', (event) => {
        (
          window as unknown as { lastClickInSurface?: boolean }
        ).lastClickInSurface =
          (event.target as HTMLElement).closest('.cn-chat-bar') !== null;
      });
    });

    const frameBox = await box(frame);
    // Above the surface: in every band the surface now stands at the
    // container's block end and grows upward from there, so the frame's
    // own top-left corner — over the filler content, above the app-bar rig
    // — sits well outside it, though still inside the placement root,
    // which covers the whole frame.
    await page.mouse.click(frameBox.x + 4, frameBox.y + 4);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { lastClickInSurface?: boolean })
            .lastClickInSurface,
      ),
    ).toBe(false);

    const surfaceBox = await box(surface);
    await page.mouse.click(
      surfaceBox.x + surfaceBox.width / 2,
      surfaceBox.y + surfaceBox.height / 2,
    );
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { lastClickInSurface?: boolean })
            .lastClickInSurface,
      ),
    ).toBe(true);
  });
});

test.describe('controlled input, send and newline', () => {
  test('Enter reports one send intent, leaves the value unchanged, inserts no newline', async ({
    page,
  }) => {
    await openDemo(page);
    const textarea = await clearAndType(page, 'Hello');
    await expect(demoReadout(page)).toHaveText(EMPTY_READOUT);

    await page.keyboard.press('Enter');

    await expect(demoReadout(page)).toHaveText('Lähetetty: Hello');
    await expect(textarea).toHaveValue('Hello');
  });

  test('typing updates the consumer bound value', async ({ page }) => {
    await openDemo(page);
    const textarea = await clearAndType(page, 'Hello');
    await expect(textarea).toHaveValue('Hello');
  });

  test('Shift+Enter inserts a newline and sends nothing', async ({ page }) => {
    await openDemo(page);
    const textarea = await clearAndType(page, 'Hello');

    await page.keyboard.press('Shift+Enter');

    await expect(textarea).toHaveValue('Hello\n');
    await expect(demoReadout(page)).toHaveText(EMPTY_READOUT);
  });

  test('a whitespace-only value sends nothing', async ({ page }) => {
    await openDemo(page);
    await clearAndType(page, '   ');

    await page.keyboard.press('Enter');

    await expect(demoReadout(page)).toHaveText(EMPTY_READOUT);
  });
});

test.describe('text composition', () => {
  /*
   * Chromium gives Playwright no way to drive a real OS-level IME session,
   * so this dispatches the one field the component's own guard reads —
   * `event.isComposing` — on an untrusted keydown, preceded by a real
   * `compositionstart`. It is not a faithful IME fixture, but it exercises
   * exactly the code path `keydown` branches on
   * (`packages/design-system/components/CnChatBar.svelte`:
   * `event.key !== 'Enter' || event.shiftKey || event.isComposing`), which a
   * hand-rolled substitute component would not.
   */
  test('Enter during composition sends nothing and leaves composition running', async ({
    page,
  }) => {
    await openDemo(page);
    const textarea = await clearAndType(page, 'こんにちは');
    await expect(textarea).toHaveValue('こんにちは');

    await textarea.evaluate((el) => {
      el.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true, data: '' }),
      );
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await expect(demoReadout(page)).toHaveText(EMPTY_READOUT);
    await expect(textarea).toHaveValue('こんにちは');
  });
});

test.describe('the disabled presentation', () => {
  test('the textarea cannot be focused, typed into or sent from', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'disabled');
    const textarea = frame.locator('textarea');

    await expect(textarea).toBeDisabled();
    await expect(textarea).toHaveValue('Lähetetään...');

    // A disabled control cannot receive focus at all, which is what keeps
    // typing and Enter from ever reaching the component's send handler —
    // there is no hydrated instance on this static page to spy on directly.
    await textarea.evaluate((el) => (el as HTMLTextAreaElement).focus());
    await expect(textarea).not.toBeFocused();
    await expect(textarea).toHaveValue('Lähetetään...');
  });

  test('the supplied leading and trailing actions are wrapped in inert and cannot take focus', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'disabled');
    const actionRegions = frame.locator('.actions');
    await expect(actionRegions).toHaveCount(2);

    for (const region of await actionRegions.all()) {
      expect(await region.evaluate((el) => el.hasAttribute('inert'))).toBe(
        true,
      );
      /*
       * Every button the region holds, which past the `+` includes the items on
       * its menu surface: the surface is inside the inert region too.
       */
      for (const button of await region.locator('button').all()) {
        await button.evaluate((el) => (el as HTMLButtonElement).focus());
        await expect(button).not.toBeFocused();
      }
    }
  });
});

test.describe('focus indication', () => {
  /*
   * The bar's focus state is the indication, and the control draws no ring:
   * a focused text control matches `:focus-visible` whichever way the reader
   * reached it, so a ring meant for the keyboard lands on every click.
   * `specs/design-system/fields/spec.md` carries the reasoning.
   */
  test('focus changes the bar and no measurement of the control', async ({
    page,
  }) => {
    await openDemo(page);
    const textarea = demoTextarea(page);
    const bar = page.locator('.cn-chat-bar').first();
    const before = await box(textarea);
    const resting = await bar.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );

    await textarea.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(textarea).toBeFocused();

    const after = await box(textarea);
    expect(after).toEqual(before);
    expect(
      await bar.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe(resting);
    expect(
      await textarea.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('none');
  });
});

test.describe('the growth ceiling', () => {
  /*
   * `at-the-ceiling`'s draft is stated to be "longer than any frame here can
   * show, so the bar renders at its ceiling"
   * (`packages/design-system/books/specimens/ChatBarSpecimens.svelte`). The
   * ceiling itself is `.cn-chat-bar-placement`'s own grid:
   * `grid-template-rows: var(--cn-app-bar-height) 1fr`, so the available
   * block size for the surface is the placement root's own content-box
   * height, minus its own block padding (0 in the small band, `--cn-gap` on
   * each side past it), minus `--cn-app-bar-height`.
   */
  const maxSurfaceHeight = async (frame: Locator, page: Page) => {
    const root = placementRoot(frame);
    const rootBox = await box(root);
    const paddingBlock = await root.evaluate((el) => {
      const cs = getComputedStyle(el);
      return (
        Number.parseFloat(cs.paddingBlockStart) +
        Number.parseFloat(cs.paddingBlockEnd)
      );
    });
    const appBarHeight = await resolvePx(
      page,
      'height',
      'var(--cn-app-bar-height)',
    );
    return rootBox.height - paddingBlock - appBarHeight;
  };

  test('the surface stops at the application bar and grows no further', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'at-the-ceiling');
    const surfaceBox = await box(surfaceOf(frame));
    const cap = await maxSurfaceHeight(frame, page);

    expect(surfaceBox.height).toBeLessThanOrEqual(cap + 1);
  });

  /*
   * The control fills its field rather than standing at its own intrinsic
   * height, so at the ceiling the draft is taller than the box that holds it
   * and scrolls inside it. Before that, `scrollHeight` and `clientHeight` came
   * out equal — the excess was invisible, clipped by `.cn-chat-bar`'s
   * `overflow: hidden`, with no scrollbar and no way for a reader to reach it.
   */
  test('the textarea scrolls in the space that is left', async ({ page }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'at-the-ceiling');
    const textarea = frame.locator('textarea');

    const scrollHeight = await textarea.evaluate((el) => el.scrollHeight);
    const clientHeight = await textarea.evaluate((el) => el.clientHeight);
    expect(scrollHeight).toBeGreaterThan(clientHeight);
  });

  /*
   * Spec (Scenario): "Given a chat bar whose draft is longer than its
   * container can show / When it renders / Then its surface reaches the
   * application bar and grows no further / And the input row remains
   * operable." Both halves hold once the control is clamped to the field: the
   * row's cross size is the shrunk box, not the draft's full content height,
   * so the flex-end-aligned actions stay inside the visible surface. While the
   * control was laid out at its content height they landed roughly 900px below
   * the surface's clipped bottom edge — attached, and unreachable.
   */
  test('the input row remains operable at the ceiling', async ({ page }) => {
    await page.goto(BOOK);
    const frame = cellFrame(page, 'narrow', 'at-the-ceiling');
    const surfaceBox = await box(surfaceOf(frame));
    const actionButtons = frame.locator('.actions button');
    const leadingBox = await box(actionButtons.first());
    const trailingBox = await box(actionButtons.last());

    for (const b of [leadingBox, trailingBox]) {
      expect(b.y + b.height).toBeLessThanOrEqual(
        surfaceBox.y + surfaceBox.height + 0.5,
      );
    }
  });
});

test.describe('overflow', () => {
  /*
   * The wide-band, hydrated counterpart of "the growth ceiling" above: the
   * surface caps at the same formula (confirmed: 158px against a 254px root,
   * 64px app-bar height and 16px gap padding on each side), and the draft
   * scrolls in what is left on live typed input as it does on a rendered one.
   */
  test('a value past the growth ceiling stops the surface growing, and the textarea scrolls it', async ({
    page,
  }) => {
    await openDemo(page);
    const frame = demo(page).locator('.frame');
    const surface = surfaceOf(frame);
    const root = placementRoot(frame);
    const textarea = await clearAndType(page, 'Rivi 1');
    for (let i = 2; i <= 20; i += 1) {
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.type(`Rivi ${i}`);
    }

    const rootBox = await box(root);
    const paddingBlock = await root.evaluate((el) => {
      const cs = getComputedStyle(el);
      return (
        Number.parseFloat(cs.paddingBlockStart) +
        Number.parseFloat(cs.paddingBlockEnd)
      );
    });
    const appBarHeight = await resolvePx(
      page,
      'height',
      'var(--cn-app-bar-height)',
    );
    const cap = rootBox.height - paddingBlock - appBarHeight;

    const surfaceBox = await box(surface);
    expect(surfaceBox.height).toBeLessThanOrEqual(cap + 1);

    // Fails today for the same reason documented in "the growth ceiling":
    // the textarea is laid out at its full content height rather than
    // clamped and scrolled.
    const scrollHeight = await textarea.evaluate((el) => el.scrollHeight);
    const clientHeight = await textarea.evaluate((el) => el.clientHeight);
    expect(scrollHeight).toBeGreaterThan(clientHeight);
  });

  test('enlarged text keeps the input row operable in a short container, wrapping without overlap', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await page.addStyleTag({ content: ':root { font-size: 200%; }' });

    const frame = cellFrame(page, 'narrow', 'empty');
    const frameBox = await box(frame);
    const inputBox = await box(frame.locator('.input-row'));
    const actionButtons = frame.locator('.actions button');
    const leadingBox = await box(actionButtons.first());
    const trailingBox = await box(actionButtons.last());

    expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(
      frameBox.y + frameBox.height + 0.5,
    );
    expect(intersects(leadingBox, trailingBox)).toBe(false);

    for (const b of [leadingBox, trailingBox]) {
      expect(b.x).toBeGreaterThanOrEqual(frameBox.x - 0.5);
      expect(b.x + b.width).toBeLessThanOrEqual(
        frameBox.x + frameBox.width + 0.5,
      );
      expect(b.y).toBeGreaterThanOrEqual(frameBox.y - 0.5);
      expect(b.y + b.height).toBeLessThanOrEqual(
        frameBox.y + frameBox.height + 0.5,
      );
    }

    await actionButtons.first().click({ trial: true });
    await actionButtons.last().click({ trial: true });
  });
});

/*
 * Not covered here: the spec's "supporting region scrolls while the input
 * row remains visible" scenario, which needs supporting content taller than
 * the surface. Every fixture's `supporting` region here is a single small
 * chip, never tall enough to overflow, and this file may not add one — see
 * the task's forbidden list (specimens and the book are off limits).
 */
