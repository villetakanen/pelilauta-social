import { logDebug, logWarn } from '../../../utils/logHelpers';

/**
 * Client-side helper for triggering server-side cache purging
 * when page content is updated.
 */
export async function purgeCacheForPage(
  siteKey: string,
  pageKey: string,
): Promise<void> {
  try {
    const { authedPost } = await import('../apiClient');

    logDebug('purgeCacheForPage', 'Requesting cache purge', {
      siteKey,
      pageKey,
    });

    const response = await authedPost('/api/cache/purge-page', {
      siteKey,
      pageKey,
    });

    if (response.ok) {
      const result = await response.json();
      logDebug('purgeCacheForPage', 'Cache purge successful', result);
    } else {
      logWarn('purgeCacheForPage', 'Cache purge failed', {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    // Don't throw - cache purging is a best-effort optimization
    // Page updates should continue even if cache purging fails
    logWarn('purgeCacheForPage', 'Cache purge request failed', error);
  }
}

/**
 * Client-side helper for triggering server-side site-wide cache purging
 * when site metadata is updated.
 */
export async function purgeCacheForSite(siteKey: string): Promise<void> {
  try {
    const { authedPost } = await import('../apiClient');

    logDebug('purgeCacheForSite', 'Requesting site-wide cache purge', {
      siteKey,
    });

    const response = await authedPost('/api/cache/purge-site', {
      siteKey,
    });

    if (response.ok) {
      const result = await response.json();
      logDebug('purgeCacheForSite', 'Site-wide cache purge successful', result);
    } else {
      logWarn('purgeCacheForSite', 'Site-wide cache purge failed', {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    // Don't throw - cache purging is a best-effort optimization
    // Site updates should continue even if cache purging fails
    logWarn('purgeCacheForSite', 'Site-wide cache purge request failed', error);
  }
}
