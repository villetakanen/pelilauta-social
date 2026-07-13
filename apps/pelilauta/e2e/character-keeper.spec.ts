import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';
import { waitForAuthState } from './wait-for-auth';

test.describe('Character Keeper', () => {
  const siteKey = 'e2e-keeper-test-site';

  test('can view character in keeper', async ({ page }) => {
    await authenticate(page);
    await page.goto(`http://localhost:4321/sites/${siteKey}/keeper`);
    await waitForAuthState(page);

    // Debug: Let's see what's actually on the page
    console.log('Page URL:', page.url());

    // Wait a bit for async loading to complete
    await page.waitForTimeout(3000);

    // Check what's in the character sheet selector
    const selectorOptions = await page
      .locator('select option')
      .allTextContents();
    console.log('Sheet selector options:', selectorOptions);

    // Check what the current selected value is (be specific about which select)
    const selectedValue = await page
      .locator('.select-wrapper select, div select')
      .first()
      .inputValue();
    console.log('Currently selected sheet key:', selectedValue);

    // Let's also check if there are any error messages
    const errorCards = await page.locator('cn-card[noun="error"]').count();
    if (errorCards > 0) {
      const errorText = await page
        .locator('cn-card[noun="error"]')
        .first()
        .textContent();
      console.log('Error on page:', errorText);
    }

    // Check if there are any info cards (like "no characters" or "no sheet")
    const infoCards = await page.locator('cn-card[noun="info"]').count();
    console.log('Number of info cards:', infoCards);
    if (infoCards > 0) {
      const infoText = await page
        .locator('cn-card[noun="info"]')
        .first()
        .textContent();
      console.log('Info message on page:', infoText);

      // Get the title and description separately
      const titleAttr = await page
        .locator('cn-card[noun="info"]')
        .first()
        .getAttribute('title');
      const descAttr = await page
        .locator('cn-card[noun="info"]')
        .first()
        .getAttribute('description');
      console.log('Info card title attr:', titleAttr);
      console.log('Info card description attr:', descAttr);
    }

    // Select a character sheet template first (use the first real sheet, not the placeholder)
    if (selectorOptions.length > 1) {
      const sheetToSelect = selectorOptions.find(
        (option) => option !== 'Valitse hahmolomake' && option.trim() !== '',
      );
      if (sheetToSelect) {
        console.log('Selecting sheet:', sheetToSelect);
        await page
          .locator('.select-wrapper select, div select')
          .first()
          .selectOption({ label: sheetToSelect });

        // Wait for the selection to be processed
        await page.waitForTimeout(3000);

        // Verify selection
        const newSelectedValue = await page
          .locator('.select-wrapper select, div select')
          .first()
          .inputValue();
        console.log('Sheet selected, new value:', newSelectedValue);

        // Check for console errors
        const consoleMessages = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleMessages.push(msg.text());
          }
        });

        // Wait a bit more and check if info cards have updated
        await page.waitForTimeout(2000);
        const infoCardsAfter = await page
          .locator('cn-card[noun="info"]')
          .count();
        console.log('Info cards after sheet selection:', infoCardsAfter);
        if (infoCardsAfter > 0) {
          const infoTextAfter = await page
            .locator('cn-card[noun="info"]')
            .first()
            .textContent();
          const titleAfter = await page
            .locator('cn-card[noun="info"]')
            .first()
            .getAttribute('title');
          const descAfter = await page
            .locator('cn-card[noun="info"]')
            .first()
            .getAttribute('description');
          console.log('Info message after selection:', infoTextAfter);
          console.log('Info title after selection:', titleAfter);
          console.log('Info desc after selection:', descAfter);
        }

        // Check for any loader that might indicate sheet is loading
        await page.waitForTimeout(2000);
        const loadersAfter = await page.locator('cn-loader').count();
        console.log('Loaders after more waiting:', loadersAfter);
      }
    }

    // Wait a bit more for characters to load after sheet selection
    await page.waitForTimeout(3000);

    // Check if there are any loading indicators
    const loaders = await page
      .locator('cn-loader, .loading, [class*="loading"]')
      .count();
    console.log('Loading indicators found:', loaders);

    // Check if there are any character cards after sheet selection
    const characterCards = await page
      .locator(
        '[data-testid="character-card"], .character-card, cn-card:not([noun])',
      )
      .count();
    console.log('Number of character cards found:', characterCards);

    // Let's also check for any elements containing our character name
    const characterNameElements = await page
      .locator('text=E2E Keeper Test Character')
      .count();
    console.log('Elements containing character name:', characterNameElements);

    // Check all text content on the page for debugging
    const bodyText = await page.locator('body').textContent();
    if (bodyText?.includes('E2E Keeper Test Character')) {
      console.log('Character name found in page text!');
    } else {
      console.log('Character name NOT found in page text');
    }

    // Let's try to verify if the character exists by making an API call
    try {
      const response = await page.evaluate(async () => {
        const response = await fetch('/api/characters');
        if (response.ok) {
          return response.json();
        }
        return { error: response.status };
      });
      console.log('Characters API response:', response);
    } catch (error) {
      console.log('Error calling characters API:', error);
    }

    await expect(page.getByText('E2E Keeper Test Character')).toBeVisible();

    await page.getByText('E2E Keeper Test Character').click();
    await page.waitForURL(/\/characters\//);
    expect(page.url()).toContain(`/characters/e2e-keeper-test-character`);
  });
});
