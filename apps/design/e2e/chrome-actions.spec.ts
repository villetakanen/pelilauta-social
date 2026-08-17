import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `.chrome-action`: the geometry a style
 * container query resolves, whether that query still resolves compact when
 * the declaration sits on the action itself rather than its container, the
 * accessible name assistive technology reads off a visually-hidden label,
 * whether the default Actions link and button presentations are actually
 * displaced, whether the Icon's contextual size resolves to the medium step
 * chrome-actions.css departs from the Actions spec to grant it — and holds
 * that size and its square even when a labelled action is too narrow for its
 * label — and whether the resting, hover, active and keyboard-focus
 * treatment holds a footprint still and paints the right role. None of that
 * can be parsed out of the stylesheet — a container query's resolved branch,
 * the accessible-name algorithm, `:focus-visible` arriving by keyboard rather
 * than by pointer, and layout geometry all depend on the cascade actually
 * running.
 *
 * Every expected length and colour is resolved from a token on this same
 * page, exactly as `links.spec.ts` resolves its colour references — a token
 * whose value moves both sides of the assertion. A body that compares a
 * colour runs once under the light scheme and once under the dark scheme,
 * because a `--cn-*` colour token can resolve to a different value in each;
 * a body that compares only geometry or an accessible name runs once,
 * because neither depends on colour scheme. Mounted on the book page for
 * `/base/chrome-actions`, so any rule that would reach a chrome action there
 * reaches this probe too — and outside `.chrome-action-specimen`, the book's
 * own selector-rewritten copy of the stylesheet, so these tests read the
 * shipped rules and not the specimen's copy of itself.
 *
 * Not covered here: the label losing visibility in compact. That failure is
 * purely visual — it shows up as an icon crowded by a visible label — and
 * `ChromeActionSpecimens.astro` renders both presentations for human review,
 * so the book page is the detector for it.
 */

const BOOK = '/base/chrome-actions';
const PROBE = 'chrome-action-probe';

/** A known, fixed inline size for the labelled target's container to fill. */
const WRAPPER_INLINE_SIZE = '240px';

const mount = async (page: Page, markup: string) => {
  await page.evaluate(
    ([html, id]) => {
      document.getElementById(id)?.remove();
      const host = document.createElement('div');
      host.id = id;
      host.innerHTML = html;
      document.querySelector('main#content')?.prepend(host);
    },
    [markup, PROBE] as const,
  );
};

// The anchor's `onclick` guards mouse-down/mouse-up interaction tests: a real
// click would navigate to its own `href`, tearing down the mounted probe
// mid-test. It changes no selector this file depends on — `a.chrome-action[href]`
// still matches, and the accessible-name and role stay the anchor's own.
//
// The icon span mirrors exactly what `Icon.svelte` renders for the markup the
// book prescribes — `<Icon noun="…" decorative />` — on BOTH axes that matter
// here, and this fixture must keep matching both:
//   - Size: no `size` prop, so `--icon-dim: var(--cn-icon-size)` and
//     `width/height: var(--icon-dim)`, reading the real custom property a
//     chrome action's own scope may override.
//   - Accessibility: `decorative` renders no `role`, no `aria-label` and no
//     `<title>` — `aria-hidden="true"` below is what that decorative Icon
//     actually emits, not a hand-picked shortcut. An Icon WITHOUT
//     `decorative` renders `role="img"` and `aria-label={noun}` instead
//     (Icon.svelte:80-88), which would prefix the accessible name with the
//     noun — exactly the defect a mismatched fixture here once made this
//     file blind to (it asserted its own hand-hidden icon, never the real
//     component's output). Geometry and states below stay probe-only, sound
//     on their own terms; the accessible-name assertion after the probe
//     tests reads the book's own rendered `<Icon>` output instead, so this
//     class of divergence cannot recur silently.
const ICON_STYLE =
  'display:inline-flex;align-items:center;justify-content:center;aspect-ratio:1/1;overflow:hidden;width:var(--cn-icon-size);height:var(--cn-icon-size);';

const action = (role: 'button' | 'anchor', extraStyle = '') =>
  role === 'button'
    ? `<button type="button" class="chrome-action" data-role="button" style="${extraStyle}">
        <span class="cn-icon" aria-hidden="true" style="${ICON_STYLE}"></span>
        <span>Send</span>
      </button>`
    : `<a class="chrome-action" href="/base/chrome-actions" data-role="anchor" onclick="return false;" style="${extraStyle}">
        <span class="cn-icon" aria-hidden="true" style="${ICON_STYLE}"></span>
        <span>Home</span>
      </a>`;

/**
 * A chrome action pair — a command button and a destination anchor — inside
 * a wrapper of known inline size. `presentation`, when given, is declared on
 * the wrapper; omitted, no `--cn-chrome-presentation` declaration exists at
 * all, which is the true "absent" case (a declared-empty value is a
 * different case entirely, and is not one this file needs).
 */
const pair = (presentation?: string) => {
  const declaration = presentation
    ? `--cn-chrome-presentation: ${presentation}; `
    : '';
  return `
    <div class="wrapper" style="${declaration}inline-size: ${WRAPPER_INLINE_SIZE};">
      ${action('button')}
      ${action('anchor')}
    </div>
  `;
};

/**
 * A single action inside a wrapper of known inline size, and nothing else —
 * so it is the only focusable element the probe host contributes, which is
 * what the keyboard-arrival dance below depends on.
 */
const single = (
  presentation: string | undefined,
  role: 'button' | 'anchor',
) => {
  const declaration = presentation
    ? `--cn-chrome-presentation: ${presentation}; `
    : '';
  return `
    <div class="wrapper" style="${declaration}inline-size: ${WRAPPER_INLINE_SIZE};">
      ${action(role)}
    </div>
  `;
};

const button = (page: Page) => page.locator(`#${PROBE} [data-role="button"]`);
const anchor = (page: Page) => page.locator(`#${PROBE} [data-role="anchor"]`);
const wrapper = (page: Page) => page.locator(`#${PROBE} .wrapper`);
const mountedAction = (page: Page) => page.locator(`#${PROBE} .chrome-action`);

/** The target's own computed geometry. */
const targetBox = (locator: ReturnType<typeof button>) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return { inline: style.width, block: style.height };
  });

/** The Icon probe's own computed geometry. */
const iconBox = (locator: ReturnType<typeof button>) =>
  locator.locator('.cn-icon').evaluate((node) => {
    const style = getComputedStyle(node);
    return { inline: style.width, block: style.height };
  });

/** The state surface's (`::before`) computed geometry and background. */
const surfaceStyle = (locator: ReturnType<typeof button>) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node, '::before');
    return {
      inline: style.width,
      block: style.height,
      radius: style.borderRadius,
      background: style.backgroundColor,
    };
  });

/**
 * The indicator layer's (`::after`) computed geometry and background. It is a
 * second layer of the one state surface, beneath `::before`, so persistent
 * state and a transient wash compose instead of overwriting one property.
 */
const indicatorStyle = (locator: ReturnType<typeof button>) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node, '::after');
    return {
      content: style.content,
      inline: style.width,
      block: style.height,
      background: style.backgroundColor,
    };
  });

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
 * colour keyword — on a throwaway element on this same page, the way
 * `links.spec.ts` resolves `--cn-link` and `--cn-focus-ring`.
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

/**
 * The state surface's own `background-color` transition means a computed
 * style read immediately after triggering `:hover` or `:active` catches the
 * animation mid-flight, not the settled target colour. Read the transition
 * duration the stylesheet itself declared on `::before`, from the page, and
 * wait past it — never a guessed sleep.
 */
const waitPastTransition = async (
  page: Page,
  locator: ReturnType<typeof mountedAction>,
) => {
  const durationMs = await locator.evaluate((node) => {
    const value = getComputedStyle(node, '::before').transitionDuration;
    return Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);
  });
  await page.waitForTimeout(durationMs + 50);
};

test("the probe mounts outside the book page's own specimen copy of the stylesheet", async ({
  page,
}) => {
  await page.goto(BOOK);
  await mount(page, pair('compact'));
  const insideSpecimen = await page
    .locator(`#${PROBE}`)
    .evaluate((node) => Boolean(node.closest('.chrome-action-specimen')));
  expect(insideSpecimen).toBe(false);
});

/**
 * The `figure` a `<Composition>` wraps a specimen in, found by a distinctive
 * substring of its own caption — the only thing on the page that names one
 * `ChromeActionSpecimens` group/presentation pair uniquely. This deliberately
 * reads the book's own rendered `<Icon>` output, not a mounted probe: the
 * probe-location guard above keeps probes outside `.chrome-action-specimen`
 * because the specimen's injected, selector-rewritten state-rule copy would
 * corrupt a *geometry* read — it has no bearing on an accessible name, which
 * is exactly why this assertion is safe, and necessary, to run against the
 * specimen directly.
 */
const specimenFigure = (page: Page, captionSubstring: string) =>
  page.locator('figure').filter({ hasText: captionSubstring });

test("the book page's own rendered specimens name a chrome action exactly by its label, with no noun prefix, in compact and in labelled", async ({
  page,
}) => {
  await page.goto(BOOK);

  // "A command and a destination, compact, in Light and Dark" — the only
  // caption containing "compact"; `themes` renders the specimen twice, once
  // per colour scheme, so two of each role is the real, expected count.
  const compact = specimenFigure(page, 'compact, in Light and Dark');
  await expect(
    compact.getByRole('button', { name: 'Send', exact: true }),
  ).toHaveCount(2);
  await expect(
    compact.getByRole('link', { name: 'Back', exact: true }),
  ).toHaveCount(2);

  // "Labelled, on a command and a destination, in Light and Dark".
  const labelled = specimenFigure(
    page,
    'Labelled, on a command and a destination, in Light and Dark',
  );
  await expect(
    labelled.getByRole('button', { name: 'Send', exact: true }),
  ).toHaveCount(2);
  await expect(
    labelled.getByRole('link', { name: 'Back', exact: true }),
  ).toHaveCount(2);
});

// Geometry and the accessible name resolve the same way regardless of colour
// scheme, so each of these runs once. A single `beforeEach` mounts the book
// page with no scheme forced.
test.describe('geometry and the accessible name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BOOK);
  });

  test('a labelled target fills its container inline size, at 7-grid block size, with a full-width pill surface', async ({
    page,
  }) => {
    const targetBlock = await resolveLength(
      page,
      'height',
      'calc(var(--cn-grid) * 7)',
    );
    const surfaceBlock = await resolveLength(
      page,
      'height',
      'calc(var(--cn-grid) * 6)',
    );
    const medium = await resolveLength(page, 'width', 'var(--cn-icon-size)');
    const small = await resolveLength(
      page,
      'width',
      'var(--cn-icon-size-small)',
    );
    await mount(page, pair('labelled'));
    const containerWidth = await wrapper(page).evaluate(
      (node) => getComputedStyle(node).width,
    );

    for (const locator of [button(page), anchor(page)]) {
      const box = await targetBox(locator);
      expect(box.inline).toBe(containerWidth);
      expect(box.block).toBe(targetBlock);

      const surface = await surfaceStyle(locator);
      expect(surface.inline).toBe(containerWidth);
      expect(surface.block).toBe(surfaceBlock);

      const icon = await iconBox(locator);
      expect(icon.inline).toBe(medium);
      expect(icon.block).toBe(medium);
      expect(icon.inline).not.toBe(small);
    }
  });

  test('a labelled action too narrow for its label keeps the Icon at the full medium step, square, while the label truncates instead', async ({
    page,
  }) => {
    const medium = await resolveLength(page, 'width', 'var(--cn-icon-size)');
    const targetBlock = await resolveLength(
      page,
      'height',
      'calc(var(--cn-grid) * 7)',
    );
    // Narrow enough to force truncation rather than icon compression — the
    // real risk the guardrail exists for: a flex child (the Icon) giving
    // way under pressure instead of the label truncating as designed.
    const NARROW_INLINE_SIZE = '82px';
    const markup = `
      <div class="wrapper" style="--cn-chrome-presentation: labelled; inline-size: ${NARROW_INLINE_SIZE};">
        ${action('button')}
        ${action('anchor')}
      </div>
    `;
    await mount(page, markup);

    for (const locator of [button(page), anchor(page)]) {
      const icon = await iconBox(locator);
      expect(icon.inline).toBe(medium);
      expect(icon.block).toBe(medium);
      expect(icon.inline).toBe(icon.block); // still square, not compressed

      const box = await targetBox(locator);
      expect(box.block).toBe(targetBlock); // unchanged by the narrow width

      // Confirms the container really is narrow enough to force the crunch
      // this test exists for — the label, not the Icon, gives way.
      const labelTruncates = await locator
        .locator('span:not(.cn-icon)')
        .evaluate((node) => node.scrollWidth > node.clientWidth);
      expect(labelTruncates).toBe(true);
    }
  });

  for (const [name, presentation] of [
    ['an absent declaration', undefined],
    ['an unrecognised value', 'bogus'],
  ] as const) {
    test(`${name} on the container resolves to the compact 7-grid square and its 6-grid surface, on both elements`, async ({
      page,
    }) => {
      const target = await resolveLength(
        page,
        'width',
        'calc(var(--cn-grid) * 7)',
      );
      const diameter = await resolveLength(
        page,
        'width',
        'calc(var(--cn-grid) * 6)',
      );
      await mount(page, pair(presentation));

      for (const locator of [button(page), anchor(page)]) {
        const box = await targetBox(locator);
        expect(box.inline).toBe(target);
        expect(box.block).toBe(target);

        const surface = await surfaceStyle(locator);
        expect(surface.inline).toBe(diameter);
        expect(surface.block).toBe(diameter);
      }
    });
  }

  test('a declaration on the action itself, rather than on its container, still resolves compact — target and surface together', async ({
    page,
  }) => {
    // The style-container query on the target excludes the target's own
    // declaration and reads its ancestor only. A wrapper that declares
    // nothing, paired with the action declaring `labelled` on itself,
    // exercises exactly the case chrome-actions.css:62-85 restructured
    // the token flow to prevent: a hybrid with one geometry resolved from
    // one branch and the other from the other.
    const target = await resolveLength(
      page,
      'width',
      'calc(var(--cn-grid) * 7)',
    );
    const diameter = await resolveLength(
      page,
      'width',
      'calc(var(--cn-grid) * 6)',
    );
    const markup = `
      <div class="wrapper" style="inline-size: ${WRAPPER_INLINE_SIZE};">
        ${action('button', '--cn-chrome-presentation: labelled;')}
        ${action('anchor', '--cn-chrome-presentation: labelled;')}
      </div>
    `;
    await mount(page, markup);

    for (const locator of [button(page), anchor(page)]) {
      const box = await targetBox(locator);
      expect(box.inline).toBe(target);
      expect(box.block).toBe(target);

      const surface = await surfaceStyle(locator);
      expect(surface.inline).toBe(diameter);
      expect(surface.block).toBe(diameter);
    }
  });

  test('the accessible name is unchanged between compact and labelled, on both elements', async ({
    page,
  }) => {
    await mount(page, pair('compact') + pair('labelled'));
    const [compactWrapper, labelledWrapper] = await page
      .locator(`#${PROBE} .wrapper`)
      .all();

    await expect(
      compactWrapper.getByRole('button', { name: 'Send', exact: true }),
    ).toHaveCount(1);
    await expect(
      compactWrapper.getByRole('link', { name: 'Home', exact: true }),
    ).toHaveCount(1);
    await expect(
      labelledWrapper.getByRole('button', { name: 'Send', exact: true }),
    ).toHaveCount(1);
    await expect(
      labelledWrapper.getByRole('link', { name: 'Home', exact: true }),
    ).toHaveCount(1);
  });

  test('aria-current="false" and a button declaring aria-current carry no indicator', async ({
    page,
  }) => {
    const markup = `
      <div class="wrapper" style="--cn-chrome-presentation: labelled; inline-size: ${WRAPPER_INLINE_SIZE};">
        ${action('anchor', '').replace('data-role="anchor"', 'data-role="anchor" aria-current="false"')}
        ${action('button', '').replace('data-role="button"', 'data-role="button" aria-current="page"')}
      </div>
    `;
    await mount(page, markup);

    for (const locator of [anchor(page), button(page)]) {
      expect((await indicatorStyle(locator)).content).toBe('none');
    }
  });

  /**
   * The book's own compact "states" specimen — not a mounted stand-in —
   * because the disabled row there already puts a real disabled button
   * beside a real `aria-disabled` anchor. `themes` renders that specimen
   * once per colour scheme, one `[data-mode]` panel apiece; opacity, cursor
   * and hit-testing do not depend on colour scheme, so this test scopes to
   * the `light` panel.
   *
   * Deliberately not checked here: that the CSS sets a particular opacity,
   * cursor or `pointer-events` value, and that the `disabled`,
   * `aria-disabled` and `tabindex` attributes are present — all readable
   * from `chrome-actions.css` and the specimen markup without a browser.
   */
  test('a disabled anchor chrome action beside a disabled button chrome action present the same, are each announced as disabled, and neither navigates nor runs a command', async ({
    page,
  }) => {
    const panel = specimenFigure(
      page,
      'Compact chrome action, rest, hover, active, keyboard focus and disabled',
    ).locator('[data-mode="light"]');
    const disabledButton = panel.locator('button.chrome-action[disabled]');
    const disabledAnchor = panel.locator(
      'a.chrome-action[href][aria-disabled="true"][tabindex="-1"]',
    );

    await expect(
      panel.getByRole('button', { name: 'Send', disabled: true }),
    ).toHaveCount(1);
    await expect(
      panel.getByRole('link', { name: 'Back', disabled: true }),
    ).toHaveCount(1);

    const buttonOpacity = await disabledButton.evaluate(
      (node) => getComputedStyle(node).opacity,
    );
    const anchorOpacity = await disabledAnchor.evaluate(
      (node) => getComputedStyle(node).opacity,
    );
    const buttonCursor = await disabledButton.evaluate(
      (node) => getComputedStyle(node).cursor,
    );
    const anchorCursor = await disabledAnchor.evaluate(
      (node) => getComputedStyle(node).cursor,
    );
    expect(anchorOpacity).toBe(buttonOpacity);
    expect(anchorCursor).toBe(buttonCursor);

    for (const locator of [disabledButton, disabledAnchor]) {
      const rest = await surfaceStyle(locator);

      await locator.hover({ force: true });
      await waitPastTransition(page, locator);
      expect((await surfaceStyle(locator)).background).toBe(rest.background);

      await page.mouse.down();
      await waitPastTransition(page, locator);
      expect((await surfaceStyle(locator)).background).toBe(rest.background);
      await page.mouse.up();
    }
    const anchorRest = (await surfaceStyle(disabledAnchor)).background;
    const buttonRest = (await surfaceStyle(disabledButton)).background;
    expect(anchorRest).toBe(buttonRest);

    // A window flag — not the URL — catches the anchor case, because its own
    // `href` targets this same book page: a same-URL navigation would
    // otherwise look like no navigation happened at all.
    type Probe = { chromeActionClicked?: boolean; chromeActionNoNav?: boolean };

    await disabledButton.evaluate((node) => {
      const probe = window as unknown as Probe;
      probe.chromeActionClicked = false;
      node.addEventListener('click', () => {
        probe.chromeActionClicked = true;
      });
    });
    const buttonBox = await disabledButton.boundingBox();
    if (!buttonBox) throw new Error('expected the disabled button a box');
    await page.mouse.click(
      buttonBox.x + buttonBox.width / 2,
      buttonBox.y + buttonBox.height / 2,
    );
    const clicked = await page.evaluate(
      () => (window as unknown as Probe).chromeActionClicked,
    );
    expect(clicked).toBe(false);

    await page.evaluate(() => {
      (window as unknown as Probe).chromeActionNoNav = true;
    });
    const anchorBox = await disabledAnchor.boundingBox();
    if (!anchorBox) throw new Error('expected the disabled anchor a box');
    await page.mouse.click(
      anchorBox.x + anchorBox.width / 2,
      anchorBox.y + anchorBox.height / 2,
    );
    const stillOnThisPage = await page.evaluate(
      () => (window as unknown as Probe).chromeActionNoNav,
    );
    expect(stillOnThisPage).toBe(true);
  });
});

// Every test below resolves or compares a colour, so each runs once per
// colour scheme: a `--cn-*` colour token can resolve to a different value
// under light and under dark.
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`under the ${scheme} scheme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(BOOK);
    });

    test('a compact target is a 7-grid square with a 6-grid circular, transparent state surface, on both elements', async ({
      page,
    }) => {
      const target = await resolveLength(
        page,
        'width',
        'calc(var(--cn-grid) * 7)',
      );
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
      const transparent = await resolveColor(page, 'transparent');
      const medium = await resolveLength(page, 'width', 'var(--cn-icon-size)');
      const small = await resolveLength(
        page,
        'width',
        'var(--cn-icon-size-small)',
      );
      await mount(page, pair('compact'));

      for (const locator of [button(page), anchor(page)]) {
        const box = await targetBox(locator);
        expect(box.inline).toBe(target);
        expect(box.block).toBe(target);

        const surface = await surfaceStyle(locator);
        expect(surface.inline).toBe(diameter);
        expect(surface.block).toBe(diameter);
        expect(surface.radius).toBe(radius);
        expect(surface.background).toBe(transparent);

        const icon = await iconBox(locator);
        expect(icon.inline).toBe(medium);
        expect(icon.block).toBe(medium);
        expect(icon.inline).not.toBe(small);
      }
    });

    test('the class displaces the default link and button presentations, and the button and anchor foregrounds are identical', async ({
      page,
    }) => {
      await mount(page, pair('compact'));
      const wrap = wrapper(page);
      await wrap.evaluate((node) => {
        node.setAttribute(
          'style',
          `${node.getAttribute('style')} color: rgb(12, 34, 56);`,
        );
      });

      const read = (locator: ReturnType<typeof button>) =>
        locator.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            color: style.color,
            textDecorationLine: style.textDecorationLine,
            backgroundImage: style.backgroundImage,
            backgroundColor: style.backgroundColor,
            boxShadow: style.boxShadow,
          };
        });

      const transparent = await resolveColor(page, 'transparent');
      const buttonStyle = await read(button(page));
      const anchorStyle = await read(anchor(page));

      expect(buttonStyle.color).toBe('rgb(12, 34, 56)');
      expect(anchorStyle.color).toBe(buttonStyle.color);

      for (const style of [buttonStyle, anchorStyle]) {
        expect(style.textDecorationLine).toBe('none');
        expect(style.backgroundImage).toBe('none');
        expect(style.backgroundColor).toBe(transparent);
        expect(style.boxShadow).toBe('none');
      }
    });

    for (const presentation of ['compact', 'labelled'] as const) {
      for (const role of ['button', 'anchor'] as const) {
        test(`the ${presentation} ${role} state surface progresses transparent, --cn-hover, --cn-active, and the footprint never changes — through hover, active and keyboard focus`, async ({
          page,
        }) => {
          const transparent = await resolveColor(page, 'transparent');
          const hoverColor = await resolveColor(page, 'var(--cn-hover)');
          const activeColor = await resolveColor(page, 'var(--cn-active)');
          const focusColor = await resolveColor(page, 'var(--cn-focus-ring)');
          await mount(page, single(presentation, role));
          const target = mountedAction(page);

          const rest = await target.boundingBox();
          expect(rest).not.toBeNull();
          const restSurface = await surfaceStyle(target);
          expect(restSurface.background).toBe(transparent);

          await target.hover();
          await waitPastTransition(page, target);
          const hovered = await target.boundingBox();
          expect(hovered).toEqual(rest);
          const hoverSurface = await surfaceStyle(target);
          expect(hoverSurface.background).toBe(hoverColor);

          await page.mouse.down();
          await waitPastTransition(page, target);
          const active = await target.boundingBox();
          expect(active).toEqual(rest);
          const activeSurface = await surfaceStyle(target);
          expect(activeSurface.background).toBe(activeColor);
          await page.mouse.up();

          // Arrive by keyboard, not by pointer: Chromium suppresses
          // `:focus-visible` when the last interaction was a pointer, which
          // `hover()` and `mouse.down()` just were. The skip link is the
          // first focusable element on the page and the probe — mounted
          // alone in its wrapper via `single()` — is the first inside the
          // content, so Tab, Enter on the skip link, then Tab again lands
          // here by keyboard.
          await page.keyboard.press('Tab');
          await page.locator('a.skip-link').press('Enter');
          await page.keyboard.press('Tab');
          await expect(target).toBeFocused();
          const isFocusVisible = await target.evaluate((node) =>
            node.matches(':focus-visible'),
          );
          expect(isFocusVisible).toBe(true);

          const focused = await target.boundingBox();
          expect(focused).toEqual(rest);
          const outline = await target.evaluate((node) => {
            const style = getComputedStyle(node);
            return {
              style: style.outlineStyle,
              width: style.outlineWidth,
              color: style.outlineColor,
            };
          });
          expect(outline.style).toBe('solid');
          expect(outline.width).toBe('2px');
          expect(outline.color).toBe(focusColor);
        });
      }
    }

    for (const presentation of ['compact', 'labelled'] as const) {
      test(`a ${presentation} current destination carries the indicator and its foreground, and matches a non-current action's geometry`, async ({
        page,
      }) => {
        const indicator = await resolveColor(page, 'var(--cn-indicator)');
        const onIndicator = await resolveColor(page, 'var(--cn-on-indicator)');
        const markup = `
          <div class="wrapper" style="--cn-chrome-presentation: ${presentation}; inline-size: ${WRAPPER_INLINE_SIZE};">
            ${action('anchor', '').replace('data-role="anchor"', 'data-role="anchor" aria-current="page"')}
            ${action('button')}
          </div>
        `;
        await mount(page, markup);
        const current = anchor(page);

        const layer = await indicatorStyle(current);
        expect(layer.content).not.toBe('none');
        expect(layer.background).toBe(indicator);

        const foreground = await current.evaluate(
          (node) => getComputedStyle(node).color,
        );
        expect(foreground).toBe(onIndicator);

        // The indicator changes no measurement: the layer matches the
        // transient surface it sits under, and the target matches the
        // non-current action beside it.
        const surface = await surfaceStyle(current);
        expect(layer.inline).toBe(surface.inline);
        expect(layer.block).toBe(surface.block);
        expect(await targetBox(current)).toEqual(await targetBox(button(page)));
      });
    }

    test('the transient washes compose over the indicator rather than replacing it', async ({
      page,
    }) => {
      const transparent = await resolveColor(page, 'transparent');
      const hoverColor = await resolveColor(page, 'var(--cn-hover)');
      const activeColor = await resolveColor(page, 'var(--cn-active)');
      const indicator = await resolveColor(page, 'var(--cn-indicator)');
      const markup = `
        <div class="wrapper" style="--cn-chrome-presentation: compact; inline-size: ${WRAPPER_INLINE_SIZE};">
          ${action('anchor', '').replace('data-role="anchor"', 'data-role="anchor" aria-current="page"')}
        </div>
      `;
      await mount(page, markup);
      const target = anchor(page);

      // Three distinct paints on the wash layer, while the indicator layer
      // beneath it never moves off --cn-indicator.
      const seen: string[] = [];
      for (const step of ['rest', 'hover', 'active'] as const) {
        if (step === 'hover') await target.hover();
        if (step === 'active') await page.mouse.down();
        await waitPastTransition(page, target);
        seen.push((await surfaceStyle(target)).background);
        expect((await indicatorStyle(target)).background).toBe(indicator);
      }
      await page.mouse.up();

      expect(seen).toEqual([transparent, hoverColor, activeColor]);
    });
  });
}
