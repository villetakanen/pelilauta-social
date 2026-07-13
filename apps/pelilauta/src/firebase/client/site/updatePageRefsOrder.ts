import type { PageRef } from '@schemas/SiteSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Updates the manual order of page references in a site's table of contents.
 *
 * This function takes an ordered array of PageRefs and assigns sequential
 * order indices (0, 1, 2, ...) before updating the site document in Firestore.
 *
 * Uses the server-side API for updates to ensure proper authorization,
 * validation, and cache purging.
 *
 * @param siteKey - The site identifier
 * @param orderedPageRefs - Array of PageRefs in the desired order
 * @returns Promise<void>
 * @throws Error if siteKey is missing, user is not authenticated, or API call fails
 *
 * @example
 * ```typescript
 * // Reorder pages in a site
 * const orderedRefs = [pageA, pageC, pageB]; // Custom order
 * await updatePageRefsOrder('my-site', orderedRefs);
 * ```
 */
export async function updatePageRefsOrder(
  siteKey: string,
  orderedPageRefs: PageRef[],
): Promise<void> {
  if (!siteKey) {
    throw new Error('Site key is required to update page order');
  }

  if (!orderedPageRefs || orderedPageRefs.length === 0) {
    throw new Error('Page refs array is required');
  }

  try {
    logDebug('updatePageRefsOrder', 'Updating page order for site', {
      siteKey,
      pageCount: orderedPageRefs.length,
    });

    // Assign sequential order indices to the page refs
    const pageRefsWithOrder = orderedPageRefs.map((pageRef, index) => ({
      ...pageRef,
      order: index,
    }));

    // Use authedPatch helper - handles auth token automatically
    const { authedPatch } = await import('@firebase/client/apiClient');

    // Update site with ordered page refs
    // Use silent=true to avoid updating flowTime/updatedAt for TOC reordering
    const response = await authedPatch(`/api/sites/${siteKey}`, {
      pageRefs: pageRefsWithOrder,
      silent: true,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));
      throw new Error(
        errorData.error ||
          `Failed to update page order: HTTP ${response.status}`,
      );
    }

    logDebug('updatePageRefsOrder', 'Page order updated successfully', {
      siteKey,
      pageCount: orderedPageRefs.length,
    });
  } catch (error) {
    logError('updatePageRefsOrder', 'Failed to update page order:', error);
    throw error;
  }
}
