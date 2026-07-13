import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { authenticate } from './authenticate-e2e';

test.setTimeout(120000); // Increase timeout for authentication and navigation

test('Page name can be changed', async ({ page }) => {
  await authenticate(page); // Use default existing user
  await page.goto('http://localhost:4321/sites/e2e-test-site/front-page/edit');

  // Expect the user to be authenticated
  await expect(page.getByTestId('setting-navigation-button')).toBeVisible();

  // Expect the submit button to be disabled, as there are no changes
  await expect(page.getByTestId('save-button')).toBeDisabled();

  // Expect the page to be fully loaded
  await expect(page.locator('form.content-editor')).toBeVisible();

  // Change the name of the page
  const nameInput = page.getByTestId('page-name');
  await nameInput.click();
  await nameInput.fill('New Front Page');
  await nameInput.blur();

  // Verify the input value is actually updated
  await expect(nameInput).toHaveValue('New Front Page');

  // Explicitly dispatch input event to ensure Svelte reactivity triggers
  await nameInput.evaluate((node) =>
    node.dispatchEvent(new Event('input', { bubbles: true })),
  );

  // Expect the submit button to be enabled, as there are changes
  await expect(page.getByTestId('save-button')).toBeEnabled({ timeout: 10000 });

  // Expect the page to have a category selector
  await expect(page.getByTestId('page-category')).toBeVisible();

  // Change the category of the page to 'Omega'
  await page.getByTestId('page-category').selectOption({ label: 'Omega' });

  // Expect the submit button to be enabled, as there are changes
  await expect(page.getByTestId('save-button')).toBeEnabled();
});

test('Page update sets author to current user', async ({ page }) => {
  await authenticate(page); // Use default existing user (sator@iki.fi)

  // Navigate to the test page editor
  await page.goto('http://localhost:4321/sites/e2e-test-site/test-page/edit');

  // Wait for the page to load
  await expect(page.getByTestId('setting-navigation-button')).toBeVisible();

  // Get the current user's UID from the session store (stored in localStorage)
  const currentUid = await page.evaluate(() => {
    return localStorage.getItem('session-uid');
  });

  expect(currentUid).toBeTruthy();
  console.log('Current user UID:', currentUid);

  // Make a change to the page name
  await page.getByTestId('page-name').fill('Updated Test Page');

  // Click save button
  await page.getByTestId('save-button').click();

  // Wait for navigation (the page redirects after save)
  await page.waitForURL(/\/sites\/e2e-test-site\/test-page\?flowtime=\d+/);

  // Wait a bit for the update to complete
  await page.waitForTimeout(2000);

  // Verify the author field was set in Firestore
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const serviceAccountPath = join(__dirname, '../server_principal.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  const serverApp = initializeApp(
    {
      credential: cert(serviceAccount),
    },
    `test-${Date.now()}`, // Unique app name to avoid conflicts
  );

  const serverDB = getFirestore(serverApp);

  const pageDoc = await serverDB
    .collection('sites')
    .doc('e2e-test-site')
    .collection('pages')
    .doc('test-page')
    .get();

  const pageData = pageDoc.data();

  // Verify the page name was updated
  expect(pageData?.name).toBe('Updated Test Page');

  // Verify author is set to the current user
  expect(pageData?.author).toBe(currentUid);

  // Verify the user is in the owners array
  expect(pageData?.owners).toContain(currentUid);
});
