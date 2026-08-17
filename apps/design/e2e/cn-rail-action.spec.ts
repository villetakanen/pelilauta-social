import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnRailAction` standing alone: whether the
 * `app-chrome` container a frame declares really selects one toggle per band
 * with the other out of view and out of the accessibility tree, whether the
 * accessible-name algorithm gives each toggle the label, and whether the
 * decorative trigger drives its toggle without any script on the page.
 * `cn-rail.spec.ts` proves the same mechanism inside the rail; this proves it
 * owes the rail nothing.
 *
 * Every locator reads the book page's rendered specimens. The page mounts
 * the action four times (two bands × two schemes), so each test scopes to one
 * pane and one frame.
 */

const BOOK = '/components/cn-rail-action';

const pane = (page: Page) =>
  page.locator('.rail-action-specimen .pane[data-mode="light"]');
const narrowFrame = (page: Page) => pane(page).locator('.frame.narrow');
const wideFrame = (page: Page) => pane(page).locator('.frame.wide');

test.describe('one toggle per band', () => {
  test('the narrow frame shows the narrow pair alone, resting unchecked', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = narrowFrame(page);

    const narrow = frame.locator('.cn-rail-toggle.narrow');
    await expect(narrow).toHaveAccessibleName('Näytä valikko');
    await expect(narrow).not.toBeChecked();

    await expect(frame.locator('.cn-rail-toggle.wide')).toBeHidden();
    await expect(frame.locator('.cn-rail-trigger.wide')).toBeHidden();
  });

  test('the wide frame shows the wide pair alone, resting checked', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = wideFrame(page);

    const wide = frame.locator('.cn-rail-toggle.wide');
    await expect(wide).toHaveAccessibleName('Näytä valikko');
    await expect(wide).toBeChecked();

    await expect(frame.locator('.cn-rail-toggle.narrow')).toBeHidden();
    await expect(frame.locator('.cn-rail-trigger.narrow')).toBeHidden();
  });
});

test.describe('the trigger drives the toggle without script', () => {
  test('a pointer on the narrow trigger checks and unchecks its toggle', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const frame = narrowFrame(page);
    const toggle = frame.locator('.cn-rail-toggle.narrow');

    await frame.locator('.cn-rail-trigger.narrow').click();
    await expect(toggle).toBeChecked();

    await frame.locator('.cn-rail-trigger.narrow').click();
    await expect(toggle).not.toBeChecked();
  });

  test('the keyboard reaches the toggle and Space flips it', async ({
    page,
  }) => {
    await page.goto(BOOK);
    const toggle = wideFrame(page).locator('.cn-rail-toggle.wide');

    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).not.toBeChecked();
  });
});
