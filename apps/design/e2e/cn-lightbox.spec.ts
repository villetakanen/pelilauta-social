import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnLightbox`: whether the full-screen view
 * is truly a modal dialog and not merely an open one, whether Escape, the
 * back action and a backdrop click each return focus the way the platform
 * dialog promises, whether the strip's overflow really scrolls on the
 * pointer's own wheel with no script converting the axis, and how the
 * `aspect-ratio` and one-line-caption CSS resolve as rendered geometry. None
 * of that is readable from the source; `cn-lightbox.test.ts` already covers
 * the server-rendered markup and is not repeated here.
 *
 * Locators read the book page's `LightboxSpecimens`. `Composition themes`
 * mounts each group twice, once per colour scheme, and the guarantees under
 * test resolve identically in both, so every test reads the first (Light)
 * instance, the way `cn-menu.spec.ts` does.
 */

const BOOK = '/components/cn-lightbox';
const OPEN_LABEL = 'Avaa kuva';
const CLOSE_LABEL = 'Sulje';

const specimen = (page: Page, group: 'single' | 'strip' | 'uncaptioned') =>
  page.locator(`.lightbox-specimen[data-group="${group}"]`).first();
const frames = (root: Locator) => root.locator('.frame');
const dialog = (root: Locator) => root.locator('dialog.cn-lightbox-dialog');
const wholeImage = (root: Locator) => dialog(root).locator('img.whole');
const backAction = (root: Locator) =>
  dialog(root).getByRole('button', { name: CLOSE_LABEL });

/** A locator's rendered box, read once so no measurement needs its own cast. */
type Box = { x: number; y: number; width: number; height: number };
const box = async (locator: Locator) => (await locator.boundingBox()) as Box;

/** The specimen is an Astro island: a click before it hydrates does nothing. */
async function ready(page: Page) {
  await page.waitForLoadState('networkidle');
}

async function openWithPointer(page: Page, root: Locator, index = 0) {
  await ready(page);
  const control = frames(root).nth(index);
  await control.click();
  await expect(dialog(root)).toBeVisible();
  return control;
}

test.describe('opening', () => {
  test('pointer activation opens the modal dialog on the image activated, whole, with its caption as alt text', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'strip');
    await openWithPointer(page, root, 1); // the strip's second thumbnail

    // A real modal, not merely an open dialog: `:modal` matches a <dialog>
    // only while it was opened through `showModal()`. A dialog opened with
    // `.show()`, or any element carrying `role="dialog"`, never matches it —
    // which is exactly the distinction the guardrail asks for.
    const state = await dialog(root).evaluate((element: HTMLDialogElement) => ({
      open: element.open,
      modal: element.matches(':modal'),
    }));
    expect(state).toEqual({ open: true, modal: true });

    await expect(wholeImage(root)).toHaveAttribute('alt', 'Sundered Skerry');
    const [expectedSrc, actualSrc] = await Promise.all([
      frames(root).nth(1).locator('img').getAttribute('src'),
      wholeImage(root).getAttribute('src'),
    ]);
    expect(actualSrc).toBe(expectedSrc);
  });

  test('Enter on a focused image control opens the dialog on that image', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    await ready(page);
    const control = frames(root).first();
    await control.focus();

    await control.press('Enter');

    await expect(dialog(root)).toBeVisible();
    await expect(wholeImage(root)).toHaveAttribute(
      'alt',
      'Saaristo aamuvalossa',
    );
  });
});

test.describe('the opened full-screen view', () => {
  test("shows the image whole: a real, non-zero box in the image's own aspect ratio", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    await openWithPointer(page, root);

    const geometry = await wholeImage(root).evaluate(
      (element: HTMLImageElement) => {
        const box = element.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          naturalWidth: element.naturalWidth,
          naturalHeight: element.naturalHeight,
        };
      },
    );

    expect(geometry.width).toBeGreaterThan(0);
    expect(geometry.height).toBeGreaterThan(0);
    expect(geometry.naturalWidth).toBeGreaterThan(0);
    expect(geometry.naturalHeight).toBeGreaterThan(0);
    // `contain` keeps the intrinsic ratio; `cover` would not, and a
    // containment collapse would not either — both are what this catches.
    expect(geometry.width / geometry.height).toBeCloseTo(
      geometry.naturalWidth / geometry.naturalHeight,
      1,
    );
  });

  test('is centred in the viewport', async ({ page }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    await openWithPointer(page, root);

    const dialogBox = await box(dialog(root));
    const viewport = page.viewportSize() as { width: number; height: number };

    const centreX = dialogBox.x + dialogBox.width / 2;
    const centreY = dialogBox.y + dialogBox.height / 2;
    expect(centreX).toBeCloseTo(viewport.width / 2, 0);
    expect(centreY).toBeCloseTo(viewport.height / 2, 0);
  });

  test("the exit control sits in the dialog's inline-start half, the corner its arrow-left glyph points to", async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    await openWithPointer(page, root);

    const dialogBox = await box(dialog(root));
    const controlBox = await box(backAction(root));
    const controlCentreX = controlBox.x + controlBox.width / 2;

    expect(controlCentreX).toBeLessThan(dialogBox.x + dialogBox.width / 2);
  });

  test('is larger than its own padding: the containment collapse stays gone', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    await openWithPointer(page, root);

    const geometry = await dialog(root).evaluate(
      (element: HTMLDialogElement) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          paddingInline:
            Number.parseFloat(style.paddingInlineStart) +
            Number.parseFloat(style.paddingInlineEnd),
          paddingBlock:
            Number.parseFloat(style.paddingBlockStart) +
            Number.parseFloat(style.paddingBlockEnd),
        };
      },
    );

    expect(geometry.width).toBeGreaterThan(geometry.paddingInline);
    expect(geometry.height).toBeGreaterThan(geometry.paddingBlock);
  });
});

test.describe('closing returns focus to the opener', () => {
  test('Escape closes the dialog', async ({ page }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    const control = await openWithPointer(page, root);

    await page.keyboard.press('Escape');

    await expect(dialog(root)).toBeHidden();
    await expect(control).toBeFocused();
  });

  test('activating the back action closes the dialog', async ({ page }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    const control = await openWithPointer(page, root);

    await backAction(root).click();

    await expect(dialog(root)).toBeHidden();
    await expect(control).toBeFocused();
  });

  test("clicking the dialog's backdrop closes it", async ({ page }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'single');
    const control = await openWithPointer(page, root);

    // A click on the viewport's corner lands outside the dialog's own box,
    // sized to its image, which is what puts it on the ::backdrop — whose
    // click target is the dialog element itself.
    await page.mouse.click(5, 5);

    await expect(dialog(root)).toBeHidden();
    await expect(control).toBeFocused();
  });
});

test.describe('the strip scrolls on the inline axis, and only the page moves otherwise', () => {
  test('a horizontal scroll brings an off-screen thumbnail into view', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'strip');
    await ready(page);
    const strip = root.locator('.cn-lightbox.strip');
    const lastItem = root.locator('.item').last();
    await strip.scrollIntoViewIfNeeded();

    const stripBox = await box(strip);
    const before = await box(lastItem);
    // Five square thumbnails in a 16:9 strip always overflow it, regardless
    // of the panel's own width, so the last one starts off-screen.
    expect(before.x).toBeGreaterThan(stripBox.x + stripBox.width - 1);

    await page.mouse.move(
      stripBox.x + stripBox.width / 2,
      stripBox.y + stripBox.height / 2,
    );
    await page.mouse.wheel(5000, 0);

    await expect
      .poll(() => strip.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    const after = await box(lastItem);
    expect(after.x + after.width).toBeLessThanOrEqual(
      stripBox.x + stripBox.width + 2,
    );
  });

  test('a vertical scroll over the strip moves the page, and leaves the strip untouched', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'strip');
    await ready(page);
    const strip = root.locator('.cn-lightbox.strip');
    await strip.scrollIntoViewIfNeeded();

    const scrollYBefore = await page.evaluate(() => window.scrollY);
    // scrollIntoViewIfNeeded already moved the page to reach the strip, so
    // there is room to scroll it back up.
    expect(scrollYBefore).toBeGreaterThan(0);
    const scrollLeftBefore = await strip.evaluate(
      (element) => element.scrollLeft,
    );
    const stripBox = await box(strip);
    await page.mouse.move(
      stripBox.x + stripBox.width / 2,
      stripBox.y + stripBox.height / 2,
    );

    await page.mouse.wheel(0, -200);

    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(scrollYBefore);
    expect(await strip.evaluate((element) => element.scrollLeft)).toBe(
      scrollLeftBefore,
    );
  });
});

test.describe('geometry', () => {
  test('a single presentation is 16:9, and a strip thumbnail is square inside a 16:9 strip', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const singleRoot = specimen(page, 'single');
    const singleImage = singleRoot.locator('.item img').first();
    const singleBox = await box(singleImage);
    expect(singleBox.width / singleBox.height).toBeCloseTo(16 / 9, 1);

    const stripRoot = specimen(page, 'strip');
    const strip = stripRoot.locator('.cn-lightbox.strip');
    const stripBox = await box(strip);
    expect(stripBox.width / stripBox.height).toBeCloseTo(16 / 9, 1);

    const thumbnail = stripRoot.locator('.item').first();
    const thumbnailBox = await box(thumbnail);
    expect(thumbnailBox.width / thumbnailBox.height).toBeCloseTo(1, 1);
  });
});

test.describe('a caption truncates to one line', () => {
  for (const group of ['single', 'strip'] as const) {
    test(`in the ${group} presentation, even when it overflows its box`, async ({
      page,
    }) => {
      await page.goto(BOOK);
      const root = specimen(page, group);
      const caption = root.locator('.caption').first();
      const before = await box(caption);

      // Runtime-only: proves the truncation on content long enough to
      // overflow, rather than trusting the stylesheet's `nowrap` to behave.
      // Pinning the caption's own box to its rendered width first keeps the
      // injected text from growing it — nothing upstream constrains the
      // panel's width, so an unbroken run of text would otherwise widen the
      // whole grid track instead of clipping inside its box.
      await caption.evaluate((element, width) => {
        element.style.inlineSize = `${width}px`;
        element.textContent =
          'A caption far too long to fit inside this box '.repeat(5);
      }, before.width);

      const after = await caption.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          height: element.getBoundingClientRect().height,
          // The strip's caption adds block padding of its own (the single
          // caption has none); one line is that padding plus one line-height.
          oneLine:
            Number.parseFloat(style.lineHeight) +
            Number.parseFloat(style.paddingBlockStart) +
            Number.parseFloat(style.paddingBlockEnd),
          overflowing: element.scrollWidth > element.clientWidth,
        };
      });
      expect(after.overflowing).toBe(true);
      expect(after.height).toBeLessThanOrEqual(after.oneLine + 2);
      expect(after.height).toBeCloseTo(before.height, 0);
    });
  }
});

test.describe('an image with an empty caption', () => {
  test('renders no caption element, and names its control from openLabel', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'uncaptioned');

    await expect(root.locator('figcaption')).toHaveCount(0);
    await expect(frames(root).first()).toHaveAccessibleName(OPEN_LABEL);
  });
});
