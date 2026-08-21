/**
 * Journey: existingUser edits a site page on a phone.
 *
 * The viewport is a phone's, so the composition the journey drives is the
 * stacked one: frontmatter above the canvas. The spec asserts what the reader
 * observes: the editor opens on the seeded page, the save action rests until
 * the document changes and arms when it does, and the published page carries
 * what was typed.
 */
import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

const PAGE_PATH = '/sites/gloamroad-company/front-page';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage('existingUser', {
    viewport: { width: 375, height: 812 },
  }));
});

afterAll(async () => {
  await browser?.close();
});

it('edits the front page and reads the edit on the published page', async () => {
  const marker = `Uat phone edit ${Date.now()}`;

  // 1. Open the seeded page in the editor.
  await page.goto(`${PAGE_PATH}/edit`);
  const canvas = page.locator('.cn-editor .cm-content');
  await canvas.waitFor({ state: 'visible', timeout: 60_000 });

  // On a phone the frontmatter stands above the canvas, not beside it.
  const nameField = page.getByTestId('page-name');
  await nameField.waitFor({ state: 'visible' });
  const fieldBox = await nameField.boundingBox();
  const canvasBox = await canvas.boundingBox();
  if (!fieldBox || !canvasBox) throw new Error('editor did not lay out');
  expect(fieldBox.y).toBeLessThan(canvasBox.y);

  // 2. The save action rests until the document changes.
  const save = page.getByTestId('save-button');
  await expect.poll(() => save.isDisabled()).toBe(true);

  // 3. Type at the end of the document.
  await page.locator('.cn-editor .cm-line').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type(`\n\n${marker}`);

  // 4. Typing armed the save action; take it.
  await expect.poll(() => save.isDisabled(), { timeout: 15_000 }).toBe(false);
  await save.click();

  // 5. Saving lands on the published page, and it carries the edit.
  await page.waitForURL(`**${PAGE_PATH}?flowtime=*`, { timeout: 60_000 });
  await expect
    .poll(() => page.getByText(marker).first().isVisible(), {
      timeout: 30_000,
    })
    .toBe(true);
});
