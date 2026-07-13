/**
 * Netlify Cache Tag Generation Utilities
 *
 * Provides consistent cache tag generation for different content types
 * to enable targeted cache purging when content is updated.
 */

export interface CacheTagOptions {
  siteKey: string;
  pageKey?: string;
  isHomepage?: boolean;
  additionalTags?: string[];
}

/**
 * Generate cache tags for a page
 */
export function generatePageCacheTags(options: CacheTagOptions): string[] {
  const { siteKey, pageKey, isHomepage = false, additionalTags = [] } = options;

  const tags: string[] = [];

  // Always include site-wide tag
  tags.push(`site-${siteKey}`);

  // Add page-specific tag if pageKey is provided
  if (pageKey) {
    tags.push(`page-${siteKey}-${pageKey}`);
  }

  // Add homepage-specific tag if this is the homepage
  if (isHomepage) {
    tags.push(`homepage-${siteKey}`);
  }

  // Add any additional custom tags
  tags.push(...additionalTags);

  return tags;
}

/**
 * Generate cache tags for site homepage
 */
export function generateHomepageCacheTags(
  siteKey: string,
  pageKey: string,
): string[] {
  return generatePageCacheTags({
    siteKey,
    pageKey,
    isHomepage: true,
  });
}

/**
 * Generate cache tags for regular site page
 */
export function generateSitePageCacheTags(
  siteKey: string,
  pageKey: string,
): string[] {
  return generatePageCacheTags({
    siteKey,
    pageKey,
    isHomepage: false,
  });
}

/**
 * Generate cache control headers based on content type
 */
export function generateCacheControlHeader(
  isHomepage: boolean = false,
): string {
  if (isHomepage) {
    // Shorter cache for homepage - gets updated more frequently
    return 's-maxage=60, stale-while-revalidate=300'; // 1min cache, 5min stale
  } else {
    // Longer cache for regular pages
    return 's-maxage=300, stale-while-revalidate=1800'; // 5min cache, 30min stale
  }
}

/**
 * Set cache headers on Astro response
 */
export function setCacheHeaders(
  response: { headers: Headers },
  tags: string[],
  isHomepage: boolean = false,
): void {
  response.headers.set('Cache-Tag', tags.join(','));
  response.headers.set('Cache-Control', generateCacheControlHeader(isHomepage));
}

/**
 * Helper for setting page cache headers
 */
export function setPageCacheHeaders(
  response: { headers: Headers },
  siteKey: string,
  pageKey: string,
  isHomepage: boolean = false,
): void {
  const tags = generatePageCacheTags({
    siteKey,
    pageKey,
    isHomepage,
  });

  setCacheHeaders(response, tags, isHomepage);
}
