import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';

test.setTimeout(120000); // Increase timeout for authentication and navigation

test('Can create a new page with Beta category', async ({ page }) => {
  await authenticate(page); // Use default existing user
  await page.goto('http://localhost:4321/sites/e2e-test-site/create/page');

  // Expect the user to be authenticated
  await expect(page.getByTestId('setting-navigation-button')).toBeVisible();

  // The submit button should be visible
  await expect(page.getByTestId('create-page-button')).toBeVisible();

  // Create a unique page name using timestamp
  const uniquePageName = `New Test Page ${Date.now()}`;

  // Fill in the page name
  await page.getByTestId('page-name-input').fill(uniquePageName);

  // Set the page category to 'Beta'
  await expect(page.getByTestId('page-category-select')).toBeVisible();
  await page
    .getByTestId('page-category-select')
    .selectOption({ label: 'Beta' });

  // Create the page
  await page.getByTestId('create-page-button').click();

  // Expect to be redirected to the newly created page (slug will be generated from the name)
  await expect(page).toHaveURL(/\/sites\/e2e-test-site\/new-test-page-\d+$/);

  // Verify the page content is displayed (should show default content structure)
  await expect(
    page.getByRole('heading', { name: uniquePageName, level: 1 }),
  ).toBeVisible();
});

test('Page creation requires page name', async ({ page }) => {
  await authenticate(page); // Use default existing user
  await page.goto('http://localhost:4321/sites/e2e-test-site/create/page');

  // The submit button should be visible
  await expect(page.getByTestId('create-page-button')).toBeVisible();

  // Try to submit without a name (should prevent submission)
  await page.getByTestId('create-page-button').click();

  // Should still be on the same page (submission was prevented)
  await expect(page).toHaveURL(/\/sites\/e2e-test-site\/create\/page$/);

  // Create a unique page name using timestamp
  const uniquePageName = `Complete Page ${Date.now()}`;

  // Fill in the page name
  await page.getByTestId('page-name-input').fill(uniquePageName);

  // Now submit should work
  await page.getByTestId('create-page-button').click();

  // Should be redirected to the new page (slug will be generated from the name)
  await expect(page).toHaveURL(/\/sites\/e2e-test-site\/complete-page-\d+$/);
});
