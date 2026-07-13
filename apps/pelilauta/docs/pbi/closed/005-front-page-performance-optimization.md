# PBI-005: Front Page Performance and Caching Optimization

## Overview
Optimize the front page (`/`) performance on Netlify deployment with focus on reducing initial load times, implementing smart caching strategies, and improving Core Web Vitals metrics.

## Current Analysis

### Current Front Page Architecture
- **SSR Strategy**: Server-side rendered with Astro + progressive enhancement
- **Data Sources**: 
  - `/api/threads.json?limit=5` - Recent threads (Firestore)
  - `/api/sites?limit=5` - Top sites (Firestore) 
  - `/api/meta/channels.json` - Channel metadata (Firestore)
  - External RSS feeds: `myrrys.com` and `roolipelitiedotus.fi`
- **Current Cache Headers**: `s-maxage=1, stale-while-revalidate` (very short)

### Performance Issues Identified
1. **Multiple API Calls**: 3 internal API calls + 2 external RSS feeds per page load
2. **External Dependencies**: RSS parsing adds latency
3. **Cache Strategy**: Very aggressive cache invalidation (1 second)
4. **Firebase Bundle Size**: Large Firebase SDK chunks (310kB+)
5. **Firestore Queries**: Multiple database calls without optimization

### Current Build Output Analysis
- **Total Bundle Size**: 4.8 MB precached assets
- **Largest Chunks**:
  - `EditorHead.astro_astro_type_script_index_0_lang.k7547PIm.js` - 551kB (⚠️ **Editor-only**: Contains `@11thdeg/cn-editor`, not loaded on front page)
  - `index.esm.DTMIukKP.js` - 310kB (likely Firebase SDK)
  - `index.esm.BwfyFohU.js` - 127kB
  - `SiteDataApp.bOydAiiB.js` - 104kB
- **Front Page Bundle**: Uses `BaseHead.astro` (smaller, only loads `@11thdeg/cyan-lit`)

## Optimization Strategy

### 1. Implement Multi-Tiered Caching Strategy

#### A. Edge Caching on Netlify
```toml
# netlify.toml additions
[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "s-maxage=300, stale-while-revalidate=1800"
    # 5 min cache, 30 min stale-while-revalidate

[[headers]]
  for = "/api/meta/*"
  [headers.values]
    Cache-Control = "s-maxage=3600, stale-while-revalidate=86400"
    # 1 hour cache, 24 hour stale-while-revalidate for metadata

[[headers]]
  for = "/api/threads.json"
  [headers.values]
    Cache-Control = "s-maxage=60, stale-while-revalidate=300"
    # 1 min cache, 5 min stale-while-revalidate for threads

[[headers]]
  for = "/api/sites*"
  [headers.values]
    Cache-Control = "s-maxage=180, stale-while-revalidate=600"
    # 3 min cache, 10 min stale-while-revalidate for sites
```

#### B. API Response Caching
- Implement in-memory caching for API routes using Netlify's edge functions
- Cache external RSS feeds with longer TTL (30 minutes)
- Add ETag support for conditional requests

### 2. Front Page Data Optimization

#### A. Direct SSR for Core Content + Shared Libraries (Phase 3)
**Priority: High** - Eliminate unnecessary API calls for SSR content

Create shared server libraries that both SSR components and API routes can use:

```typescript
// src/lib/server/threads.ts
export async function getRecentThreads(limit: number = 5): Promise<Thread[]> {
  try {
    const threadsRef = serverDB
      .collection('threads')
      .where('public', '==', true)
      .orderBy('flowTime', 'desc')
      .limit(limit);
    
    const snapshot = await threadsRef.get();
    return snapshot.docs.map(doc => parseThread(toClientEntry(doc.data()), doc.id));
  } catch (error) {
    logError('getRecentThreads', 'Failed to fetch threads:', error);
    return [];
  }
}

// Frontend SSR: Direct Firebase access (faster)
const threads = await getRecentThreads(5);

// API routes: Use same library (consistency)
export const GET = () => getRecentThreads(limit);
```

**Benefits:**
- **Performance**: Eliminates HTTP round-trip overhead for SSR content
- **Consistency**: Shared logic between SSR components and API routes  
- **Maintainability**: Single source of truth for database queries
- **Reliability**: Fewer network dependencies for core content

#### B. Leverage Astro's server:defer for Secondary Content
#### B. Leverage Astro's server:defer for Secondary Content
Optimize each content section independently with the right loading strategy:
- **TopThreadsStream**: Direct SSR with shared library (core content, loads immediately)
- **SyndicateStream**: Uses `server:defer` with cached RSS endpoints  
- **TopSitesStream**: Direct SSR with shared library (or `server:defer` based on priority)

```astro
<!-- Optimized approach with direct SSR for core content -->
<TopThreadsStream /> <!-- Direct Firebase SSR, no API call -->

<SyndicateStream server:defer>
  <OptimizedFallback slot="fallback" />
  <ErrorBoundary slot="error" />
</SyndicateStream>

<TopSitesStream /> <!-- Direct Firebase SSR, no API call -->
```

**Benefits:**
- Core content (threads) loads immediately
- Secondary content loads progressively without blocking
- Individual sections can fail without affecting others
- Simpler architecture than consolidated APIs

#### B. Database Query Optimization
- Batch Firestore queries where possible
- Implement database-level caching for frequently accessed data
- Use Firestore composite indexes for optimized queries

### 3. Bundle Size Optimization

#### A. Firebase SDK Optimization (Priority: High)
Target the largest bundles affecting front page performance:
```javascript
// Current: Static imports cause large bundles
// Target: index.esm.DTMIukKP.js (310kB) and related Firebase chunks

// Implement more granular Firebase imports
const getFirebaseAuth = () => import('firebase/auth');
const getFirestore = () => import('firebase/firestore');
```

#### B. Dynamic Import Strategy  
- Move non-critical Svelte components to dynamic imports
- Defer loading of admin/authentication functionality until needed
- Optimize `FrontpageFabs.svelte` loading strategy

#### C. Remove Unused Code
- Audit and tree-shake Firebase SDK imports
- Optimize CSS delivery (critical CSS inline)
- Remove unused dependencies from front page bundle

### 4. Progressive Enhancement Strategy

#### A. Core Content First
- Ensure core content (threads, sites) loads immediately
- Progressive enhancement for interactive features
- Graceful degradation for failed API calls

#### B. Optimize Deferred Components
```astro
<!-- Current approach -->
<SyndicateStream server:defer>
  <DeferredSection class="column-s" slot="fallback" />
</SyndicateStream>

<!-- Enhanced approach with timeout -->
<SyndicateStream server:defer timeout="2000">
  <OptimizedFallback slot="fallback" />
  <ErrorBoundary slot="error" />
</SyndicateStream>
```

### 5. External Content Strategy via Netlify API Caching

#### A. RSS Feed Caching via API Routes
Create a single, flexible endpoint for external RSS feeds with whitelist security:
- `/api/external/rss/[feedKey].json` - Generic cached RSS endpoint with feed key validation

**Benefits:**
- **Performance**: Eliminates external latency (500ms-2s+ → <100ms)
- **Reliability**: External site downtime won't break front page
- **Global CDN**: Netlify edge locations serve cached responses worldwide
- **Cost Control**: Avoid external API rate limits and unpredictable costs
- **Security**: Whitelist approach prevents arbitrary external requests

**Implementation Strategy:**
```typescript
// /api/external/rss/[feedKey].json
const ALLOWED_FEEDS = {
  'myrrys': 'https://www.myrrys.com/blog/rss.xml',
  'roolipelitiedotus': 'https://roolipelitiedotus.fi/feed/'
} as const;

export async function GET({ params }: APIContext) {
  const { feedKey } = params;
  
  // Security: Only allow whitelisted feeds
  if (!feedKey || !(feedKey in ALLOWED_FEEDS)) {
    return new Response('Feed not allowed', { status: 403 });
  }

  try {
    // Check cache first
    const cached = await getCachedRSSData(feedKey, 30 * 60); // 30 min TTL
    if (cached) return cached;

    // Fetch fresh data
    const parser = new Parser();
    const feed = await parser.parseURL(ALLOWED_FEEDS[feedKey]);
    const posts = feed.items.slice(0, 3);

    // Cache the response
    await setCachedRSSData(feedKey, posts);

    return new Response(JSON.stringify(posts), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    // Return cached fallback or empty array
    const fallback = await getCachedRSSData(feedKey, 24 * 60 * 60);
    return new Response(JSON.stringify(fallback || []), { status: 200 });
  }
}
```

#### B. Image Optimization
- Implement responsive images with proper sizing
- Add WebP/AVIF format support
- Lazy load non-critical images

## Implementation Plan

### Phase 1: Caching Infrastructure (Sprint 1) ✅
- [x] Update `netlify.toml` with optimized cache headers
- [x] Implement ETag support in API routes
- [x] Add cache warming for critical endpoints
- [x] Monitor cache hit rates

### Phase 2: External Content Caching (Sprint 1-2) 🚧
- [x] Create `/api/external/rss/[feedKey].json` - Single DRY endpoint with whitelist
- [ ] Implement Netlify Blob storage for RSS cache persistence
- [x] Add fallback mechanisms for external failures
- [ ] Update `SyndicateStream.astro` to use cached endpoints (`/api/external/rss/myrrys.json`, `/api/external/rss/roolipelitiedotus.json`)
- [ ] Optimize `server:defer` loading with proper timeouts and error boundaries

### Phase 3: Direct SSR + Shared Libraries (Sprint 2)
- [ ] Create shared server libraries for data fetching (`src/lib/server/threads.ts`, `sites.ts`, `channels.ts`)
- [ ] Update `TopThreadsStream.astro` to use direct Firebase SSR instead of API calls
- [ ] Update `TopSitesStream.astro` to use direct Firebase SSR instead of API calls  
- [ ] Refactor API routes to use shared libraries for consistency
- [ ] Optimize database queries and add proper indexing
- [ ] Add comprehensive error handling and logging to shared libraries

### Phase 4: Bundle Optimization (Sprint 2)
- [ ] Optimize Firebase SDK imports (target 310kB+ chunks)
- [ ] Implement dynamic imports for non-critical Svelte components
- [ ] Audit and remove unused dependencies from front page bundle
- [ ] Optimize `FrontpageFabs.svelte` loading strategy

### Phase 5: Progressive Enhancement (Sprint 2-3)
- [ ] Enhance `server:defer` components with intelligent loading strategies
- [ ] Implement timeout handling for deferred content blocks
- [ ] Add performance monitoring for individual content sections
- [ ] Optimize critical rendering path for core content

## Success Metrics

### Performance Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 800ms

### Technical Metrics
- **Firebase Bundle Reduction**: 30% reduction in Firebase-related chunks (target: reduce 310kB+ bundles)
- **External API Latency**: Reduce RSS fetch time from 500ms-2s to <100ms
- **Cache Hit Rate**: > 90% for external RSS content, > 80% for front page requests
- **API Reliability**: 99.9% uptime for RSS content (independent of external sites)
- **Build Time**: Maintain current build performance

### Monitoring Strategy
- Implement Lighthouse CI in build pipeline
- Add Core Web Vitals monitoring with Sentry
- Monitor cache performance via Netlify analytics
- Track bundle size changes in CI/CD

## Risk Assessment

### High Risk
- **Cache Invalidation**: Complex cache strategy might lead to stale content
- **External RSS Caching**: Need robust fallback mechanisms if both external and cached data fail

### Medium Risk  
- **Bundle Splitting**: Aggressive code splitting might increase complexity
- **Database Load**: Aggregated queries might increase Firestore costs
- **Netlify Blob Storage**: Additional dependency for RSS cache persistence

### Low Risk
- **Backward Compatibility**: Changes should be largely transparent to users
- **Development Workflow**: Minimal impact on development experience
- **RSS Content Freshness**: 30-minute cache is acceptable for syndicated content

## Technical Debt Considerations

- Remove temporary caching solutions once proper edge caching is implemented
- Refactor RSS handling to be more resilient and testable
- Consider migrating to a CDN for static assets in future

## Dependencies

- Netlify Edge Functions for advanced caching
- **Netlify Blob Storage** for persistent RSS cache storage
- Updated Astro version for better SSR optimization
- Firestore query optimization
- Bundle analyzer tools for monitoring

## Notes

This optimization focuses on the critical path for first-time visitors while maintaining the dynamic, real-time nature of the community platform. The caching strategy balances performance with content freshness, ensuring users see recent activity while benefiting from edge caching.

**Key Innovation: Single DRY External RSS Caching Endpoint**
By using a single `/api/external/rss/[feedKey].json` endpoint with whitelist validation, we achieve:
- **DRY Architecture**: Single implementation handles all external RSS feeds
- **Security**: Whitelist prevents arbitrary external requests
- **Maintainability**: Easy to add new feeds by updating the ALLOWED_FEEDS constant
- **Consistent sub-100ms response times** for syndicated content
- **99.9% uptime independent** of external site reliability  
- **Global CDN distribution** of cached RSS content
- **Graceful degradation** when external sources are unavailable

This approach transforms external dependencies from performance liabilities into cached assets served from Netlify's global edge network while maintaining security and code simplicity.
