import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnReactionButton`: whether the server
 * response alone carries the whole control, whether one native click reaches
 * the consumer from every part of it and from the keyboard, whether the
 * control keeps the supplied state until the consumer changes it, and what
 * the cascade resolves for each presentation and interaction state.
 *
 * Locators read the book page. The static specimen grid mounts once per
 * colour scheme and the semantics and geometry under test resolve once, so
 * the first panel answers; the page hydrates the demo as its one consumer.
 */

const BOOK = '/components/cn-reaction-button';

const statesPanel = (page: Page) =>
  page.locator('.reaction-button-specimens').first();
const row = (page: Page, size: 'default' | 'small') =>
  statesPanel(page).locator(`.row[data-size="${size}"]`);
/** Row order is the specimen's: unpressed, pressed, disabled, zero. */
const specimen = (
  page: Page,
  size: 'default' | 'small',
  state: 'unpressed' | 'pressed' | 'disabled' | 'zero',
) =>
  row(page, size)
    .locator('.cn-reaction-button')
    .nth(['unpressed', 'pressed', 'disabled', 'zero'].indexOf(state));

const demo = (page: Page) => page.locator('.reaction-button-demo');
const demoButton = (page: Page) => demo(page).locator('.cn-reaction-button');
const clicks = (page: Page) => demo(page).locator('p.text-label');

/** The demo is an Astro island: a click before it hydrates records nothing. */
async function open(page: Page) {
  await page.goto(BOOK);
  await page.waitForLoadState('networkidle');
}

/** Counts native clicks arriving at the document from anywhere on the page. */
async function countClicks(page: Page) {
  await page.evaluate(() => {
    const counter = { count: 0 };
    (window as unknown as { clicks: typeof counter }).clicks = counter;
    document.addEventListener('click', () => {
      counter.count += 1;
    });
  });
  return () =>
    page.evaluate(
      () => (window as unknown as { clicks: { count: number } }).clicks.count,
    );
}

/**
 * Focus delivered through the keyboard, so the button matches
 * `:focus-visible` the way a keyboard reader reaches it.
 */
async function focusByKeyboard(page: Page, control: Locator) {
  await control.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(control).toBeFocused();
}

const surfaceOverlay = (control: Locator) =>
  control
    .locator('.state-surface')
    .evaluate((el) => getComputedStyle(el, '::after').backgroundColor);

const positions = async (control: Locator) => {
  const surface = await control.locator('.state-surface').boundingBox();
  const count = await control.locator('.count').boundingBox();
  return { surface, count };
};

test.describe('the server response', () => {
  test.use({ javaScriptEnabled: false });

  test('carries the whole control: name, state, count and description', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const control = specimen(page, 'default', 'unpressed');

    await expect(control).toHaveRole('button');
    await expect(control).toHaveAttribute('type', 'button');
    await expect(control).toHaveAccessibleName('Tykkää');
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    await expect(control).toHaveAccessibleDescription('3 tykkäystä');
    await expect(control.locator('.count')).toHaveText('3');
  });
});

test.describe('activation', () => {
  test('the state surface and the count each deliver one native click', async ({
    page,
  }) => {
    await open(page);
    await demoButton(page).locator('.state-surface').click();
    await expect(clicks(page)).toHaveText('Klikkauksia: 1');

    await demoButton(page).locator('.count').click();
    await expect(clicks(page)).toHaveText('Klikkauksia: 2');
  });

  test('Space and Enter each deliver one native click', async ({ page }) => {
    await open(page);
    await demoButton(page).focus();

    await page.keyboard.press('Space');
    await expect(clicks(page)).toHaveText('Klikkauksia: 1');

    await page.keyboard.press('Enter');
    await expect(clicks(page)).toHaveText('Klikkauksia: 2');
  });

  test('a click changes nothing the consumer did not supply', async ({
    page,
  }) => {
    await open(page);
    const control = specimen(page, 'default', 'unpressed');
    const arrived = await countClicks(page);

    await control.click();

    expect(await arrived()).toBe(1);
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    await expect(control.locator('.count')).toHaveText('3');
  });

  test('the values a consumer supplies back are what rerenders', async ({
    page,
  }) => {
    await open(page);
    const control = demoButton(page);
    await expect(control.locator('.count')).toHaveText('3');

    await control.click();

    await expect(control.locator('.count')).toHaveText('4');
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(control).toHaveAccessibleDescription('4 tykkäystä');
  });

  test('the button is the only focus stop', async ({ page }) => {
    await open(page);
    const control = demoButton(page);

    const focusableDescendants = await control.evaluate(
      (button) =>
        [...button.querySelectorAll('*')].filter(
          (el) => (el as HTMLElement).tabIndex >= 0,
        ).length,
    );

    expect(focusableDescendants).toBe(0);
  });
});

test.describe('the disabled control', () => {
  test('it is announced as disabled and no click reaches the consumer', async ({
    page,
  }) => {
    await open(page);
    const control = specimen(page, 'default', 'disabled');
    await expect(control).toBeDisabled();
    const arrived = await countClicks(page);

    await control.click({ force: true });
    await control.focus();
    await page.keyboard.press('Space');

    expect(await arrived()).toBe(0);
    await expect(control).not.toBeFocused();
  });

  test('the pressed surface stays beneath the veil, and hover adds nothing', async ({
    page,
  }) => {
    await open(page);
    const control = specimen(page, 'default', 'disabled');
    await control.scrollIntoViewIfNeeded();

    await expect(control).toHaveCSS('opacity', '0.5');
    const surface = control.locator('.state-surface');
    const restingShadow = await surface.evaluate(
      (el) => getComputedStyle(el).boxShadow,
    );
    expect(
      await surface.evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toContain('linear-gradient');

    await control.hover();

    expect(await surfaceOverlay(control)).toBe('rgba(0, 0, 0, 0)');
    expect(await surface.evaluate((el) => getComputedStyle(el).boxShadow)).toBe(
      restingShadow,
    );
  });
});

test.describe('the presentation', () => {
  test('each size uses its own button, surface and count measurements', async ({
    page,
  }) => {
    await open(page);

    for (const [size, button, surface, fontSize] of [
      ['default', 48, 44, '17px'],
      ['small', 36, 32, '12px'],
    ] as const) {
      const control = specimen(page, size, 'unpressed');
      expect((await control.boundingBox())?.height).toBeCloseTo(button, 0);
      const circle = await control.locator('.state-surface').boundingBox();
      expect(circle?.height).toBeCloseTo(surface, 0);
      expect(circle?.width).toBeCloseTo(surface, 0);
      await expect(control.locator('.count')).toHaveCSS('font-size', fontSize);
    }
  });

  test('hover, activation and focus move nothing, and focus stays visible', async ({
    page,
  }) => {
    await open(page);
    const control = specimen(page, 'default', 'unpressed');
    await control.scrollIntoViewIfNeeded();
    const resting = await positions(control);

    await control.hover();
    expect(await positions(control)).toEqual(resting);

    await page.mouse.down();
    expect(await positions(control)).toEqual(resting);
    await page.mouse.up();

    await focusByKeyboard(page, control);
    expect(await positions(control)).toEqual(resting);
    expect(
      await control.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
  });

  test('the pressed gradient stays beneath the hover and active feedback', async ({
    page,
  }) => {
    await open(page);
    const control = specimen(page, 'default', 'pressed');
    await control.scrollIntoViewIfNeeded();
    const surface = control.locator('.state-surface');

    // The overlay's colour transitions at the UI duration, so each state is
    // polled past the ramp rather than read at its first frame.
    await control.hover();
    await expect
      .poll(() => surfaceOverlay(control))
      .not.toBe('rgba(0, 0, 0, 0)');
    const hoverOverlay = await surfaceOverlay(control);

    await page.mouse.down();
    await expect
      .poll(() => surfaceOverlay(control))
      .not.toBe('rgba(0, 0, 0, 0)');
    await expect.poll(() => surfaceOverlay(control)).not.toBe(hoverOverlay);
    expect(
      await surface.evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toContain('linear-gradient');
    await page.mouse.up();
  });

  test('the global button presentation does not reach it', async ({ page }) => {
    await open(page);
    const control = specimen(page, 'default', 'unpressed');

    // The page carries styles/buttons.css; a button it presented would stand
    // 38px tall on the pill gradient. This one is its own presentation.
    expect((await control.boundingBox())?.height).toBeCloseTo(48, 0);
    expect(
      await control.evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toBe('none');
  });

  test('reduced motion leaves the transitions without duration', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const surface = specimen(page, 'default', 'unpressed').locator(
      '.state-surface',
    );

    expect(
      await surface.evaluate((el) => getComputedStyle(el).transitionDuration),
    ).toBe('0s');
    expect(
      await surface.evaluate(
        (el) => getComputedStyle(el, '::after').transitionDuration,
      ),
    ).toBe('0s');
  });
});

/*
 * The specimen grid and the demo both lay their row out with a flex rule of
 * their own, so a button read there is a flex item — CSS blockifies a flex
 * item's own inline-level display for computed style, which would report
 * "flex" for a correctly inline-flex control and hide a regression the other
 * way just as well. The inline row composition states no flex rule, the way
 * `ThreadInfoSection.astro` does not, so this is where the root's own
 * display is the one under test.
 */
test.describe('the inline row composition', () => {
  const inlineRow = (page: Page) =>
    page.locator('.text-center').filter({
      has: page.locator('.cn-reaction-button'),
    });

  test('the root is inline-level', async ({ page }) => {
    await open(page);
    const control = inlineRow(page).locator('.cn-reaction-button');

    expect(await control.evaluate((el) => getComputedStyle(el).display)).toBe(
      'inline-flex',
    );
  });

  test('it shares one line with the control beside it, centred by the row', async ({
    page,
  }) => {
    await open(page);
    const row = inlineRow(page);
    const link = row.locator('a.button');
    const control = row.locator('.cn-reaction-button');

    const rowBox = await row.boundingBox();
    const linkBox = await link.boundingBox();
    const controlBox = await control.boundingBox();
    if (!rowBox || !linkBox || !controlBox) {
      throw new Error('expected the row and both controls to be laid out');
    }
    // One line, not stacked: a block box beside another would show no
    // vertical overlap at all, the way the pre-fix root did.
    const overlap =
      Math.min(linkBox.y + linkBox.height, controlBox.y + controlBox.height) -
      Math.max(linkBox.y, controlBox.y);
    expect(overlap).toBeGreaterThan(0);
    // Centred: the pair's span is inset from both edges of the row by the
    // same amount, not flush to the start the way an unstyled row would be.
    const pairStart = Math.min(linkBox.x, controlBox.x);
    const pairEnd = Math.max(
      linkBox.x + linkBox.width,
      controlBox.x + controlBox.width,
    );
    const startInset = pairStart - rowBox.x;
    const endInset = rowBox.x + rowBox.width - pairEnd;
    expect(Math.abs(startInset - endInset)).toBeLessThan(2);
  });
});

/*
 * The burst is decoration, so the spec gives it a Constraints sentence and no
 * scenario; these checks keep the harmless clauses standing — it plays on the
 * supplied landing, in a colour per state, never on the bare click, and never
 * under reduced motion. The colours themselves are the book review's.
 */
test.describe('the burst', () => {
  test('a supplied flip replays it, coloured by the state it lands', async ({
    page,
  }) => {
    await open(page);
    const control = demoButton(page);
    const burst = control.locator('.burst');

    await control.click();
    await expect(burst).toHaveClass(/love/);
    const loveColour = await burst.evaluate((el) => getComputedStyle(el).color);

    await control.click();
    await expect(burst).not.toHaveClass(/love/);
    await expect(burst).toHaveCount(1);
    expect(await burst.evaluate((el) => getComputedStyle(el).color)).not.toBe(
      loveColour,
    );
  });

  test('a click the consumer answers with nothing plays nothing', async ({
    page,
  }) => {
    await open(page);
    const control = specimen(page, 'default', 'unpressed');

    await control.click();

    await expect(control.locator('.burst')).toHaveCount(0);
  });

  test('reduced motion leaves the replica without motion or visibility', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const control = demoButton(page);

    await control.click();

    const burst = control.locator('.burst');
    await expect(burst).toHaveCount(1);
    expect(
      await burst.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    await expect(burst).toHaveCSS('opacity', '0');
  });
});
