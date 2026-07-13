import { expect, test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:4321/');
  // Expect the page to be loaded with the correct title from environment
  // Use the dev environment title for tests
  const expectedTitle = 'Pelilauta';
  await expect(page).toHaveTitle(expectedTitle);
});
