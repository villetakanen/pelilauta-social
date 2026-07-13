import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';
import { waitForAuthState } from './wait-for-auth';

test.setTimeout(120000); // Increase timeout for authentication and navigation

test('can create a character through the wizard successfully', async ({
  page,
}) => {
  // Listen for console errors and API responses
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();

    if (status >= 400) {
      console.log(`HTTP Error: ${status} - ${url}`);
    }

    if (url.includes('/api/characters')) {
      console.log('Character API Response:', status, url);
    }
  });

  // Monitor API requests
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`API Request: ${request.method()} ${request.url()}`);
    }
  });

  await authenticate(page);
  await page.goto('http://localhost:4321/create/character');

  // Use the robust auth state waiting mechanism
  await waitForAuthState(page, 15000);

  // Verify we're on the character creation wizard page
  await expect(page.locator('cn-card')).toBeVisible();

  // Step 1: System Selection
  console.log('Starting Step 1: System Selection');
  await expect(page.getByTestId('character-wizard-system-step')).toBeVisible();

  // The "Next" button should be visible and enabled (system defaults to homebrew)
  await expect(page.getByTestId('character-wizard-next-button')).toBeVisible();
  await expect(page.getByTestId('character-wizard-next-button')).toBeEnabled();

  // Click Next to go to Step 2
  await page.getByTestId('character-wizard-next-button').click();

  // Step 2: Sheet Selection
  console.log('Starting Step 2: Sheet Selection');
  await expect(page.getByTestId('character-wizard-sheet-step')).toBeVisible();

  // Should be able to go to previous step
  await expect(
    page.getByTestId('character-wizard-previous-button'),
  ).toBeEnabled();

  // Click Next to go to Step 3 (sheet is optional)
  await page.getByTestId('character-wizard-next-button').click();

  // Step 3: Site Selection
  console.log('Starting Step 3: Site Selection');
  await expect(page.getByTestId('character-wizard-site-step')).toBeVisible();

  // Click Next to go to Step 4 (site is optional)
  await page.getByTestId('character-wizard-next-button').click();

  // Step 4: Character Details (Meta)
  console.log('Starting Step 4: Character Details');
  await expect(page.getByTestId('character-wizard-meta-step')).toBeVisible();

  // The create button should be visible but disabled (no name yet)
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeVisible();
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeDisabled();

  // Create a unique character name using timestamp
  const uniqueCharacterName = `E2E Test Character ${Date.now()}`;
  const characterDescription =
    'A brave character created by the E2E test suite for testing purposes.';

  // Fill in the character name
  await page.getByTestId('character-name-input').fill(uniqueCharacterName);

  // The create button should now be enabled
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeEnabled();

  // Fill in the character description (optional)
  await page
    .getByTestId('character-description-input')
    .fill(characterDescription);

  // Verify the summary shows our selections
  await expect(page.getByTestId('character-summary')).toBeVisible();

  // Submit the character creation
  console.log('Submitting character creation...');
  await page.getByTestId('character-wizard-create-button').click();

  // Wait a bit to see if any error messages appear
  await page.waitForTimeout(2000);

  // Check if there's an error message before waiting for navigation
  const errorMessage = page
    .locator('[data-testid="snackbar"]')
    .or(page.locator('.error'))
    .or(page.locator('[role="alert"]'));

  if (await errorMessage.isVisible()) {
    const errorText = await errorMessage.textContent();
    console.log('Error message detected:', errorText);
    throw new Error(`Character creation failed with error: ${errorText}`);
  }

  // Wait for navigation to the characters library page
  await page.waitForURL(/\/library\/characters$/, { timeout: 15000 });

  // Verify we're on the characters library page
  await expect(page).toHaveURL(/\/library\/characters$/);

  // Look for success message (snackbar should show creation confirmation)
  const successMessage = page.locator('[data-testid="snackbar"]');
  if (await successMessage.isVisible()) {
    const successText = await successMessage.textContent();
    console.log('Success message:', successText);
    expect(successText).toContain(uniqueCharacterName);
  }

  console.log('Character creation completed successfully!');
});

test('character wizard requires name to create character', async ({ page }) => {
  await authenticate(page);
  await page.goto('http://localhost:4321/create/character');

  // Use the robust auth state waiting mechanism
  await waitForAuthState(page, 15000);

  // Navigate through all steps to the final step
  await page.getByTestId('character-wizard-next-button').click(); // Step 1 -> 2
  await page.getByTestId('character-wizard-next-button').click(); // Step 2 -> 3
  await page.getByTestId('character-wizard-next-button').click(); // Step 3 -> 4

  // Should be on the final step
  await expect(page.getByTestId('character-wizard-meta-step')).toBeVisible();

  // The create button should be disabled without a name
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeDisabled();

  // Try clicking the disabled button (should not do anything)
  await page
    .getByTestId('character-wizard-create-button')
    .click({ force: true });

  // Should still be on the same step
  await expect(page.getByTestId('character-wizard-meta-step')).toBeVisible();

  // Now add a name
  const characterName = `Required Name Test ${Date.now()}`;
  await page.getByTestId('character-name-input').fill(characterName);

  // The create button should now be enabled
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeEnabled();

  // Submit should now work
  await page.getByTestId('character-wizard-create-button').click();

  // Should navigate to characters library
  await page.waitForURL(/\/library\/characters$/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/library\/characters$/);
});

test('can navigate between wizard steps using previous/next buttons', async ({
  page,
}) => {
  await authenticate(page);
  await page.goto('http://localhost:4321/create/character');

  await waitForAuthState(page, 15000);

  // Start on Step 1 (System Selection)
  await expect(page.getByTestId('character-wizard-system-step')).toBeVisible();

  // Previous button should be disabled on first step
  await expect(
    page.getByTestId('character-wizard-previous-button'),
  ).toBeDisabled();

  // Go to Step 2
  await page.getByTestId('character-wizard-next-button').click();
  await expect(page.getByTestId('character-wizard-sheet-step')).toBeVisible();

  // Go to Step 3
  await page.getByTestId('character-wizard-next-button').click();
  await expect(page.getByTestId('character-wizard-site-step')).toBeVisible();

  // Go to Step 4
  await page.getByTestId('character-wizard-next-button').click();
  await expect(page.getByTestId('character-wizard-meta-step')).toBeVisible();

  // Next button should be replaced by Create button on final step
  await expect(
    page.getByTestId('character-wizard-next-button'),
  ).not.toBeVisible();
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeVisible();

  // Go back to Step 3
  await page.getByTestId('character-wizard-previous-button').click();
  await expect(page.getByTestId('character-wizard-site-step')).toBeVisible();
  await expect(page.getByTestId('character-wizard-next-button')).toBeVisible();

  // Go back to Step 2
  await page.getByTestId('character-wizard-previous-button').click();
  await expect(page.getByTestId('character-wizard-sheet-step')).toBeVisible();

  // Go back to Step 1
  await page.getByTestId('character-wizard-previous-button').click();
  await expect(page.getByTestId('character-wizard-system-step')).toBeVisible();

  // Previous button should be disabled again
  await expect(
    page.getByTestId('character-wizard-previous-button'),
  ).toBeDisabled();
});

test('character wizard preserves form data when navigating between steps', async ({
  page,
}) => {
  await authenticate(page);
  await page.goto('http://localhost:4321/create/character');

  await waitForAuthState(page, 15000);

  // Navigate to the final step
  await page.getByTestId('character-wizard-next-button').click(); // Step 1 -> 2
  await page.getByTestId('character-wizard-next-button').click(); // Step 2 -> 3
  await page.getByTestId('character-wizard-next-button').click(); // Step 3 -> 4

  // Fill in character details
  const characterName = `Form Persistence Test ${Date.now()}`;
  const characterDescription =
    'This character tests form data persistence across wizard steps.';

  await page.getByTestId('character-name-input').fill(characterName);
  await page
    .getByTestId('character-description-input')
    .fill(characterDescription);

  // Navigate back to step 1 and then forward again
  await page.getByTestId('character-wizard-previous-button').click(); // Step 4 -> 3
  await page.getByTestId('character-wizard-previous-button').click(); // Step 3 -> 2
  await page.getByTestId('character-wizard-previous-button').click(); // Step 2 -> 1

  // Navigate forward to final step
  await page.getByTestId('character-wizard-next-button').click(); // Step 1 -> 2
  await page.getByTestId('character-wizard-next-button').click(); // Step 2 -> 3
  await page.getByTestId('character-wizard-next-button').click(); // Step 3 -> 4

  // Verify the form data is preserved
  await expect(page.getByTestId('character-name-input')).toHaveValue(
    characterName,
  );
  await expect(page.getByTestId('character-description-input')).toHaveValue(
    characterDescription,
  );

  // The create button should be enabled since the name is filled
  await expect(
    page.getByTestId('character-wizard-create-button'),
  ).toBeEnabled();
});
