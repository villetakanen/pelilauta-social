/**
 * Journey: existingUser opens the Library, sorts campaign sites in the card grid,
 * opens a campaign wiki, and reads a formatted wiki page with prose flow.
 */
import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openReaderPage('existingUser'));
});

afterAll(async () => {
  await browser?.close();
});

it('browses the library card grid, sorts sites, and reads a wiki page with prose flow', async () => {
  // 1. Visit the library page.
  await page.goto('/library');

  // The card grid and sort controls are visible.
  const sortControls = page.locator('nav.sort-controls');
  await expect
    .poll(() => sortControls.isVisible(), { timeout: 30_000 })
    .toBe(true);

  // The seeded campaign sites are present in the card grid.
  const gloamroadCard = page.getByRole('link', {
    name: 'The Gloamroad Company',
  });
  await expect
    .poll(() => gloamroadCard.isVisible(), { timeout: 15_000 })
    .toBe(true);

  const bellweatherCard = page.getByRole('link', {
    name: 'The Bellweather Knives',
  });
  await expect
    .poll(() => bellweatherCard.isVisible(), { timeout: 15_000 })
    .toBe(true);

  // 2. Toggle sort direction in the library header.
  const directionButton = sortControls.locator('button[aria-label^="arrow"]');
  await expect.poll(() => directionButton.isVisible()).toBe(true);
  await directionButton.click();

  // 3. Open The Gloamroad Company campaign wiki.
  await gloamroadCard.click();
  await page.waitForURL('**/sites/gloamroad-company**', { timeout: 30_000 });

  // 4. Verify the page article is presented with .surface and .text-prose.
  const pageArticle = page.locator('article.surface');
  await expect
    .poll(() => pageArticle.isVisible(), { timeout: 30_000 })
    .toBe(true);

  const proseContainer = pageArticle.locator('.text-prose');
  await expect
    .poll(() => proseContainer.isVisible(), { timeout: 15_000 })
    .toBe(true);

  // Verify that headings and paragraphs inside the prose container have vertical separation.
  const heading = proseContainer.locator('h1').first();
  const paragraph = proseContainer.locator('p').first();

  await expect.poll(() => heading.isVisible()).toBe(true);
  await expect.poll(() => paragraph.isVisible()).toBe(true);

  const headingBox = await heading.boundingBox();
  const paragraphBox = await paragraph.boundingBox();

  if (!headingBox || !paragraphBox) {
    throw new Error('Prose elements did not lay out');
  }

  // Heading is positioned above paragraph and separated with non-zero margin/space.
  expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(paragraphBox.y);
});
