/**
 * Content Update Hooks for Netlify Cache Purging
 *
 * Handles automatic cache purging when site content is updated.
 * Integrates with page update workflows to ensure immediate cache invalidation.
 */

import type { Site } from '../../schemas/SiteSchema';
import { logDebug, logError, logWarn } from '../../utils/logHelpers';
import { NetlifyCachePurger } from './netlify-cache';

/**
 * Handle page content updates with automatic cache purging
 *
 * This function should be called whenever page content is modified
 * to ensure users see the updated content immediately.
 *
 * @param siteKey The site key where the page was updated
 * @param pageKey The page key that was updated
 * @param site The site object for homepage detection
 * @returns Promise<void>
 */
export async function handlePageUpdate(
  siteKey: string,
  pageKey: string,
  site: Site,
): Promise<void> {
  try {
    // Check if cache purging is available
    const purger = new NetlifyCachePurger();

    if (!purger.isConfigured()) {
      logWarn(
        'handlePageUpdate',
        'Netlify cache purging not configured, skipping cache purge',
        {
          siteKey,
          pageKey,
          config: purger.getConfigStatus(),
        },
      );
      return;
    }

    // Determine if this is the homepage
    const isHomepage = pageKey === site.homepage;

    logDebug('handlePageUpdate', 'Starting cache purge for page update', {
      siteKey,
      pageKey,
      isHomepage,
      siteName: site.name,
    });

    // Purge the page cache
    const results = await purger.purgePageCache(siteKey, pageKey, isHomepage);

    // Check results and log appropriately
    const successfulResults = results.filter((result) => result.success);
    const failedResults = results.filter((result) => !result.success);

    if (failedResults.length > 0) {
      logError('handlePageUpdate', 'Some cache purge operations failed', {
        siteKey,
        pageKey,
        successful: successfulResults.length,
        failed: failedResults.length,
        failures: failedResults.map((r) => r.message),
      });
    } else {
      logDebug('handlePageUpdate', 'Cache purge completed successfully', {
        siteKey,
        pageKey,
        isHomepage,
        operations: results.length,
      });
    }
  } catch (error) {
    // Don't fail the page update if cache purging fails
    logError(
      'handlePageUpdate',
      'Failed to purge cache (page update will continue)',
      {
        siteKey,
        pageKey,
        error: error instanceof Error ? error.message : String(error),
      },
    );
  }
}

/**
 * Handle site-wide updates that affect multiple pages
 *
 * This function can be used when site-level changes occur that should
 * invalidate cache for all pages in a site.
 *
 * @param siteKey The site key that was updated
 * @param site The site object
 * @returns Promise<void>
 */
export async function handleSiteUpdate(
  siteKey: string,
  site: Site,
): Promise<void> {
  try {
    const purger = new NetlifyCachePurger();

    if (!purger.isConfigured()) {
      logWarn(
        'handleSiteUpdate',
        'Netlify cache purging not configured, skipping cache purge',
        {
          siteKey,
          config: purger.getConfigStatus(),
        },
      );
      return;
    }

    logDebug('handleSiteUpdate', 'Starting site-wide cache purge', {
      siteKey,
      siteName: site.name,
    });

    // Purge all site-related cache tags
    const tags = [`site-${siteKey}`, `homepage-${siteKey}`];

    const result = await purger.purgeTags(tags);

    if (result.success) {
      logDebug(
        'handleSiteUpdate',
        'Site-wide cache purge completed successfully',
        {
          siteKey,
          tags: result.tags,
        },
      );
    } else {
      logError('handleSiteUpdate', 'Site-wide cache purge failed', {
        siteKey,
        error: result.message,
      });
    }
  } catch (error) {
    logError('handleSiteUpdate', 'Failed to purge site-wide cache', {
      siteKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle bulk page updates (e.g., when multiple pages are modified)
 *
 * @param siteKey The site key
 * @param pageKeys Array of page keys that were updated
 * @param site The site object
 * @returns Promise<void>
 */
export async function handleBulkPageUpdate(
  siteKey: string,
  pageKeys: string[],
  site: Site,
): Promise<void> {
  try {
    const purger = new NetlifyCachePurger();

    if (!purger.isConfigured()) {
      logWarn(
        'handleBulkPageUpdate',
        'Netlify cache purging not configured, skipping cache purge',
        {
          siteKey,
          pageCount: pageKeys.length,
        },
      );
      return;
    }

    logDebug('handleBulkPageUpdate', 'Starting bulk cache purge', {
      siteKey,
      pageCount: pageKeys.length,
      pages: pageKeys,
    });

    // Build tags for all pages
    const tags = [`site-${siteKey}`]; // Always include site-wide tag

    for (const pageKey of pageKeys) {
      tags.push(`page-${siteKey}-${pageKey}`);

      // Check if any of the pages is the homepage
      if (pageKey === site.homepage) {
        tags.push(`homepage-${siteKey}`);
      }
    }

    // Remove duplicates
    const uniqueTags = [...new Set(tags)];

    const result = await purger.purgeTags(uniqueTags);

    if (result.success) {
      logDebug(
        'handleBulkPageUpdate',
        'Bulk cache purge completed successfully',
        {
          siteKey,
          pageCount: pageKeys.length,
          tagCount: uniqueTags.length,
        },
      );
    } else {
      logError('handleBulkPageUpdate', 'Bulk cache purge failed', {
        siteKey,
        pageCount: pageKeys.length,
        error: result.message,
      });
    }
  } catch (error) {
    logError('handleBulkPageUpdate', 'Failed to purge bulk cache', {
      siteKey,
      pageCount: pageKeys.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate cache purging configuration
 *
 * This function can be used to check if cache purging is properly configured
 * during application startup or in health checks.
 *
 * @returns boolean True if cache purging is configured
 */
export function isCachePurgingConfigured(): boolean {
  try {
    const purger = new NetlifyCachePurger();
    return purger.isConfigured();
  } catch (error) {
    logError(
      'isCachePurgingConfigured',
      'Failed to check cache purging configuration',
      error,
    );
    return false;
  }
}

/**
 * Get cache purging configuration status for debugging
 *
 * @returns object Configuration status details
 */
export function getCachePurgingStatus(): {
  configured: boolean;
  siteId: boolean;
  apiToken: boolean;
  error?: string;
} {
  try {
    const purger = new NetlifyCachePurger();
    return purger.getConfigStatus();
  } catch (error) {
    return {
      configured: false,
      siteId: false,
      apiToken: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
