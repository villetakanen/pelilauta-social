# PBI-033: RSS Feed API Caching and Optimization

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** 2-3 days  
**Created:** October 19, 2025  
**Dependency:** Blocks PBI-032 (Page Load Timeout Fix)

**User Story:** As a site visitor, I want the front page to load quickly and reliably without delays from external RSS feed fetching, so that I have a consistent browsing experience regardless of third-party service availability.

---

## Problem Statement

Currently, external RSS feeds are fetched directly in the `SyndicateStream.astro` component during server-side rendering:

- **`myrrys.com/blog/rss.xml`** - Fetched on every page load
- **`roolipelitiedotus.fi/feed/`** - Fetched on every page load

### Current Issues

1. **Blocking SSR**: RSS feed fetches block server-side rendering completion
2. **No Timeout Protection**: Can hang indefinitely if feed is slow/down
3. **No Caching**: Fetches on every page load even though content updates infrequently
4. **Page Load Timeout**: Causes Lighthouse warning "The page loaded too slowly to finish within the time limit"
5. **Performance Impact**: Unnecessary latency for content that rarely changes

### Impact

- **Unreliable page loads**: External service downtime affects site
- **Poor TTFB**: Time To First Byte extended by external API calls
- **Resource waste**: Fetching same content repeatedly
- **User experience**: Slower page loads for static content

---

## Proposed Solution

Move RSS feed fetching to a dedicated API endpoint with aggressive caching:

### Architecture

```
┌─────────────────┐
│  index.astro    │
│  (Front Page)   │
└────────┬────────┘
         │ fetch('/api/rss-feeds.json')
         ▼
┌─────────────────────────────────┐
│  /api/rss-feeds.json            │
│  Cache: 10min / 24h SWR         │
├─────────────────────────────────┤
│  - Fetch RSS feeds in parallel  │
│  - Parse and transform          │
│  - Return combined JSON         │
│  - Timeout protection (3s)      │
└────────┬────────────────────────┘
         │ (only if cache miss/stale)
         ▼
┌─────────────────────────────────┐
│  External RSS Feeds             │
│  - myrrys.com/blog/rss.xml     │
│  - roolipelitiedotus.fi/feed/  │
└─────────────────────────────────┘
```

### Benefits

✅ **Fast page loads**: SSR not blocked by external calls  
✅ **Cache hits**: 10-minute cache means most visitors see instant response  
✅ **Stale-while-revalidate**: 24-hour SWR ensures content always available  
✅ **Timeout protection**: 3-second max wait for external feeds  
✅ **Graceful degradation**: If feeds fail, serve cached data or empty array  
✅ **Reduced load**: Only 1 request per 10 minutes to external services  

---

## Implementation

### 1. Create RSS Feed API Endpoint

```typescript
// src/pages/api/rss-feeds.json.ts
import Parser from 'rss-parser';
import type { APIRoute } from 'astro';
import { logError, logDebug } from '@utils/logHelpers';

const FEEDS = [
  { name: 'myrrys', url: 'https://www.myrrys.com/blog/rss.xml', limit: 3 },
  { name: 'roolipelitiedotus', url: 'https://roolipelitiedotus.fi/feed/', limit: 3 }
];

const TIMEOUT_MS = 3000; // 3 second timeout

async function fetchRSSWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const parser = new Parser({ timeout: timeoutMs });
    const feed = await parser.parseURL(url);
    clearTimeout(timeout);
    return feed;
  } catch (error) {
    clearTimeout(timeout);
    logError('RSS fetch failed', { url, error: error.message });
    return null;
  }
}

export const GET: APIRoute = async () => {
  logDebug('api/rss-feeds', 'Fetching RSS feeds');
  
  // Fetch all feeds in parallel with timeout protection
  const feedPromises = FEEDS.map(async ({ name, url, limit }) => {
    const feed = await fetchRSSWithTimeout(url, TIMEOUT_MS);
    
    if (!feed) {
      return { name, posts: [] };
    }
    
    const posts = feed.items.slice(0, limit).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet
    }));
    
    return { name, posts };
  });
  
  const results = await Promise.all(feedPromises);
  
  // Transform to object for easier consumption
  const feedData = results.reduce((acc, { name, posts }) => {
    acc[name] = posts;
    return acc;
  }, {} as Record<string, any[]>);
  
  return new Response(JSON.stringify(feedData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // 10 min cache, 24 hour stale-while-revalidate
      'Cache-Control': 's-maxage=600, stale-while-revalidate=86400'
    }
  });
};
```

### 2. Add Netlify Caching Header

```toml
# netlify.toml
[[headers]]
  for = "/api/rss-feeds.json"
  [headers.values]
    Cache-Control = "s-maxage=600, stale-while-revalidate=86400"
    # 10 min cache, 24 hour stale-while-revalidate
    # RSS feeds update infrequently, aggressive caching is safe
```

### 3. Update SyndicateStream Component

```astro
<!-- src/components/server/FrontPage/SyndicateStream/SyndicateStream.astro -->
---
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import SyndicatePost from './SyndicatePost.astro';

type RSSItem = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
};

type FeedData = {
  myrrys: RSSItem[];
  roolipelitiedotus: RSSItem[];
};

let posts: RSSItem[] = [];
let posts2: RSSItem[] = [];

try {
  // Fetch from our cached API instead of external feeds directly
  const response = await fetch(`${Astro.url.origin}/api/rss-feeds.json`);
  
  if (response.ok) {
    const feedData: FeedData = await response.json();
    posts = feedData.myrrys || [];
    posts2 = feedData.roolipelitiedotus || [];
  }
} catch (error) {
  logError('SyndicateStream', 'Failed to fetch RSS feeds', error);
}
---
<div class="column-s flex flex-col">
  <div>
    <h3 class="text-h4">
      <cn-icon noun="myrrys-scarlet"></cn-icon>
      Myrrys.com
    </h3>
    <img src="/myrrys-proprietary/letl/letl_gm_screen_splash-690.webp" alt="Myrrys logo" class="w-16-9 poster" />
    {posts.map((post: RSSItem) => <SyndicatePost post={post} /> )}

    <div class="toolbar justify-center">
      <a href="https://myrrys.com" class="text button">
        {t('actions:readMore')}
      </a>
    </div>
  </div>

  <div class="flex items-center my-2">
    <cn-icon noun="d20" large></cn-icon><br/>
  </div>

  <div>
    <h3 class="text-h5">
      <img src="https://roolipelitiedotus.fi/wp-content/uploads/2018/07/logonayte-150x150.png" class="icon">
      Roolipelitiedotus.fi
    </h3>
    {posts2.map((post) => <SyndicatePost post={post} /> )}

    <div class="toolbar justify-center">
      <a href="https://roolipelitiedotus.fi" class="text button">
        {t('actions:readMore')}
      </a>
    </div>
  </div>
</div>
```

### 4. Remove Direct RSS Parser Dependency (Optional)

Since RSS parsing now happens only in the API route, the component is simplified and doesn't need `rss-parser` directly.

---

## Testing Strategy

### Unit Tests
```typescript
// test/api/rss-feeds.test.ts
describe('/api/rss-feeds.json', () => {
  it('should return cached feed data', async () => {
    const response = await fetch('http://localhost:4321/api/rss-feeds.json');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('myrrys');
    expect(data).toHaveProperty('roolipelitiedotus');
  });

  it('should have correct cache headers', async () => {
    const response = await fetch('http://localhost:4321/api/rss-feeds.json');
    const cacheControl = response.headers.get('cache-control');
    expect(cacheControl).toContain('s-maxage=600');
    expect(cacheControl).toContain('stale-while-revalidate=86400');
  });

  it('should handle feed failures gracefully', async () => {
    // Mock RSS parser to fail
    const response = await fetch('http://localhost:4321/api/rss-feeds.json');
    const data = await response.json();
    // Should still return structure even if feeds fail
    expect(data).toHaveProperty('myrrys');
  });
});
```

### Integration Tests
- Test with slow external feeds (mock)
- Test with failing external feeds (mock)
- Verify cache headers in Netlify
- Test stale-while-revalidate behavior

### Performance Tests
- Measure TTFB before/after
- Verify no page load timeouts
- Confirm sub-3s total page load time

---

## Acceptance Criteria

### Functional
- [ ] RSS feeds fetched from `/api/rss-feeds.json`
- [ ] API returns combined feed data as JSON
- [ ] Cache headers set to 10min / 24h SWR
- [ ] Timeout protection (3s max) implemented
- [ ] Graceful degradation when feeds fail
- [ ] SyndicateStream.astro updated to use API

### Performance
- [ ] No page load timeouts in Lighthouse
- [ ] TTFB under 600ms consistently
- [ ] Total page load under 3 seconds
- [ ] Cache hit rate > 90% (after warmup)

### Reliability
- [ ] Page loads even if external feeds are down
- [ ] No 500 errors from failed feed fetches
- [ ] Stale content served when feeds timeout
- [ ] Logs errors but doesn't crash

### Documentation
- [ ] API endpoint documented
- [ ] Cache strategy explained
- [ ] Error handling documented
- [ ] SyndicateStream usage updated

---

## Rollout Strategy

### Phase 1: API Creation (Day 1)
1. Create `/api/rss-feeds.json` endpoint
2. Add tests
3. Deploy to staging
4. Verify caching works

### Phase 2: Component Update (Day 2)
1. Update SyndicateStream.astro
2. Test on staging
3. Verify no visual regressions
4. Performance test

### Phase 3: Production Deploy (Day 3)
1. Deploy to production
2. Monitor Lighthouse scores
3. Check error logs
4. Verify cache hit rates
5. Confirm no page load timeouts

---

## Success Metrics

### Before
- TTFB: Variable (500-2000ms depending on external feeds)
- Page Load: Unreliable (timeouts possible)
- Cache Hit: 0% (no caching)
- External Calls: ~1000/day to each feed

### After
- **TTFB: < 600ms** (from cache)
- **Page Load: < 3s** (consistent)
- **Cache Hit: > 90%** (after warmup)
- **External Calls: ~144/day** (every 10 min)

### Cost Savings
- **Reduced external API calls**: From ~2000/day to ~288/day (-86%)
- **Faster for users**: Instant response from cache
- **More reliable**: Not dependent on external service uptime

---

## Related PBIs

- **PBI-032**: Lighthouse Performance Optimization (depends on this)
- **Future PBI**: Client-side RSS feed widget (could reuse this API)

---

## Notes

- RSS feeds update infrequently (typically once per day)
- 10-minute cache is aggressive but safe for this use case
- 24-hour SWR ensures content always available even if feeds permanently fail
- Could add admin endpoint to manually purge cache if needed
- Consider adding feed metadata (last updated, item count) to response

---

## Rollback Plan

If issues arise:
1. Revert SyndicateStream.astro to direct RSS parsing
2. Keep API endpoint but mark as deprecated
3. Monitor for 24 hours
4. Retry deployment after fixes

The old code path can be maintained temporarily as fallback.
