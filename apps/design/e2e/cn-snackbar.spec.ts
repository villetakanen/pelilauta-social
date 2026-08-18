import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnSnackbar`: whether the display period
 * really ends a message-only snack and leaves an offered one standing, whether
 * an action can be taken twice inside the exit, and where the component lands
 * once the layers around it are real. None of it is readable from the source,
 * and the SSR facts are in
 * packages/design-system/test/cn-snackbar.test.ts instead.
 *
 * Locators read the book page's `SnackbarSpecimen`, which mounts one pane per
 * colour scheme. The first is the Light one; behaviour and geometry resolve the
 * same in both, so one pane answers for the pair.
 */

const BOOK = '/components/cn-snackbar';

/** Past the five-second display period, with room for the exit after it. */
const AFTER_DISPLAY = 6_000;

const specimen = (page: Page, group: 'automatic' | 'action' | 'modal') =>
  page.locator(`.snackbar-specimen[data-group="${group}"] .pane`).first();
const bar = (root: Locator) => root.locator('.cn-snackbar');
const action = (root: Locator) => bar(root).locator('button');

/** The specimen is an Astro island: a click before it hydrates raises nothing. */
async function raise(page: Page, group: 'automatic' | 'action' | 'modal') {
  await page.waitForLoadState('networkidle');
  const root = specimen(page, group);
  await root.getByRole('button', { name: 'Näytä' }).click();
  await expect(bar(root)).toBeVisible();
  return root;
}

test.describe('the display period', () => {
  test('a message-only snack exits, and its dismissal empties the corner', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await raise(page, 'automatic');

    // The specimen drops the snack when CnSnackbar requests it, so the element
    // leaving the document is the request arriving.
    await expect(bar(root)).toBeHidden({ timeout: AFTER_DISPLAY + 2_000 });
  });

  test('a snack offering an action stands through it', async ({ page }) => {
    await page.goto(BOOK);
    const root = await raise(page, 'action');

    await page.waitForTimeout(AFTER_DISPLAY);

    await expect(bar(root)).toBeVisible();
  });
});

test.describe('the action', () => {
  test('taking it runs the callback and dismisses the snack', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await raise(page, 'action');
    await expect(root.locator('p.text-label')).toHaveText('Kumottu 0 kertaa');

    await action(root).click();

    await expect(root.locator('p.text-label')).toHaveText('Kumottu 1 kertaa');
    await expect(bar(root)).toBeHidden();
  });

  /*
   * The exit is not instant, so the button is still on screen after the first
   * activation. A second press inside that window is the case the guard exists
   * for, and a double click delivers both well inside it.
   */
  test('a second press inside the exit does not run it again', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await raise(page, 'action');

    await action(root).dblclick();

    await expect(bar(root)).toBeHidden();
    await expect(root.locator('p.text-label')).toHaveText('Kumottu 1 kertaa');
  });
});

test.describe('where it lands', () => {
  test('the bar sits at the lower inline-start corner of its containing block', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await raise(page, 'automatic');

    const frame = (await root.locator('.frame').boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const panel = (await bar(root).boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    // One --cn-grid, 8px, in from each edge.
    expect(panel.x - frame.x).toBeCloseTo(8, 0);
    expect(frame.y + frame.height - (panel.y + panel.height)).toBeCloseTo(8, 0);
  });

  test('the bar paints above a surface at the modal layer', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const root = await raise(page, 'modal');
    await expect(root.locator('.modal-stand-in')).toBeVisible();

    // The stand-in covers the corner the bar sits in, so a hit test at the
    // bar's centre answers which of the two is in front.
    const hit = await bar(root).evaluate((element) => {
      const box = element.getBoundingClientRect();
      const found = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return element.contains(found);
    });
    expect(hit).toBe(true);
  });
});
