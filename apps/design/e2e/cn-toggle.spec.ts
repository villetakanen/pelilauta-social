import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnToggle`: whether the native checkbox really
 * delivers the pointer, the Space key and the disabled behaviour the component
 * declines to implement, whether the flip reaches the consumer, and whether the
 * thumb moves rather than only changing colour. None of that is readable from
 * the source.
 *
 * Locators read the book page's `ToggleSpecimen`. The page mounts it twice —
 * once per colour scheme — and the first is the Light one; the semantics and the
 * geometry under test resolve once, so one panel answers for both. Where a claim
 * is about colour, both panels are read.
 */

const BOOK = '/components/cn-toggle';

const specimen = (page: Page) => page.locator('.toggle-specimen').first();
const toggle = (root: Locator, name: string) =>
  root.getByRole('switch', { name });
const received = (root: Locator) => root.locator('p.text-label');

/** The specimen is an Astro island: a click before it hydrates records nothing. */
async function open(page: Page) {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
  return specimen(page);
}

/** The thumb's inline start, relative to the track's. */
async function thumbOffset(control: Locator) {
  return control.evaluate((input) => {
    const thumb = getComputedStyle(input, '::before').insetInlineStart;
    return Number.parseFloat(thumb);
  });
}

test.describe('flipping', () => {
  test('the pointer flips an unchecked toggle and the change reaches the consumer', async ({
    page,
  }) => {
    const root = await open(page);
    const control = toggle(root, 'Käytä jakomateriaaleja');
    await expect(control).not.toBeChecked();
    await expect(received(root)).toHaveText('Viimeisin muutos: —');

    await control.click();

    await expect(control).toBeChecked();
    await expect(received(root)).toHaveText(
      'Viimeisin muutos: Käytä jakomateriaaleja: on',
    );
  });

  test('Space flips a focused toggle and the change reaches the consumer', async ({
    page,
  }) => {
    const root = await open(page);
    const control = toggle(root, 'Käytä kelloja');
    await control.focus();
    await expect(control).toBeChecked();

    await page.keyboard.press('Space');

    await expect(control).not.toBeChecked();
    await expect(received(root)).toHaveText(
      'Viimeisin muutos: Käytä kelloja: off',
    );
  });

  test('the label is part of the control, so a press on the text flips it', async ({
    page,
  }) => {
    const root = await open(page);
    const control = toggle(root, 'Käytä jakomateriaaleja');

    await root.getByText('Käytä jakomateriaaleja').click();

    await expect(control).toBeChecked();
  });
});

test.describe('the disabled row', () => {
  test('activating it changes nothing and emits no change event', async ({
    page,
  }) => {
    const root = await open(page);
    const control = toggle(root, 'Jäädytä sivusto');
    await expect(control).toBeDisabled();
    await expect(control).toBeChecked();

    // Counted on the document: a change from any toggle on the page would
    // bubble to it, so nothing having arrived is the whole claim.
    await page.evaluate(() => {
      const counter = { count: 0 };
      (window as unknown as { changes: typeof counter }).changes = counter;
      document.addEventListener('change', () => {
        counter.count += 1;
      });
    });

    await control.click({ force: true });

    await expect(control).toBeChecked();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { changes: { count: number } }).changes.count,
      ),
    ).toBe(0);
    await expect(received(root)).toHaveText('Viimeisin muutos: —');
  });

  test('it is out of the keyboard walk', async ({ page }) => {
    const root = await open(page);
    await toggle(root, 'Käytä jakomateriaaleja').focus();

    await page.keyboard.press('Tab');

    await expect(toggle(root, 'Jäädytä sivusto')).not.toBeFocused();
  });
});

test.describe('the presentation', () => {
  test('the thumb moves, so the two states differ by more than colour', async ({
    page,
  }) => {
    const root = await open(page);
    const control = toggle(root, 'Käytä jakomateriaaleja');
    const resting = await thumbOffset(control);

    await control.click();
    // Past the transition, which reports intermediate offsets while it runs.
    await expect(control).toBeChecked();
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every((animation) => animation.playState !== 'running'),
    );

    expect(await thumbOffset(control)).toBeGreaterThan(resting);
  });

  test('the row spans the pane, so the switches align on one edge', async ({
    page,
  }) => {
    const root = await open(page);
    const edges = await root
      .locator('.cn-toggle input')
      .evaluateAll((inputs) =>
        inputs.map((input) => input.getBoundingClientRect().right),
      );

    expect(edges.length).toBe(3);
    for (const edge of edges) expect(edge).toBeCloseTo(edges[0], 0);
  });

  /**
   * The resting track, not the checked one: `--cn-color-button-light` is a primary
   * step that resolves the same either way, and only the roles built on
   * `--cn-color-button` swing with the scheme.
   */
  test('the resting track resolves differently in Light and Dark', async ({
    page,
  }) => {
    await open(page);
    const panels = page.locator('#content figure .themed');
    expect(await panels.count()).toBe(2);

    const tracks = await page
      .locator('#content figure .themed .cn-toggle input:not(:checked)')
      .evaluateAll((inputs) =>
        inputs.map((input) => getComputedStyle(input).backgroundColor),
      );

    expect(tracks.length).toBe(2);
    expect(tracks[0]).not.toBe(tracks[1]);
  });
});
