import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnMenu`: whether the platform's popover really
 * delivers the light dismissal, the Escape key and the focus return the component
 * declines to implement, whether the container reaches the top layer, and where the
 * anchor puts it when the trigger sits against an edge. None of that is readable
 * from the source.
 *
 * Locators read the book page's `MenuSpecimen`. The page mounts it twice per
 * trigger — once per colour scheme — and the first is the Light one; the geometry
 * and the semantics under test resolve once, so one panel answers for both.
 */

const BOOK = '/components/cn-menu';

const specimen = (page: Page, trigger: 'kebab' | 'dots' = 'kebab') =>
  page.locator(`.menu-specimen[data-trigger="${trigger}"]`).first();
const trigger = (root: Locator) => root.locator('.cn-menu-trigger');
const container = (root: Locator) => root.locator('.cn-menu-container');
const items = (root: Locator) => container(root).locator('a[href], button');
const performed = (root: Locator) => root.locator('p.text-label');

/** The specimen is an Astro island: a click before it hydrates changes nothing. */
async function open(page: Page, root = specimen(page)) {
  await page.waitForLoadState('networkidle');
  await trigger(root).click();
  await expect(container(root)).toBeVisible();
  return root;
}

/**
 * Opens the menu without the pointer. The dev toolbar sits over the viewport
 * edges, so a trigger pinned to one is unreachable by a real click; the invoker
 * relationship the geometry depends on is the same either way.
 */
async function openScripted(page: Page, root: Locator) {
  await page.waitForLoadState('networkidle');
  await trigger(root).evaluate((el: HTMLButtonElement) => el.click());
  await expect(container(root)).toBeVisible();
}

/** Pins the trigger to a viewport edge. Test rig, not a system value. */
async function pin(root: Locator, css: string) {
  await root
    .locator('.cn-menu')
    .evaluate((el, style) => el.setAttribute('style', style), css);
}

test.describe('opening', () => {
  test('the container opens aligned to the trigger, and the trigger reports itself expanded', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page);
    await expect(trigger(root)).toHaveAttribute('aria-expanded', 'false');

    await open(page, root);

    await expect(trigger(root)).toHaveAttribute('aria-expanded', 'true');

    const button = (await trigger(root).boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const panel = (await container(root).boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    // Below the trigger, and sharing its inline-end edge.
    expect(panel.y).toBeGreaterThanOrEqual(button.y + button.height - 1);
    expect(panel.x + panel.width).toBeCloseTo(button.x + button.width, 0);
  });

  test('the open container paints above the content around it', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await open(page);

    // The top layer is what a hit test at the container's centre proves: the
    // book's surfaces sit under that point.
    const hit = await container(root).evaluate((panel) => {
      const box = panel.getBoundingClientRect();
      const found = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return panel.contains(found);
    });
    expect(hit).toBe(true);
  });

  test('the inline trigger opens the same container', async ({ page }) => {
    await page.goto(BOOK);
    const root = specimen(page, 'dots');

    await open(page, root);

    await expect(trigger(root)).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * The book mounts the same specimen once per colour scheme, which is the case a
   * server-generated id gets wrong: both copies ship one id, and the trigger
   * invokes whichever container the document reached first.
   */
  test('a second menu on the page opens the container beside it', async ({
    page,
  }) => {
    await page.goto(BOOK);
    await page.waitForLoadState('networkidle');
    const panels = page
      .locator('#content figure:has(.menu-specimen)')
      .first()
      .locator('.themed');
    expect(await panels.count()).toBe(2);

    await panels.nth(1).locator('.cn-menu-trigger').click();

    await expect(panels.nth(1).locator('.cn-menu-container')).toBeVisible();
    await expect(panels.nth(0).locator('.cn-menu-container')).toBeHidden();
  });
});

test.describe('dismissal', () => {
  test('a pointer press outside the container closes the menu', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await open(page);

    await page.mouse.click(2, 2);

    await expect(container(root)).toBeHidden();
    await expect(trigger(root)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes the menu and returns focus to the trigger', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await open(page);
    await items(root).first().focus();
    await expect(items(root).first()).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(container(root)).toBeHidden();
    await expect(trigger(root)).toBeFocused();
  });
});

test.describe('the items', () => {
  test("an item's command fires and the menu closes", async ({ page }) => {
    await page.goto(BOOK);
    const root = await open(page);
    await expect(performed(root)).toHaveText('Viimeisin komento: —');

    await container(root).getByRole('button', { name: 'Muokkaa' }).click();

    await expect(performed(root)).toHaveText('Viimeisin komento: Muokkaa');
    await expect(container(root)).toBeHidden();
  });

  test('every item is reachable from the keyboard', async ({ page }) => {
    await page.goto(BOOK);
    const root = await open(page);
    const count = await items(root).count();
    expect(count).toBe(3);

    // Opening moves no focus, so the walk starts at the trigger.
    await expect(trigger(root)).toBeFocused();
    for (let index = 0; index < count; index += 1) {
      await page.keyboard.press('Tab');
      await expect(items(root).nth(index)).toBeFocused();
    }
  });

  test('an item keeps the element the specimen wrote', async ({ page }) => {
    await page.goto(BOOK);
    const root = await open(page);

    const shapes = await items(root).evaluateAll((nodes) =>
      nodes.map((node) => ({
        tag: node.tagName,
        role: node.getAttribute('role'),
        tabindex: node.getAttribute('tabindex'),
      })),
    );
    expect(shapes).toEqual([
      { tag: 'A', role: null, tabindex: null },
      { tag: 'BUTTON', role: null, tabindex: null },
      { tag: 'BUTTON', role: null, tabindex: null },
    ]);
  });
});

test.describe('against a viewport edge', () => {
  test('a trigger at the inline end keeps the container in view', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page);
    await pin(
      root,
      'position: fixed; inset-block-start: 40%; inset-inline-end: 0;',
    );

    await openScripted(page, root);

    const panel = (await container(root).boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const view = page.viewportSize() as { width: number; height: number };
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(view.width);
  });

  test('a trigger at the block end keeps the container in view', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = specimen(page);
    await pin(
      root,
      'position: fixed; inset-block-end: 0; inset-inline-start: 8px;',
    );

    await openScripted(page, root);

    const panel = (await container(root).boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const view = page.viewportSize() as { width: number; height: number };
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.y + panel.height).toBeLessThanOrEqual(view.height);
  });
});
