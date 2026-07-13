import { expect, test } from '@playwright/test';
import { authenticateAdmin } from './authenticate-admin';
import { waitForAuthState } from './wait-for-auth';

test.setTimeout(120000);

test.describe('Thread Labels (PBI-041)', () => {
  let threadUrl: string;
  let threadKey: string;
  const uniqueThreadTitle = `E2E Labels Test ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    // Create a test thread first
    const page = await browser.newPage();

    await authenticateAdmin(page);
    await page.goto('http://localhost:4321/create/thread');
    await waitForAuthState(page, 15000);

    // Fill in the thread title
    await page.fill('input[name="title"]', uniqueThreadTitle);

    // Wait for CodeMirror editor
    await page.waitForSelector('.cm-editor', {
      state: 'attached',
      timeout: 15000,
    });

    // Add some content with hashtags to test tag/label distinction
    const editor = page.locator('.cm-content');
    await editor.click();
    await editor.fill('Test thread for admin labels. #test #automation #e2e');

    // Submit the thread
    await expect(page.getByTestId('send-thread-button')).toBeEnabled();
    await page.getByTestId('send-thread-button').click();

    // Wait for navigation to the thread page
    await page.waitForURL(/\/threads\/[^/]+$/, { timeout: 15000 });

    threadUrl = page.url();
    const urlMatch = threadUrl.match(/\/threads\/([^/]+)$/);
    if (urlMatch) {
      threadKey = urlMatch[1];
    }

    console.log('Created test thread:', threadKey);
    await page.close();
  });

  test('admin can add labels to a thread', async ({ page }) => {
    await authenticateAdmin(page);
    await page.goto(threadUrl);
    await waitForAuthState(page, 15000);

    // Wait for thread to load
    await expect(
      page.getByRole('heading', { name: uniqueThreadTitle, level: 1 }),
    ).toBeVisible();

    // Add a label using the API directly (most reliable approach)
    const response = await page.evaluate(async (key) => {
      const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
      return await authedFetch(`/api/threads/${key}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['featured'] }),
      });
    }, threadKey);

    console.log('Add label API response status:', response);

    // Reload the page to see the label
    await page.reload();
    await waitForAuthState(page, 15000);

    // Wait a bit for the page to fully load
    await page.waitForTimeout(2000);

    // Check if the "featured" label appears using chip selector
    const featuredLabelChip = page.locator('.cn-chip.secondary', {
      hasText: 'featured',
    });
    await expect(featuredLabelChip).toBeVisible({ timeout: 10000 });

    console.log('Label "featured" is now visible on the thread');
  });

  test('labels persist after thread edit (PBI-042 fix)', async ({ page }) => {
    await authenticateAdmin(page);
    await page.goto(threadUrl);
    await waitForAuthState(page, 15000);

    // First, ensure the thread has a label
    await page.evaluate(async (key) => {
      const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
      await authedFetch(`/api/threads/${key}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['persistent'] }),
      });
    }, threadKey);

    // Reload to see the label
    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    // Verify label exists using chip selector
    const labelChipBefore = page.locator('.cn-chip.secondary', {
      hasText: 'persistent',
    });
    await expect(labelChipBefore).toBeVisible({
      timeout: 10000,
    });

    console.log('Label "persistent" verified before edit');

    // Instead of using the UI to edit, update via API to test label persistence
    // This is more reliable and tests the actual backend behavior
    const updateResult = await page.evaluate(
      async (args) => {
        const { authedFetch } = await import(
          '/src/firebase/client/apiClient.ts'
        );
        try {
          const response = await authedFetch(`/api/threads/${args.key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: args.key,
              title: args.title,
              markdownContent:
                'Updated content with different tags. #updated #modified',
              channel: 'general',
            }),
          });
          return {
            ok: response.ok,
            status: response.status,
          };
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
      { key: threadKey, title: uniqueThreadTitle },
    );

    console.log('Thread updated via API:', updateResult);
    expect(updateResult.ok).toBe(true);

    // Reload the thread page to see changes
    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    // Verify the admin label still exists after edit using chip selector
    const labelChipAfter = page.locator('.cn-chip.secondary', {
      hasText: 'persistent',
    });
    await expect(labelChipAfter).toBeVisible({
      timeout: 10000,
    });

    console.log(
      'Label "persistent" still visible after thread edit - PBI-042 fix verified',
    );
  });

  test('labels appear on tag pages immediately (PBI-042 fix)', async ({
    page,
  }) => {
    const uniqueLabel = `instant-${Date.now()}`;

    await authenticateAdmin(page);
    await page.goto(threadUrl);
    await waitForAuthState(page, 15000);

    console.log(
      `Adding unique label "${uniqueLabel}" to test immediate visibility`,
    );

    // Add a unique label
    const addResponse = await page.evaluate(
      async (args) => {
        const { authedFetch } = await import(
          '/src/firebase/client/apiClient.ts'
        );
        const response = await authedFetch(`/api/threads/${args.key}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labels: [args.label] }),
        });
        return {
          ok: response.ok,
          status: response.status,
          body: await response.json(),
        };
      },
      { key: threadKey, label: uniqueLabel },
    );

    console.log('Add label response:', addResponse);
    expect(addResponse.ok).toBe(true);

    // Immediately navigate to the tag page (within 100ms - testing race condition fix)
    await page.goto(`http://localhost:4321/tags/${uniqueLabel}`, {
      waitUntil: 'domcontentloaded',
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // The thread should appear on the tag page (PBI-042 fix ensures tag index is updated synchronously)
    const threadLink = page.locator(`a[href*="/threads/${threadKey}"]`);

    // Before PBI-042 fix, this would often fail with "No entries found"
    // After the fix, the thread should be immediately visible
    await expect(threadLink).toBeVisible({ timeout: 10000 });

    console.log(
      `Thread is immediately visible on /tags/${uniqueLabel} page - race condition fixed`,
    );
  });

  test('admin can remove labels from a thread', async ({ page }) => {
    await authenticateAdmin(page);
    await page.goto(threadUrl);
    await waitForAuthState(page, 15000);

    // First add a label to remove
    await page.evaluate(async (key) => {
      const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
      await authedFetch(`/api/threads/${key}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['removeme'] }),
      });
    }, threadKey);

    // Reload to see the label
    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    // Verify label exists using the chip selector
    const labelChip = page.locator('.cn-chip.secondary', {
      hasText: 'removeme',
    });
    await expect(labelChip).toBeVisible({
      timeout: 10000,
    });

    console.log('Label "removeme" verified before removal');

    // Remove the label
    const removeResponse = await page.evaluate(async (key) => {
      const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
      const response = await authedFetch(`/api/threads/${key}/labels`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['removeme'] }),
      });
      return {
        ok: response.ok,
        status: response.status,
      };
    }, threadKey);

    console.log('Remove label response:', removeResponse);
    expect(removeResponse.ok).toBe(true);

    // Reload to verify removal
    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    // Verify label is gone - check that no .secondary chip with "removeme" exists
    const removedLabel = page.locator('.cn-chip.secondary', {
      hasText: 'removeme',
    });
    await expect(removedLabel).not.toBeVisible();

    console.log('Label "removeme" successfully removed');
  });

  test('labels are visually distinct from user tags', async ({ page }) => {
    await authenticateAdmin(page);
    await page.goto(threadUrl);
    await waitForAuthState(page, 15000);

    // Add an admin label
    await page.evaluate(async (key) => {
      const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
      await authedFetch(`/api/threads/${key}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['official'] }),
      });
    }, threadKey);

    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    // Check if there's visual distinction based on actual implementation
    // Labels have .cn-chip.secondary class and cn-icon with noun="label-tag"
    // User tags have .cn-chip class without .secondary

    // Find label chip (should have .secondary class and contain "official")
    const labelChip = page.locator('.cn-chip.secondary', {
      hasText: 'official',
    });
    await expect(labelChip).toBeVisible({ timeout: 10000 });

    // Verify label has the icon
    const labelIcon = labelChip.locator('cn-icon[noun="label-tag"]');
    await expect(labelIcon).toBeVisible();

    // Find a user tag chip (should be .cn-chip without .secondary, e.g., "test", "automation", or "e2e")
    const userTagChips = page.locator('.cn-chip:not(.secondary)');
    const userTagCount = await userTagChips.count();
    expect(userTagCount).toBeGreaterThan(0);

    // Verify user tags don't have the label icon
    const firstUserTag = userTagChips.first();
    const userTagIcon = firstUserTag.locator('cn-icon[noun="label-tag"]');
    await expect(userTagIcon).not.toBeVisible();

    console.log(
      'Successfully verified visual distinction between labels and tags',
    );
    console.log('- Labels have .secondary class and label-tag icon');
    console.log('- User tags are plain .cn-chip without .secondary class');
  });

  test('can add labels to threads without any user tags', async ({ page }) => {
    // This tests the bug fix: threads without tags should still accept labels
    const noTagsThreadTitle = `No Tags Thread ${Date.now()}`;

    await authenticateAdmin(page);
    await page.goto('http://localhost:4321/create/thread');
    await waitForAuthState(page, 15000);

    // Fill in the thread title
    await page.fill('input[name="title"]', noTagsThreadTitle);

    // Wait for CodeMirror editor
    await page.waitForSelector('.cm-editor', {
      state: 'attached',
      timeout: 15000,
    });

    // Add content WITHOUT any hashtags (no user tags)
    const editor = page.locator('.cm-content');
    await editor.click();
    await editor.fill(
      'This thread has no hashtags and therefore no user tags.',
    );

    // Submit the thread
    await expect(page.getByTestId('send-thread-button')).toBeEnabled();
    await page.getByTestId('send-thread-button').click();

    // Wait for navigation to the thread page
    await page.waitForURL(/\/threads\/[^/]+$/, { timeout: 15000 });

    const noTagsThreadUrl = page.url();
    const urlMatch = noTagsThreadUrl.match(/\/threads\/([^/]+)$/);
    let noTagsThreadKey = '';
    if (urlMatch) {
      noTagsThreadKey = urlMatch[1];
    }

    console.log('Created thread without tags:', noTagsThreadKey);

    // Reload to ensure we have fresh data
    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    // Verify no user tags are present (tags section should not show user tags)
    const hasUserTags = await page.locator('.cn-chip:not(.secondary)').count();
    console.log('User tag count:', hasUserTags);

    // Now try to add an admin label (this is where the bug occurred)
    const addLabelResponse = await page.evaluate(async (key) => {
      const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
      const response = await authedFetch(`/api/threads/${key}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['first-label'] }),
      });
      return {
        ok: response.ok,
        status: response.status,
        body: await response.json(),
      };
    }, noTagsThreadKey);

    console.log('Add label to thread without tags response:', addLabelResponse);
    expect(addLabelResponse.ok).toBe(true);
    expect(addLabelResponse.status).toBe(200);

    // Reload and verify the label appears
    await page.reload();
    await waitForAuthState(page, 15000);
    await page.waitForTimeout(2000);

    const labelElement = page.locator('text=/first-label/i').first();
    await expect(labelElement).toBeVisible({ timeout: 10000 });

    console.log(
      'Successfully added label to thread without user tags - bug fix verified',
    );

    // Cleanup: delete the test thread
    await page.goto(`${noTagsThreadUrl}/confirmDelete`);
    await page.waitForTimeout(1000);
    const confirmButton = page.locator('button[type="submit"]');
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
      console.log('Test thread cleaned up');
    }
  });

  test('non-admin users cannot add labels', async ({ page }) => {
    // Authenticate as non-admin user (newUser)
    const { authenticate } = await import('./authenticate-e2e');
    await authenticate(page, true); // Use newUser who is not admin

    // Don't navigate to the thread - just wait for auth to be ready
    // The newUser may be on onboarding page, but that's fine for API testing
    await page.waitForTimeout(2000);

    // Try to add a label as non-admin user (should fail with 403)
    const response = await page.evaluate(async (key) => {
      try {
        const { authedFetch } = await import(
          '/src/firebase/client/apiClient.ts'
        );
        const res = await authedFetch(`/api/threads/${key}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labels: ['unauthorized'] }),
        });
        return {
          ok: res.ok,
          status: res.status,
          body: await res.json(),
        };
      } catch (error) {
        return {
          ok: false,
          status: 0,
          error: error.message,
        };
      }
    }, threadKey);

    console.log('Non-admin label add attempt response:', response);

    // Non-admin user should be denied with 403 Forbidden
    expect(response.status).toBe(403);
    expect(response.ok).toBe(false);
    expect(response.body.error).toContain('Forbidden');
  });

  test.afterAll(async ({ browser }) => {
    // Clean up the test thread
    if (!threadKey) return;

    const page = await browser.newPage();
    try {
      await authenticateAdmin(page);
      await page.goto(threadUrl);
      await waitForAuthState(page, 15000);

      // Navigate to delete confirmation
      const deleteButton = page.locator('a[href*="confirmDelete"]');
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        await page.waitForURL(/\/threads\/[^/]+\/confirmDelete$/, {
          timeout: 15000,
        });

        const confirmButton = page.locator('button[type="submit"]');
        await confirmButton.click();
        await page.waitForTimeout(3000);

        console.log('Test thread cleaned up successfully');
      }
    } catch (error) {
      console.error('Failed to clean up test thread:', error);
    } finally {
      await page.close();
    }
  });
});
