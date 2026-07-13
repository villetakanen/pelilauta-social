import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';
import { waitForAuthState } from './wait-for-auth';

test.setTimeout(120000);

test('can create and edit a reply', async ({ page }) => {
  // --- Setup: Create a thread ---
  await authenticate(page);
  await page.goto('http://localhost:4321/create/thread');
  await waitForAuthState(page, 15000);

  const uniqueThreadTitle = `E2E Reply Edit Test ${Date.now()}`;
  await page.fill('input[name="title"]', uniqueThreadTitle);

  await page.waitForSelector('.cm-editor', {
    state: 'attached',
    timeout: 15000,
  });
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.fill('Thread for testing reply editing.');

  await page.getByTestId('send-thread-button').click();
  await page.waitForURL(/\/threads\/[^/]+$/, { timeout: 15000 });
  await waitForAuthState(page, 15000);

  // --- Test: Add a reply ---
  const replyContent = `Original reply content ${Date.now()}`;

  // Debug: Check if we are logged in or loading
  if (await page.getByText('Sign in').isVisible()) {
    throw new Error(
      'Test failed: User is not logged in (Sign in button visible)',
    );
  }
  if (await page.locator('cn-loader').isVisible()) {
    console.log('Loader is visible, waiting...');
    await page
      .locator('cn-loader')
      .waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Click reply button to open dialog
  // Try a more specific selector if getByRole fails
  const replyButton = page.locator('button:has(cn-icon[noun="send"])').first();
  if (await replyButton.isVisible()) {
    await replyButton.click();
  } else {
    console.log('Reply button not found with icon selector. Dumping buttons:');
    const buttons = await page.locator('button').allInnerTexts();
    console.log(buttons);
    throw new Error('Reply button not found');
  }

  // Wait for dialog
  const replyDialog = page.locator('dialog[open]');
  await expect(replyDialog).toBeVisible();

  // Fill reply content
  await replyDialog.locator('textarea[name="reply"]').fill(replyContent);

  // Submit reply
  await replyDialog.locator('button[type="submit"]').click();

  // Wait for reply to appear
  await expect(
    page.locator('article').filter({ hasText: replyContent }),
  ).toBeVisible();

  // --- Test: Edit the reply ---
  const updatedContent = `Updated reply content ${Date.now()}`;

  // Find the reply article
  const replyArticle = page
    .locator('article')
    .filter({ hasText: replyContent });

  // Open menu (assuming there is a menu button, might need hover or click)
  // Based on ReplyArticle.svelte: <cn-menu inline> ... </cn-menu>
  // We might need to target the menu trigger.
  // Let's assume the menu is visible or accessible.
  // The menu seems to be always visible in the toolbar?
  // "toolbar downscaled" -> "cn-menu inline"

  // Click the edit button. It might be inside a menu or directly visible depending on implementation.
  // In ReplyArticle.svelte I added:
  // <button class="text" onclick={() => editDialog?.showDialog()}>
  //   <cn-icon noun="edit" small></cn-icon>
  //   <span>{t('actions:edit')}</span>
  // </button>
  // It is inside the <ul> of <cn-menu>.

  // We might need to click the menu trigger first if it's a dropdown, but <cn-menu inline> suggests it's inline?
  // If it's inline, the button should be visible.

  // Click the edit button.
  // Use evaluate to bypass visibility checks completely
  await replyArticle
    .locator('button:has(cn-icon[noun="edit"])')
    .evaluate((node) => (node as HTMLElement).click());

  // Wait for edit dialog
  const editDialog = page.locator('dialog[open]');
  await expect(editDialog).toBeVisible();

  // Check pre-filled content
  await expect(editDialog.locator('textarea[name="reply"]')).toHaveValue(
    replyContent,
  );

  // Update content
  await editDialog.locator('textarea[name="reply"]').fill(updatedContent);

  // Save
  await editDialog.locator('button[type="submit"]').click();

  // Verify updated content in UI
  await expect(
    page.locator('article').filter({ hasText: updatedContent }),
  ).toBeVisible();
  await expect(
    page.locator('article').filter({ hasText: replyContent }),
  ).not.toBeVisible();

  // --- Cleanup: Delete thread ---
  await page.locator('a[href*="confirmDelete"]').first().click();
  await page.waitForURL(/\/threads\/[^/]+\/confirmDelete$/);
  await page.locator('button[type="submit"]').click(); // Adjust name if needed
});
