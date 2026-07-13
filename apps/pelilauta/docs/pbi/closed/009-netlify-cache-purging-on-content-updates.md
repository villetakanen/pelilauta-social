# PBI-009: Netlify Cache Purging on Page Content Updates

## Overview
Implement automatic Netlify cache purging whenever page content is updated. This ensures users always see the latest content without manual cache invalidation, improving user experience and content freshness.

## Problem Statement

### Current Caching Issues
- **Stale Content**: Users may see outdated page content due to CDN caching
- **Manual Invalidation**: No automatic cache purging when content is updated
- **Site-wide Impact**: Homepage updates should trigger broader cache invalidation
- **Performance vs Freshness**: Need to balance fast loading with content accuracy

### Business Impact
- Content editors see immediate changes reflected to users
- Better user experience with always-fresh content
- Maintains performance benefits of CDN caching

## Technical Requirements

### 1. Cache Tag Implementation
- **Tag Content**: Add `Cache-Tag` headers to page responses with unique identifiers
- **Homepage Tagging**: Special handling for homepage content that affects site-wide cache
- **Site Context**: Tag content with both page-specific and site-specific identifiers

### 2. Automatic Purge Triggers
- **Content Updates**: Purge cache when page content is modified
- **Homepage Special Case**: Purge site-wide cache when homepage content changes
- **Real-time Purging**: Immediate cache invalidation on content save

### 3. Netlify API Integration
- **Purge API**: Integrate with Netlify's cache purge API
- **Authentication**: Secure API access with proper credentials
- **Error Handling**: Graceful handling of purge failures

## Proposed Solution

### 1. Cache Tagging Infrastructure

#### A. Implement Cache-Tag Headers in SSR Pages
```typescript
// src/pages/sites/[siteKey]/[pageKey]/index.astro
---
import { getSiteData, getPageData } from '@firebase/server/sites';

const { siteKey, pageKey } = Astro.params;

// Direct Firebase access for SSR - no API calls
const [site, page] = await Promise.all([
  getSiteData(siteKey),
  getPageData(siteKey, pageKey, Astro.url)
]);

if (!site || !page) {
  return Astro.redirect('/404');
}

// Generate cache tags
const cacheTag = `page-${siteKey}-${pageKey}`;
const siteCacheTag = `site-${siteKey}`;

// Special handling for homepage
const isHomepage = pageKey === site.homepage;
const tags = [cacheTag, siteCacheTag];
if (isHomepage) {
  tags.push(`homepage-${siteKey}`);
}

// Add cache tags to SSR response
Astro.response.headers.set('Cache-Tag', tags.join(','));
Astro.response.headers.set('Cache-Control', 
  isHomepage 
    ? 's-maxage=60, stale-while-revalidate=300'  // Shorter cache for homepage
    : 's-maxage=300, stale-while-revalidate=1800'
);
---
```

#### B. Site Homepage Cache Tagging
```typescript
// src/pages/sites/[siteKey]/index.astro
---
import { getSiteData, getPageData } from '@firebase/server/sites';

const { siteKey } = Astro.params;
const siteKeyParam = siteKey || 'mekanismi';

// Direct Firebase access - no API waterfall
const [site, page] = await Promise.all([
  getSiteData(siteKeyParam),
  getPageData(siteKeyParam, site?.homepage || siteKeyParam, Astro.url)
]);

if (!site || !page) {
  return Astro.redirect('/404');
}

// Cache tags for site homepage
const cacheTag = `page-${siteKeyParam}-${site.homepage}`;
const siteCacheTag = `site-${siteKeyParam}`;
const homepageCacheTag = `homepage-${siteKeyParam}`;

Astro.response.headers.set('Cache-Tag', `${cacheTag},${siteCacheTag},${homepageCacheTag}`);
Astro.response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
---
```

### 2. Cache Purging Service

#### A. Netlify Purge API Client
```typescript
// src/lib/server/netlify-cache.ts
interface PurgeOptions {
  tags?: string[];
  urls?: string[];
}

export class NetlifyCachePurger {
  private readonly siteId: string;
  private readonly apiToken: string;
  
  constructor() {
    this.siteId = import.meta.env.NETLIFY_SITE_ID;
    this.apiToken = import.meta.env.NETLIFY_PURGE_TOKEN;
    
    if (!this.siteId || !this.apiToken) {
      throw new Error('Netlify configuration missing');
    }
  }

  async purgeTags(tags: string[]): Promise<boolean> {
    try {
      const response = await fetch(`https://api.netlify.com/api/v1/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          site_id: this.siteId,
          tags,
        }),
      });

      if (!response.ok) {
        logError('NetlifyCachePurger', 'Failed to purge cache:', await response.text());
        return false;
      }

      logDebug('NetlifyCachePurger', 'Successfully purged cache for tags:', tags);
      return true;
    } catch (error) {
      logError('NetlifyCachePurger', 'Cache purge error:', error);
      return false;
    }
  }

  async purgeUrls(urls: string[]): Promise<boolean> {
    try {
      const response = await fetch(`https://api.netlify.com/api/v1/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          site_id: this.siteId,
          files: urls,
        }),
      });

      if (!response.ok) {
        logError('NetlifyCachePurger', 'Failed to purge URLs:', await response.text());
        return false;
      }

      logDebug('NetlifyCachePurger', 'Successfully purged cache for URLs:', urls);
      return true;
    } catch (error) {
      logError('NetlifyCachePurger', 'URL purge error:', error);
      return false;
    }
  }

  // Helper method for page updates
  async purgePageCache(siteKey: string, pageKey: string, isHomepage: boolean = false): Promise<boolean> {
    const tags = [`page-${siteKey}-${pageKey}`, `site-${siteKey}`];
    
    if (isHomepage) {
      tags.push(`homepage-${siteKey}`);
      // Also purge the site root URL
      await this.purgeUrls([`/sites/${siteKey}/`]);
    }
    
    return this.purgeTags(tags);
  }
}
```

### 3. Content Update Hooks

#### A. Firestore Trigger Function
```typescript
// src/lib/server/content-hooks.ts
import { NetlifyCachePurger } from './netlify-cache';

export async function handlePageUpdate(
  siteKey: string,
  pageKey: string,
  site: Site
): Promise<void> {
  const purger = new NetlifyCachePurger();
  
  try {
    const isHomepage = pageKey === site.homepage;
    await purger.purgePageCache(siteKey, pageKey, isHomepage);
    
    logDebug('handlePageUpdate', 'Cache purged for page:', { siteKey, pageKey, isHomepage });
  } catch (error) {
    logError('handlePageUpdate', 'Failed to purge cache:', error);
    // Don't fail the page update if cache purging fails
  }
}
```

#### B. Content Update API Integration
```typescript
// src/pages/api/sites/[siteKey]/pages/[pageKey]/index.ts
export async function PUT({ params, request }: APIContext): Promise<Response> {
  const { siteKey, pageKey } = params;
  const uid = await tokenToUid(request);
  
  if (!uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Update page content in Firestore
    const updatedPage = await updatePageContent(siteKey, pageKey, updateData, uid);
    
    // Get site data for homepage check
    const site = await getSiteData(siteKey);
    
    // Trigger cache purge for the SSR page routes
    if (site) {
      await handlePageUpdate(siteKey, pageKey, site);
    }
    
    return new Response(JSON.stringify(updatedPage), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('PUT /api/sites/[siteKey]/pages/[pageKey]', 'Update failed:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

#### C. Cache Purging for SSR Routes
```typescript
// src/lib/server/content-hooks.ts
import { NetlifyCachePurger } from './netlify-cache';

export async function handlePageUpdate(
  siteKey: string,
  pageKey: string,
  site: Site
): Promise<void> {
  const purger = new NetlifyCachePurger();
  
  try {
    const isHomepage = pageKey === site.homepage;
    
    // Purge cache tags for the SSR routes
    const tags = [`page-${siteKey}-${pageKey}`, `site-${siteKey}`];
    if (isHomepage) {
      tags.push(`homepage-${siteKey}`);
    }
    
    await purger.purgeTags(tags);
    
    // Also purge specific URLs for immediate effect
    const urlsToPurge = [`/sites/${siteKey}/${pageKey}/`];
    if (isHomepage) {
      urlsToPurge.push(`/sites/${siteKey}/`); // Site homepage route
    }
    
    await purger.purgeUrls(urlsToPurge);
    
    logDebug('handlePageUpdate', 'Cache purged for SSR routes:', { 
      siteKey, 
      pageKey, 
      isHomepage,
      tags,
      urls: urlsToPurge 
    });
  } catch (error) {
    logError('handlePageUpdate', 'Failed to purge cache:', error);
    // Don't fail the page update if cache purging fails
  }
}
```

### 4. Environment Configuration

#### A. Netlify Environment Variables
```bash
# Add to Netlify environment variables
NETLIFY_SITE_ID=your-netlify-site-id
NETLIFY_PURGE_TOKEN=your-netlify-api-token
```

#### B. Development Environment
```typescript
// src/env.d.ts
interface ImportMetaEnv {
  readonly NETLIFY_SITE_ID: string;
  readonly NETLIFY_PURGE_TOKEN: string;
  // ... other env vars
}
```

### 5. SSR Route Cache Strategy

#### A. Page-Specific Cache Headers
```astro
<!-- src/pages/sites/[siteKey]/[pageKey]/index.astro -->
---
// Cache strategy based on content type
const isHomepage = pageKey === site.homepage;
const cacheControl = isHomepage 
  ? 's-maxage=60, stale-while-revalidate=300'    // 1min cache for homepage
  : 's-maxage=300, stale-while-revalidate=1800'; // 5min cache for regular pages

Astro.response.headers.set('Cache-Control', cacheControl);
---
```

#### B. Netlify Configuration for SSR Routes
```toml
# netlify.toml - Updated for correct route patterns
[[headers]]
  for = "/sites/*/[pageKey]/*"
  [headers.values]
    # Cache headers are set by SSR pages themselves
    # Netlify will respect these headers for CDN caching

[[headers]]
  for = "/sites/*/"
  [headers.values]
    # Site homepage routes - shorter cache for immediate updates
    Cache-Control = "s-maxage=60, stale-while-revalidate=300"
```

## Implementation Plan

### Phase 1: Cache Tagging Infrastructure (Sprint 1)
- [x] Implement cache tag headers in SSR page routes (`/sites/[siteKey]/[pageKey]/`)
- [x] Add cache tagging to site homepage route (`/sites/[siteKey]/`)
- [x] Create cache tag generation utilities for different content types
- [x] Test cache tag presence in SSR responses

### Phase 2: Purge API Integration (Sprint 1)
- [ ] Create `NetlifyCachePurger` service class
- [ ] Implement tag-based and URL-based purging for SSR routes
- [ ] Add error handling and logging
- [ ] Set up Netlify environment variables

### Phase 3: Content Update Hooks (Sprint 2)
- [ ] Integrate cache purging into page update API routes
- [ ] Add homepage detection and site-wide cache purging
- [ ] Implement URL-based purging for immediate SSR route invalidation
- [ ] Add comprehensive logging for troubleshooting

### Phase 4: Testing and Monitoring (Sprint 2)
- [ ] Create E2E tests for SSR cache purging workflow
- [ ] Test homepage vs regular page purging behavior
- [ ] Verify cache tag and URL purging effectiveness
- [ ] Add cache effectiveness metrics for SSR routes

### Phase 5: Advanced Features (Sprint 3)
- [ ] Bulk cache purging for site-wide updates
- [ ] Scheduled cache warming after purges
- [ ] Cache purging for related content (e.g., navigation updates)
- [ ] Performance optimization for high-frequency updates

## Testing Strategy

### 1. Unit Tests
- Cache tag generation logic
- Netlify API client methods  
- Error handling scenarios
- Environment configuration validation

### 2. Integration Tests
- Page update → cache purge workflow
- Homepage special handling
- API response header validation
- Purge API authentication

### 3. E2E Tests
```typescript
// e2e/cache-purging.spec.ts
test('page update triggers SSR cache purge', async ({ page }) => {
  // Update page content via API
  await updatePageContent(siteKey, pageKey, newContent);
  
  // Verify SSR route cache was purged (content immediately visible)
  await page.goto(`/sites/${siteKey}/${pageKey}/`);
  await expect(page.locator('[data-testid="page-content"]')).toContainText(newContent);
});

test('homepage update triggers site SSR cache purge', async ({ page }) => {
  // Update homepage content  
  await updatePageContent(siteKey, homepageKey, newContent);
  
  // Verify both specific page and site homepage routes were purged
  await page.goto(`/sites/${siteKey}/${homepageKey}/`);
  await expect(page.locator('[data-testid="page-content"]')).toContainText(newContent);
  
  await page.goto(`/sites/${siteKey}/`);
  await expect(page.locator('[data-testid="page-content"]')).toContainText(newContent);
});
```

## Success Metrics

### Performance Targets
- **Cache Purge Latency**: < 2 seconds from content update to cache invalidation
- **Purge Success Rate**: > 99% successful cache purges
- **Content Freshness**: Users see updated content within 30 seconds
- **API Response Time**: < 500ms for purge API calls

### User Experience Metrics
- **Content Update Visibility**: Immediate reflection of content changes
- **Cache Hit Rate**: Maintain > 80% cache hit rate despite purging
- **Page Load Performance**: No degradation in page load times
- **Editor Experience**: Seamless content editing with immediate preview

### Technical Metrics
- **Purge API Reliability**: Monitor Netlify API response rates
- **Error Rate**: < 1% purge operation failures
- **Cache Efficiency**: Balance between freshness and performance
- **Resource Usage**: Minimal impact on serverless function execution time

## Risk Assessment

### High Risk
- **Netlify API Dependency**: External service availability affects cache purging
- **Over-purging**: Too aggressive purging could impact site performance
- **Authentication Security**: API tokens need secure storage and rotation

### Medium Risk
- **Cache Tag Complexity**: Complex tagging schemes might introduce bugs
- **Error Cascading**: Cache purge failures shouldn't break content updates
- **Performance Impact**: Additional API calls on every content update

### Low Risk
- **Development Workflow**: Should not affect local development
- **Backward Compatibility**: Graceful degradation if purging fails
- **Configuration Drift**: Environment variables properly managed

## Dependencies

- **Netlify Cache API**: Access to cache purge endpoints
- **Environment Configuration**: Secure token storage and rotation
- **Content Update Workflows**: Integration with existing page editing
- **Monitoring Infrastructure**: Observability for purge operations

## Environment Variables Required

```bash
# Production
NETLIFY_SITE_ID=production-site-id
NETLIFY_PURGE_TOKEN=netlify-api-token-with-purge-permissions

# Preview/Staging  
NETLIFY_PREVIEW_SITE_ID=preview-site-id
NETLIFY_PREVIEW_PURGE_TOKEN=preview-purge-token
```

## Security Considerations

### 1. API Token Security
- Store tokens as encrypted environment variables
- Implement token rotation policy
- Limit token permissions to cache purging only
- Monitor token usage for anomalies

### 2. Purge Authorization
- Verify user authorization before triggering purges
- Prevent unauthorized cache manipulation
- Log all purge operations for audit trail
- Rate limiting for purge operations

### 3. Error Information Exposure
- Don't expose Netlify API errors to users
- Log detailed errors server-side only
- Generic error messages in API responses
- Secure handling of API credentials in logs

## Future Enhancements

### 1. Advanced Cache Management
- **Predictive Purging**: Purge related content automatically
- **Cache Warming**: Pre-populate cache after purges
- **Analytics Integration**: Track cache effectiveness metrics
- **Selective Purging**: Fine-grained control over what gets purged

### 2. Performance Optimizations
- **Batch Purging**: Combine multiple purge requests
- **Async Purging**: Non-blocking cache invalidation
- **Intelligent Scheduling**: Optimal timing for cache operations
- **CDN Integration**: Direct integration with multiple CDN providers

### 3. Content Management Integration
- **Preview Mode**: Cache handling for content previews
- **Draft Content**: Separate caching for draft vs published content
- **Version Control**: Cache purging for content rollbacks
- **Collaborative Editing**: Real-time cache management for multiple editors

## Notes

This implementation provides automatic cache invalidation while maintaining the performance benefits of CDN caching. The key innovation is **intelligent cache tagging** that allows for both granular page-level purging and site-wide invalidation when needed.

**Key Architectural Decisions:**

1. **Tag-Based Purging**: Use cache tags for efficient, targeted invalidation
2. **Homepage Special Handling**: Broader cache purging for homepage updates
3. **Graceful Degradation**: Content updates succeed even if cache purging fails
4. **Security First**: Secure API token management and access control
5. **Performance Monitoring**: Comprehensive tracking of cache purge effectiveness

The solution balances content freshness with performance, ensuring users always see up-to-date content while maintaining fast page loads through intelligent cache management.
