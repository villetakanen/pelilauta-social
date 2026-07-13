import type { Site } from '@schemas/SiteSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Updates a site using the server-side API endpoint.
 * This replaces the old client-side updateSite function.
 *
 * Server-side validation, authorization, and cache purging are handled
 * automatically by the API endpoint.
 *
 * @param site - Partial site data with key required
 * @param silent - If true, doesn't update timestamps (for metadata-only updates like TOC reordering)
 * @returns Promise<void>
 * @throws Error if site.key is missing, user is not authenticated, or API call fails
 *
 * @example
 * ```typescript
 * // Update site metadata
 * await updateSiteApi({ key: 'my-site', name: 'New Name' });
 *
 * // Silent update (no timestamp change, still purges cache)
 * await updateSiteApi({ key: 'my-site', sortOrder: 'manual' }, true);
 * ```
 */
export async function updateSiteApi(
  site: Partial<Site>,
  silent = false,
): Promise<void> {
  if (!site.key) {
    throw new Error('Site key is required to update site');
  }

  try {
    logDebug('updateSiteApi', 'Updating site via API', {
      siteKey: site.key,
      fields: Object.keys(site).filter((k) => k !== 'key'),
      silent,
    });

    // Use authedPatch helper - handles auth token automatically
    // We use PATCH because the API endpoint performs partial updates
    const { authedPatch } = await import('@firebase/client/apiClient');
    const { key, ...updateData } = site;

    const response = await authedPatch(`/api/sites/${key}`, {
      ...updateData,
      silent,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    logDebug('updateSiteApi', 'Site updated successfully', {
      siteKey: site.key,
    });
  } catch (error) {
    logError('updateSiteApi', 'Failed to update site:', error);
    throw error;
  }
}
