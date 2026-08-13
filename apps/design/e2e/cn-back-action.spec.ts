import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnBackAction`: the accessible-name
 * algorithm over the control's real, rendered markup (does the decorative
 * `arrow-left` Icon leak a noun into the name), whether `cn-back` actually
 * bubbles past the control to a listener attached above it, whether keyboard
 * activation dispatches the same event a pointer activation does, and
 * whether an activation is truly inert against the document and the session
 * history. None of that can be parsed out of the component source.
 *
 * Every locator below reads the book page's own rendered specimens rather
 * than a hand-written fixture — see
 * docs/lessons/a-hand-written-fixture-hid-a-live-accessibility-defect.md for
 * the defect that pattern once hid.
 *
 * The book renders the control twice: once inside a themed `<Composition
 * themes>` panel (two identical instances, Light and Dark, both labelled
 * "Takaisin" — ambiguous under Playwright's strict mode), and once inside
 * `BackActionSpecimen`, a single instance beside a listener the specimen
 * itself mounts on an ancestor (`.back-action-specimen`), with a visible
 * counter proving each `cn-back` arriving. `BackActionSpecimen` is the only
 * unambiguous, single instance on the page, so every test below reads it.
 */

const BOOK = '/base/chrome-actions';

/** The single `BackActionSpecimen` instance: the book's own bubbling demo. */
const specimenRoot = (page: Page) =>
  page.locator('#content .back-action-specimen');
const control = (page: Page) => specimenRoot(page).locator('.cn-back-action');
const counter = (page: Page) => specimenRoot(page).locator('p.text-label');

/** Read the specimen's own live counter, exactly as it renders. */
const countHeard = async (page: Page) => {
  const text = await counter(page).innerText();
  const match = text.match(/(\d+)/);
  if (!match) throw new Error(`Counter text had no number: "${text}"`);
  return Number(match[1]);
};

/**
 * The control is an Astro island: a click before it hydrates changes
 * nothing, so every interaction below waits for the network to settle
 * first, the same guard `cn-theme-switch.spec.ts` applies to its own
 * specimen.
 */
async function ready(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * A second, independent listener on `window` — above even the specimen's
 * own ancestor listener — so bubbling is proven against a listener this
 * test attaches itself, not only against the specimen's built-in counter.
 */
async function armWindowListener(page: Page) {
  await page.evaluate(() => {
    window.addEventListener('cn-back', () => {
      document.body.dataset.cnBackOnWindow = String(
        Number(document.body.dataset.cnBackOnWindow ?? '0') + 1,
      );
    });
  });
}

const heardOnWindow = async (page: Page) =>
  Number(
    (await page.locator('body').getAttribute('data-cn-back-on-window')) ?? '0',
  );

test.describe('activation dispatches cn-back', () => {
  test('pointer activation increments the specimen counter, and reaches a listener on window', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await ready(page);
    await armWindowListener(page);
    const before = await countHeard(page);

    await control(page).click();

    await expect(counter(page)).toHaveText(`cn-back received: ${before + 1}`);
    expect(await heardOnWindow(page)).toBe(1);
  });

  test('keyboard activation with Enter dispatches cn-back', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await ready(page);
    const before = await countHeard(page);

    await control(page).focus();
    await control(page).press('Enter');

    await expect(counter(page)).toHaveText(`cn-back received: ${before + 1}`);
  });

  test('keyboard activation with Space dispatches cn-back', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await ready(page);
    const before = await countHeard(page);

    await control(page).focus();
    await control(page).press(' ');

    await expect(counter(page)).toHaveText(`cn-back received: ${before + 1}`);
  });

  test('one activation dispatches exactly one event, not more', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await ready(page);
    await armWindowListener(page);
    const before = await countHeard(page);

    await control(page).click();

    await expect(counter(page)).toHaveText(`cn-back received: ${before + 1}`);
    expect(await heardOnWindow(page)).toBe(1);
  });
});

test.describe('accessible name', () => {
  test('is the label alone, exact, and the decorative Icon contributes nothing', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const target = control(page);

    // Read the specimen's own rendered label text rather than hand-copying
    // an expected string — this label ("Takaisin") is BackActionSpecimen's
    // own choice, and the assertion must move with it, not with a guess.
    const label = await target.locator('> span:not(.cn-icon)').innerText();
    expect(label.length).toBeGreaterThan(0);

    // A string matcher is already exact here; the option this once carried
    // does not exist on this assertion.
    await expect(target).toHaveAccessibleName(label);

    // Confirmed against the accessibility tree the control's real, rendered
    // markup produces, rather than a hand-picked assumption about what
    // "decorative" emits (Icon.svelte's decorative <svg> carries
    // aria-hidden="true" and no role or label of its own).
    const handle = await target.elementHandle();
    const snapshot = await page.accessibility.snapshot({
      root: handle ?? undefined,
    });
    expect(snapshot?.role).toBe('button');
    expect(snapshot?.name).toBe(label);

    const flatten = (
      node: { role: string; name: string; children?: unknown[] } | null,
    ): { role: string; name: string }[] =>
      node
        ? [node, ...((node.children ?? []) as (typeof node)[]).flatMap(flatten)]
        : [];
    for (const node of flatten(snapshot)) {
      expect(node.role).not.toBe('img');
      expect(node.name.toLowerCase()).not.toContain('arrow');
      expect(node.name.toLowerCase()).not.toContain('back');
    }
  });
});

test.describe('navigates nothing', () => {
  test('activation changes neither the document nor the session history', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await ready(page);
    const target = control(page);

    const before = await page.evaluate(() => ({
      href: location.href,
      length: history.length,
    }));

    await target.click();
    await target.focus();
    await target.press('Enter');

    const after = await page.evaluate(() => ({
      href: location.href,
      length: history.length,
    }));

    expect(after.href).toBe(before.href);
    expect(after.length).toBe(before.length);
  });
});

test.describe('element', () => {
  test('is a native button, not an anchor, and carries no href', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const target = control(page);

    const shape = await target.evaluate((node) => ({
      tagName: node.tagName,
      href: node.getAttribute('href'),
    }));

    expect(shape.tagName).toBe('BUTTON');
    expect(shape.href).toBeNull();
  });
});
