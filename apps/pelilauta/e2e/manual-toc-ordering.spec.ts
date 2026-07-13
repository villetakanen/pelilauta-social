import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';
import {
  getSiteFromFirestore,
  updateSiteInFirestore,
} from './firebase-admin-helper';

test.describe('Manual TOC Ordering', () => {
  test('Owner can enable manual sort and reorder pages', async ({ page }) => {
    // 1. Setup: Login as site owner
    await authenticate(page);

    // Seed the site with pages to reorder
    await updateSiteInFirestore('e2e-test-site', {
      pageRefs: [
        {
          key: 'page-1',
          name: 'Page 1',
          author: 'sator',
          flowTime: Date.now(),
          order: 0,
        },
        {
          key: 'page-2',
          name: 'Page 2',
          author: 'sator',
          flowTime: Date.now(),
          order: 1,
        },
        {
          key: 'page-3',
          name: 'Page 3',
          author: 'sator',
          flowTime: Date.now(),
          order: 2,
        },
      ],
      pageCategories: [], // Clear categories to avoid confusion
      sortOrder: 'name', // Reset sort order
    });

    // Verify data
    const _site = await getSiteFromFirestore('e2e-test-site');

    // Wait for data propagation
    await page.waitForTimeout(2000);

    // Navigate to the site TOC settings page
    // Assuming 'e2e-test-site' is the site we are testing with
    await page.goto('http://localhost:4321/sites/e2e-test-site/toc/settings');

    // 2. Enable Manual Sorting
    // Wait for the sort order dropdown to be visible
    // Use the name attribute we added
    const sortSelect = page.locator('select[name="sortOrder"]');
    await expect(sortSelect).toBeVisible();

    // Wait for the select to be enabled (auth ready)
    await expect(sortSelect).toBeEnabled({ timeout: 10000 });

    // Select 'manual' option
    await sortSelect.selectOption('manual');

    // Wait for the list to appear
    // Add explicit wait for the element to be attached to DOM
    await page.waitForSelector('cn-sortable-list', {
      state: 'attached',
      timeout: 10000,
    });

    const sortableList = page.locator('cn-sortable-list').first();

    await expect(sortableList).toBeVisible();

    // 3. Reorder Pages
    // Wait for the list to be fully rendered
    await expect(sortableList).toBeVisible();

    // Get the items
    const items = sortableList.locator('li');
    await expect(items).toHaveCount(3);

    // Verify initial order
    await expect(items.nth(0)).toContainText('Page 1');
    await expect(items.nth(1)).toContainText('Page 2');
    await expect(items.nth(2)).toContainText('Page 3');

    // Perform drag and drop: Drag last item (Page 3) to the position of the first item (Page 1)
    const firstItem = items.nth(0);
    const lastItem = items.nth(2);

    // Use the drag handle if available, otherwise the item itself
    const lastItemHandle = lastItem.locator('cn-icon[noun="drag-handle"]');
    const firstItemHandle = firstItem.locator('cn-icon[noun="drag-handle"]');

    if (await lastItemHandle.isVisible()) {
      console.log('Dragging using handles');
      await lastItemHandle.dragTo(firstItemHandle);
    } else {
      console.log('Dragging using items');
      await lastItem.dragTo(firstItem);
    }

    // 4. Verify Persistence
    // Wait for data propagation before reload
    await page.waitForTimeout(2000);

    // Reload the page to verify persistence
    await page.reload();

    // Wait for list to reappear
    await expect(page.locator('cn-sortable-list').first()).toBeVisible();

    // Verify the order is preserved: Page 3 should now be first
    const newItems = page.locator('cn-sortable-list').first().locator('li');
    await expect(newItems.nth(0)).toContainText('Page 3');

    // 5. Verify Public TOC
    await page.goto('http://localhost:4321/sites/e2e-test-site/toc');

    // Verify the order on the public page
    // This depends on the structure of the public TOC.
    // Assuming it lists pages in order.
    const publicListItems = page.locator('main li'); // Adjust selector as needed
    // We might need to be more specific if there are other lists
    await expect(publicListItems.first()).toContainText('Page 3');
  });
});
