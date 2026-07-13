/**
 * Netlify Cache Purging Service
 *
 * Provides automatic cache invalidation for Netlify CDN using cache tags and URLs.
 * This service integrates with content update workflows to ensure users always
 * see fresh content immediately after changes.
 */

import { logDebug, logError } from '../../utils/logHelpers';

export interface PurgeTagsOptions {
  tags: string[];
}

export interface PurgeUrlsOptions {
  urls: string[];
}

export interface PurgeResult {
  success: boolean;
  message?: string;
  tags?: string[];
  urls?: string[];
}

/**
 * Service class for interacting with Netlify's cache purge API
 */
export class NetlifyCachePurger {
  private readonly siteId: string;
  private readonly apiToken: string;
  private readonly apiBaseUrl = 'https://api.netlify.com/api/v1';

  constructor() {
    this.siteId = import.meta.env.NETLIFY_SITE_ID;
    this.apiToken = import.meta.env.NETLIFY_PURGE_TOKEN;

    if (!this.siteId) {
      throw new Error(
        'NETLIFY_SITE_ID environment variable is required for cache purging',
      );
    }

    if (!this.apiToken) {
      throw new Error(
        'NETLIFY_PURGE_TOKEN environment variable is required for cache purging',
      );
    }

    logDebug(
      'NetlifyCachePurger',
      'Initialized with site ID:',
      `${this.siteId.substring(0, 8)}...`,
    );
  }

  /**
   * Purge cache by tags
   *
   * @param tags Array of cache tags to purge
   * @returns Promise<PurgeResult> Result of the purge operation
   */
  async purgeTags(tags: string[]): Promise<PurgeResult> {
    if (!tags || tags.length === 0) {
      return {
        success: false,
        message: 'No tags provided for purging',
      };
    }

    try {
      logDebug('NetlifyCachePurger', 'Purging cache for tags:', tags);

      const response = await fetch(`${this.apiBaseUrl}/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          site_id: this.siteId,
          tags: tags,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = `Failed to purge cache tags (${response.status}): ${responseText}`;
        logError('NetlifyCachePurger', errorMessage);

        return {
          success: false,
          message: errorMessage,
          tags,
        };
      }

      logDebug(
        'NetlifyCachePurger',
        'Successfully purged cache for tags:',
        tags,
      );

      return {
        success: true,
        message: 'Cache purged successfully',
        tags,
      };
    } catch (error) {
      const errorMessage = `Cache purge error: ${error instanceof Error ? error.message : String(error)}`;
      logError('NetlifyCachePurger', errorMessage, error);

      return {
        success: false,
        message: errorMessage,
        tags,
      };
    }
  }

  /**
   * Purge cache by URLs
   *
   * @param urls Array of URLs to purge from cache
   * @returns Promise<PurgeResult> Result of the purge operation
   */
  async purgeUrls(urls: string[]): Promise<PurgeResult> {
    if (!urls || urls.length === 0) {
      return {
        success: false,
        message: 'No URLs provided for purging',
      };
    }

    try {
      logDebug('NetlifyCachePurger', 'Purging cache for URLs:', urls);

      const response = await fetch(`${this.apiBaseUrl}/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          site_id: this.siteId,
          files: urls,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = `Failed to purge cache URLs (${response.status}): ${responseText}`;
        logError('NetlifyCachePurger', errorMessage);

        return {
          success: false,
          message: errorMessage,
          urls,
        };
      }

      logDebug(
        'NetlifyCachePurger',
        'Successfully purged cache for URLs:',
        urls,
      );

      return {
        success: true,
        message: 'Cache purged successfully',
        urls,
      };
    } catch (error) {
      const errorMessage = `URL cache purge error: ${error instanceof Error ? error.message : String(error)}`;
      logError('NetlifyCachePurger', errorMessage, error);

      return {
        success: false,
        message: errorMessage,
        urls,
      };
    }
  }

  /**
   * Purge cache for a specific page update
   *
   * This is a convenience method that handles both tag-based and URL-based purging
   * for page content updates, with special handling for homepage changes.
   *
   * @param siteKey The site key
   * @param pageKey The page key
   * @param isHomepage Whether this page is the site homepage
   * @returns Promise<PurgeResult[]> Results of all purge operations
   */
  async purgePageCache(
    siteKey: string,
    pageKey: string,
    isHomepage: boolean = false,
  ): Promise<PurgeResult[]> {
    const results: PurgeResult[] = [];

    // Build cache tags for this page
    const tags = [`page-${siteKey}-${pageKey}`, `site-${siteKey}`];
    if (isHomepage) {
      tags.push(`homepage-${siteKey}`);
    }

    // Purge by tags first
    const tagResult = await this.purgeTags(tags);
    results.push(tagResult);

    // Build URLs to purge
    const urls = [`/sites/${siteKey}/${pageKey}/`];
    if (isHomepage) {
      // Also purge the site homepage route
      urls.push(`/sites/${siteKey}/`);
    }

    // Purge specific URLs for immediate effect
    const urlResult = await this.purgeUrls(urls);
    results.push(urlResult);

    // Log summary
    const successfulOperations = results.filter((r) => r.success).length;
    const totalOperations = results.length;

    logDebug(
      'NetlifyCachePurger',
      `Page cache purge completed: ${successfulOperations}/${totalOperations} operations successful`,
      { siteKey, pageKey, isHomepage, tags, urls },
    );

    return results;
  }

  /**
   * Check if the cache purger is properly configured
   *
   * @returns boolean True if properly configured
   */
  isConfigured(): boolean {
    return !!(this.siteId && this.apiToken);
  }

  /**
   * Get configuration status for debugging
   *
   * @returns object Configuration status
   */
  getConfigStatus(): {
    configured: boolean;
    siteId: boolean;
    apiToken: boolean;
  } {
    return {
      configured: this.isConfigured(),
      siteId: !!this.siteId,
      apiToken: !!this.apiToken,
    };
  }
}
