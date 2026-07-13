/**
 * Cache tagging utilities for Netlify cache purging
 * Provides consistent cache tag generation across the application
 */

export interface CacheTagsOptions {
  siteKey: string;
  pageKey: string;
  isHomepage?: boolean;
}

/**
 * Generate cache tags for a page
 * @param options Cache tag options
 * @returns Array of cache tags for the page
 */
export function generatePageCacheTags(options: CacheTagsOptions): string[] {
  const { siteKey, pageKey, isHomepage = false } = options;

  const tags = [
    `page-${siteKey}-${pageKey}`, // Page-specific tag
    `site-${siteKey}`, // Site-wide tag
  ];

  if (isHomepage) {
    tags.push(`homepage-${siteKey}`); // Homepage-specific tag
  }

  return tags;
}

/**
 * Generate cache tags for site homepage
 * @param siteKey Site identifier
 * @param homepageKey Homepage page key
 * @returns Array of cache tags for the site homepage
 */
export function generateSiteHomepageCacheTags(
  siteKey: string,
  homepageKey: string,
): string[] {
  return generatePageCacheTags({
    siteKey,
    pageKey: homepageKey,
    isHomepage: true,
  });
}

/**
 * Set cache tag headers on Astro response
 * @param response Astro response object
 * @param tags Array of cache tags
 */
export function setCacheTagHeaders(response: Response, tags: string[]): void {
  if (tags.length > 0) {
    response.headers.set('Cache-Tag', tags.join(','));
  }
}

/**
 * Set optimized cache control headers based on content type
 * @param response Astro response object
 * @param isHomepage Whether this is homepage content (gets shorter cache)
 */
export function setCacheControlHeaders(
  response: Response,
  isHomepage: boolean = false,
): void {
  const cacheControl = isHomepage
    ? 's-maxage=60, stale-while-revalidate=300' // 1min cache for homepage
    : 's-maxage=300, stale-while-revalidate=1800'; // 5min cache for regular pages

  response.headers.set('Cache-Control', cacheControl);
}

/**
 * Apply complete cache strategy (tags + control headers) to a page response
 * @param response Astro response object
 * @param options Cache tag options
 */
export function applyCacheStrategy(
  response: Response,
  options: CacheTagsOptions,
): void {
  const tags = generatePageCacheTags(options);
  setCacheTagHeaders(response, tags);
  setCacheControlHeaders(response, options.isHomepage);
}
