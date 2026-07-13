# PBI-032: Lighthouse Performance Optimization

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** 1-2 weeks  
**Created:** October 19, 2025  
**Last Updated:** October 19, 2025 (Revised for RSS API caching)  
**Dependencies:** PBI-033 (RSS Feed API Caching) - blocks RSS timeout fix

**User Story:** As a site visitor and content consumer, I want the front page and all public pages to load quickly with excellent performance scores, so that I have a smooth experience even on slower connections and the site ranks well in search engines.

---

## Problem Statement

### 🎯 Live Lighthouse Report (October 19, 2025)

**Current Production Metrics:**
- **First Contentful Paint: 0.7s** ✅ (Score: 0.98 - Excellent!)
- **Largest Contentful Paint: 1.5s** ✅ (Score: 0.79 - Good!)
- **Speed Index: 0.9s** ✅ (Score: 0.99 - Excellent!)
- **Accessibility: 84** ⚠️ (Target: 95+)
- **Best Practices: 83** ⚠️ (Target: 95+)
- **SEO: 92** ✅ (Good!)
- **PWA: 100** ✅ (Excellent!)

### ✅ What's Already Optimized
- **No render-blocking resources** - CSS/JS properly optimized
- **CSS/JS already minified** - Build process working correctly
- **Fast initial render** - FCP at 0.7s is excellent
- **Good LCP** - 1.5s is within acceptable range

### ⚠️ Key Issues Identified
1. **Page load timeout** - "The page loaded too slowly to finish within the time limit"
   - This is likely due to:
     - External RSS feed fetching (myrrys.com, roolipelitiedotus.fi)
     - Server-side rendering delays
     - Network conditions during test

2. **Accessibility gaps** (84 → 95+ target)
3. **Best practices issues** (83 → 95+ target)

### Root Cause Analysis

Based on the live production Lighthouse report, the actual bottlenecks are:

#### 1. **Page Load Timeout (Primary Issue)**
- Warning: "The page loaded too slowly to finish within the time limit"
- **Root cause:**
  - External RSS feed fetching in `SyndicateStream.astro`:
    - `myrrys.com/blog/rss.xml`
    - `roolipelitiedotus.fi/feed/`
  - These RSS fetches block server-side rendering completion
  - No timeout protection on RSS parsing
  - No caching - fetches on every page load
- **Solution:**
  - **See PBI-033: RSS Feed API Caching** for complete solution
  - Move RSS fetching to `/api/rss-feeds.json` with 10min cache + 24h SWR
  - Decouples page SSR from external service latency
  - Reduces external API calls by 86%

#### 2. **Accessibility Issues** (Current: 84, Target: 95+)
- Missing ARIA labels on interactive elements
- Possible color contrast issues
- Keyboard navigation gaps
- Form label associations

#### 3. **Best Practices Issues** (Current: 83, Target: 95+)
- Console errors/warnings
- Missing security headers (CSP, etc.)
- Possible mixed content warnings

#### ✅ **Not a Problem (Already Optimized):**
- ~~Render-blocking CSS/JS~~ - All optimized
- ~~Unminified assets~~ - Build working correctly  
- ~~Font loading~~ - Already optimized
- ~~Initial render speed~~ - FCP at 0.7s is excellent

---

## Proposed Solution

### 🎯 Focus Areas (Priority Order)

Since performance metrics are already good, focus on:
1. **Fix RSS feed timeout** (prevents page load timeout)
2. **Accessibility improvements** (84 → 95+)
3. **Best practices fixes** (83 → 95+)
4. **Minor performance optimizations** (maintain current excellent scores)

### Phase 1: Fix RSS Feed Timeout (Week 1 - Critical)

**Problem**: External RSS feeds block SSR and can hang indefinitely, causing page load timeout

**Solution**: Move RSS fetching to cached API endpoint (see **PBI-033: RSS Feed API Caching**)

**Why API caching instead of inline timeout:**
- RSS feeds update infrequently (once/day typically)
- 10-minute cache means 90%+ of visitors get instant response
- Decouples page SSR from external service availability
- Reduces external API calls by 86% (2000/day → 288/day)
- Provides stale-while-revalidate for 24 hours (always available)

**Implementation** (detailed in PBI-033):
1. Create `/api/rss-feeds.json` with parallel fetching + 3s timeout
2. Add `Cache-Control: s-maxage=600, stale-while-revalidate=86400` headers
3. Update `SyndicateStream.astro` to fetch from API
4. Test cache behavior and graceful degradation

**Expected Results:**
- ✅ TTFB < 600ms consistently (from cache)
- ✅ No more Lighthouse "page loaded too slowly" warnings
- ✅ Page loads even when external feeds are down
- ✅ 90%+ cache hit rate after warmup

**Verification:**
```bash
# Test API endpoint
curl -I https://pelilauta.social/api/rss-feeds.json
# Should show: Cache-Control: s-maxage=600, stale-while-revalidate=86400

# Run Lighthouse 5 times
pnpm lighthouse:prod
# Confirm no timeout warnings in all runs
```


**Expected Impact**: 
- Eliminate "page loaded too slowly" warning
- Consistent TTFB < 600ms
- 86% reduction in external RSS API calls
- Always available content (24h SWR)

**Note**: This phase is fully detailed in **PBI-033** - implement that PBI first.

---

### Phase 2: Accessibility Improvements (Week 2)

**Current**: 84  
**Target**: 95+

#### Issues to Fix:
1. **Missing ARIA labels**
```astro
<!-- Before -->
<cn-icon noun="fox" />
<button><cn-icon noun="add" /></button>

<!-- After -->
<cn-icon noun="fox" aria-label="Home" />
<button aria-label="Create new thread">
  <cn-icon noun="add" />
</button>
```

2. **Color contrast**
- Audit all text/background combinations
- Ensure 4.5:1 minimum contrast ratio
- Fix any low-contrast elements

3. **Keyboard navigation**
- Test all interactive elements with Tab
- Ensure proper focus indicators
- Add skip links if needed

4. **Form labels**
- Verify all inputs have associated labels
- Add aria-describedby for help text

**Testing**: Use axe DevTools or Lighthouse accessibility audit

---

### Phase 3: Best Practices Fixes (Week 2)

**Current**: 83  
**Target**: 95+

#### Security Headers (netlify.toml)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://simpleanalyticscdn.com https://browser.sentry-cdn.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
    """
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

#### Console Errors
- Review browser console for errors
- Fix any JavaScript warnings
- Remove unused imports/code

#### Deprecation Warnings
- Update dependencies if needed
- Review package.json for outdated packages

---

### Phase 4: Minor Performance Optimizations (Optional)

Since current metrics are good, these are nice-to-haves:

#### 4.1 Client Component Hydration Strategy
```astro
<!-- Current -->
<AuthManager client:only="svelte" />
<FrontpageFabs client:only="svelte" slot="fab-tray"/>

<!-- Optimized (if needed) -->
<AuthManager client:idle="svelte" />
<FrontpageFabs client:visible="svelte" slot="fab-tray"/>
```

#### 4.2 Preconnect Hints (if not already present)
```astro
<!-- BaseHead.astro -->
<link rel="preconnect" href="https://simpleanalyticscdn.com" />
<link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
<link rel="dns-prefetch" href="https://securetoken.googleapis.com" />
```

#### 4.3 Image Optimization (if LCP degrades)
```astro
<!-- Only if LCP score drops -->
<link
  rel="preload"
  as="image"
  href="/myrrys-proprietary/juno-viinikka/juno-viinikka-dragon-1-960.webp"
  media="(max-width: 960px)"
/>
```

---

## Implementation Checklist

### Phase 1: RSS Feed Timeout ⚡ (Critical - Week 1)
- [ ] Create `rssHelpers.ts` with timeout function
- [ ] Update `SyndicateStream.astro` to use helper
- [ ] Add error boundaries for failed RSS fetches
- [ ] Test with slow/failing RSS endpoints
- [ ] Verify page loads within 3 seconds consistently
- [ ] Deploy and re-run Lighthouse

### Phase 2: Accessibility 📋 (Week 2)
- [ ] Add ARIA labels to all icon-only buttons
- [ ] Audit color contrast with axe DevTools
- [ ] Fix any contrast issues found
- [ ] Test keyboard navigation (Tab through all elements)
- [ ] Add proper focus indicators where missing
- [ ] Verify form label associations
- [ ] Add skip links if needed
- [ ] Re-run Lighthouse accessibility audit
- [ ] Target: 95+ score

### Phase 3: Best Practices 🔒 (Week 2)
- [ ] Add Content Security Policy header
- [ ] Add other security headers (X-Frame-Options, etc.)
- [ ] Review and fix console errors/warnings
- [ ] Update deprecated dependencies if any
- [ ] Test CSP doesn't break existing functionality
- [ ] Re-run Lighthouse best practices audit
- [ ] Target: 95+ score

### Phase 4: Performance Maintenance (Optional)
- [ ] Consider client:idle for AuthManager
- [ ] Add preconnect hints if beneficial
- [ ] Monitor LCP stays under 2.5s
- [ ] Verify FCP stays under 1.8s
- [ ] Keep PWA score at 100

---

## Acceptance Criteria

### Performance Targets (Already Met! ✅)
- [x] **FCP: < 1.8s** (Currently 0.7s - Excellent!)
- [x] **LCP: < 2.5s** (Currently 1.5s - Good!)
- [x] **Speed Index: < 3.3s** (Currently 0.9s - Excellent!)
- [ ] **No page load timeouts** (Fix RSS feeds)
- [x] **PWA Score: 100** (Already perfect!)

### New Targets (Primary Focus)
- [ ] **Accessibility Score: 95+** (Currently 84)
- [ ] **Best Practices Score: 95+** (Currently 83)
- [ ] **SEO Score: 95+** (Currently 92 - minor improvement)
- [ ] **Page loads reliably within 3 seconds**

### Testing Requirements
- [ ] Lighthouse CI passing with 95+ on all metrics
- [ ] Manual accessibility testing with screen reader
- [ ] Keyboard navigation testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] RSS feed failure scenarios tested

---

## Success Metrics

### Before (Current)
- FCP: 0.7s ✅
- LCP: 1.5s ✅
- Speed Index: 0.9s ✅
- Accessibility: 84 ⚠️
- Best Practices: 83 ⚠️
- SEO: 92 ✅
- PWA: 100 ✅
- **Issue**: Page load timeout

### After (Target)
- **FCP: 0.7s** (maintain)
- **LCP: 1.5s** (maintain)
- **Speed Index: 0.9s** (maintain)
- **Accessibility: 95+** (+11 points)
- **Best Practices: 95+** (+12 points)
- **SEO: 95+** (+3 points)
- **PWA: 100** (maintain)
- **No page load timeouts** ✅

### User Experience Improvements
- Reliable page loads (no timeouts)
- Better accessibility for screen readers and keyboard users
- Improved security posture
- Maintained excellent performance metrics

---

```astro
<!-- BaseHead.astro -->
<head>
  <!-- Preload critical font -->
  <link 
    rel="preload" 
    href="/fonts/lato-v24-latin-regular.woff2" 
    as="font" 
    type="font/woff2" 
    crossorigin
  />
  
  <!-- Inline critical font-face declarations -->
  <style>
    @font-face {
      font-family: 'Lato';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/fonts/lato-v24-latin-regular.woff2') format('woff2');
    }
  </style>
</head>
```

**Alternative**: Remove lato-font dependency and self-host optimized fonts

#### 1.2 Defer Non-Critical Scripts
**Problem**: Sentry and analytics loaded immediately  
**Solution**: Defer monitoring scripts to after page interactive

**Note**: Cyan-lit and cyan-css must remain in head as they are critical dependencies.

```astro
<!-- BaseHead.astro -->
<head>
  <!-- Keep Cyan components in head - they are critical -->
  <script>
    import "@11thdeg/cyan-lit" // CRITICAL: Must load early
    // Only defer cn-d20-ability-score if not used above fold
  </script>
</head>

<!-- BaseTail.astro -->
<script type="module">
  // Defer Sentry to after page load
  if (document.readyState === 'complete') {
    import('@utils/client/sentry').then(({ initSentry }) => initSentry());
  } else {
    window.addEventListener('load', () => {
      import('@utils/client/sentry').then(({ initSentry }) => initSentry());
    });
  }
</script>
```

#### 1.3 Optimize Client Components
**Problem**: Heavy Svelte components load eagerly  
**Solution**: Use client:idle or client:visible directives

```astro
<!-- index.astro -->
<!-- AuthManager is essential but doesn't need immediate interactivity -->
<AuthManager client:idle="svelte" />

<!-- FrontpageFabs can wait until visible -->
<FrontpageFabs client:visible="svelte" slot="fab-tray"/>
```

#### 1.4 Add Missing Preconnects
**Problem**: Third-party origins not preconnected  
**Solution**: Add preconnect hints

```astro
<!-- BaseHead.astro -->
<link rel="preconnect" href="https://firebasestorage.googleapis.com" />
<link rel="preconnect" href="https://simpleanalyticscdn.com" />
<link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
<link rel="dns-prefetch" href="https://securetoken.googleapis.com" />
```

**Expected Impact**: +10-15 Performance score

---

### Phase 2: Server-Side Optimization (Week 2)

#### 2.1 Consolidate API Calls
**Problem**: Multiple API calls extend TTFB  
**Solution**: Create single aggregated endpoint for front page

```typescript
// src/pages/api/frontpage.json.ts
export async function GET() {
  // Fetch in parallel
  const [threads, channels, sites] = await Promise.all([
    getThreads({ limit: 5 }),
    getChannels(),
    getTopSites({ limit: 5 })
  ]);
  
  return new Response(JSON.stringify({
    threads,
    channels,
    sites
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
}
```

```astro
<!-- index.astro -->
---
const response = await fetch(`${Astro.url.origin}/api/frontpage.json`);
const { threads, channels, sites } = await response.json();
---

<TopThreadsStream {threads} {channels} />
<TopSitesStream {sites} />
```

#### 2.2 Cache Control Harmonization
**Problem**: Conflicting cache headers between Astro and Netlify  
**Solution**: Remove Astro cache headers, rely on Netlify config

```astro
<!-- index.astro -->
---
// Remove this:
// Astro.response.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate');
// Let Netlify handle it via netlify.toml
---
```

**Verify**: Ensure `netlify.toml` has optimal front page cache

#### 2.3 RSS Feed Timeout Protection
**Problem**: External RSS feeds can hang server rendering  
**Solution**: Add timeout and error handling

```typescript
// src/utils/rssHelpers.ts
export async function parseRSSWithTimeout(url: string, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const parser = new Parser({ timeout: timeoutMs });
    const feed = await parser.parseURL(url);
    clearTimeout(timeout);
    return feed;
  } catch (error) {
    clearTimeout(timeout);
    logError('RSS Parse Timeout', error);
    return null;
  }
}
```

```astro
<!-- SyndicateStream.astro -->
---
const feed = await parseRSSWithTimeout('https://www.myrrys.com/blog/rss.xml', 2000);
const posts = feed ? feed.items.slice(0, 3) : [];
---
```

#### 2.4 Consider Edge vs. Serverless
**Problem**: `edgeMiddleware: true` may add latency  
**Solution**: Benchmark with/without edge middleware

```typescript
// astro.config.mjs
adapter: netlify({
  edgeMiddleware: false, // Test performance impact
}),
```

**Expected Impact**: +15-20 Performance score

---

### Phase 3: Bundle Optimization & Code Splitting (Week 3)

**Note**: Cyan CSS and Cyan Lit are critical dependencies and cannot be deferred or split. Focus on optimizing their delivery and reducing other bundle sizes.

#### 3.1 Optimize Cyan CSS Delivery
**Problem**: Large Cyan CSS bundle must load upfront (necessary)  
**Solution**: Optimize delivery, not loading strategy

```astro
<!-- BaseHead.astro -->
<!-- Keep Cyan CSS in head - it's critical for initial render -->
<link rel="preload" href="/@11thdeg/cyan-css" as="style" />
<style>
  @import '@11thdeg/cyan-css';
</style>

<!-- Alternative: Ensure Cyan CSS is minified and compressed by build -->
<!-- The bundle size is unavoidable, but can be optimized with: -->
<!-- - Gzip/Brotli compression (Netlify handles this) -->
<!-- - HTTP/2 push (if beneficial) -->
<!-- - CDN caching (long-term cache for versioned CSS) -->
```

#### 3.2 Code Splitting for Firebase
**Problem**: Large Firebase bundle loaded upfront  
**Solution**: Dynamic imports for auth

```typescript
// src/stores/session.ts
import { atom } from 'nanostores';

export const uid = persistentAtom<string>('uid', '');
export const authUser = atom<User | null>(null);

// Lazy load Firebase Auth
let authInstance: Auth | null = null;

export async function getAuth() {
  if (!authInstance) {
    const { auth } = await import('@firebase/client');
    authInstance = auth;
  }
  return authInstance;
}
```

```svelte
<!-- AuthManager.svelte -->
<script lang="ts">
import { getAuth } from '@stores/session';
import { onMount } from 'svelte';

onMount(async () => {
  if (typeof window === 'undefined') return;
  
  const auth = await getAuth(); // Lazy load
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    // ... existing code
  });
  
  return () => unsubscribe();
});
</script>
```

#### 3.3 Optimize Cyan Component Loading
**Problem**: Cyan components are critical but large  
**Solution**: Keep global import but optimize delivery

**Note**: Since Cyan components are used throughout the app and in initial render, global import in BaseHead is the correct approach. Tree-shaking individual components would cause more harm than good due to:
- Components being used across all pages
- Need for custom elements to be registered before render
- Risk of FOUC (Flash of Unstyled Content)

**Instead, focus on:**
- Ensure Vite is properly bundling and minifying Cyan Lit
- Verify components are tree-shaken at the Cyan package level
- Monitor Cyan package updates for performance improvements
- Work with Cyan maintainers if bundle size is excessive

```typescript
// Verify in astro.config.mjs that Vite optimizations are applied
vite: {
  build: {
    minify: 'esbuild',
    cssMinify: true,
  },
}
```

**Expected Impact**: +5-8 Performance score (through other optimizations in this phase)

---

### Phase 4: Image & Media Optimization (Week 4)

#### 4.1 Responsive Images with Astro Image
**Problem**: Large background image loaded for all devices  
**Solution**: Use Astro's built-in image optimization

```astro
---
import { Image } from 'astro:assets';
import dragonImage from '/myrrys-proprietary/juno-viinikka/juno-viinikka-dragon-1.webp';
---

<Image
  src={dragonImage}
  alt="Dragon background by Juno Viinikka"
  widths={[640, 960, 1280, 1920]}
  sizes="100vw"
  loading="eager"
  fetchpriority="high"
  format="avif"
  fallbackFormat="webp"
/>
```

#### 4.2 Lazy Load Below-Fold Images
**Problem**: All images loaded immediately  
**Solution**: Add loading="lazy" to non-critical images

```astro
<!-- In TopThreadsStream, SyndicateStream, etc. -->
<img 
  src={thread.imageURL} 
  alt={thread.title}
  loading="lazy"
  decoding="async"
/>
```

#### 4.3 Preload Hero Image
**Problem**: LCP image not prioritized  
**Solution**: Add preload for above-fold images

```astro
<!-- BaseHead.astro or index.astro -->
<link
  rel="preload"
  as="image"
  href="/myrrys-proprietary/juno-viinikka/juno-viinikka-dragon-1-960.webp"
  media="(max-width: 960px)"
/>
<link
  rel="preload"
  as="image"
  href="/myrrys-proprietary/juno-viinikka/juno-viinikka-dragon-1.webp"
  media="(min-width: 961px)"
/>
```

**Expected Impact**: +5-10 Performance score

---

### Phase 5: Accessibility & Best Practices (Week 5)

#### 5.1 Accessibility Improvements

**Issues to Fix:**
- Missing ARIA labels on icon-only buttons
- Color contrast issues (need audit)
- Missing alt text on decorative images
- Keyboard navigation gaps

```astro
<!-- Example fixes -->
<cn-icon noun="fox" aria-label="Home" />
<button aria-label="Create new thread">
  <cn-icon noun="add" />
</button>
<img src="..." alt="" role="presentation" /> <!-- Decorative -->
```

#### 5.2 Best Practices Fixes

**Issues to Fix:**
- Mixed HTTP/HTTPS content warnings
- Missing Content Security Policy
- Deprecation warnings from dependencies
- Console errors/warnings

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://simpleanalyticscdn.com; ..."
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**Expected Impact**: +10-15 combined score

---

## Implementation Checklist

### Phase 1: Quick Wins ⚡
- [ ] Self-host Lato fonts with font-display: swap
- [ ] Add preload for critical fonts
- [ ] Defer Sentry initialization to window.load (keep Cyan in head)
- [ ] Change AuthManager to `client:idle`
- [ ] Change FrontpageFabs to `client:visible`
- [ ] Add preconnect for simpleanalyticscdn.com
- [ ] Add dns-prefetch for Firebase Auth domains
- [ ] Verify Cyan CSS/Lit are properly minified
- [ ] Test and measure improvements

### Phase 2: Server-Side Optimization 🚀
- [ ] Create `/api/frontpage.json` aggregated endpoint
- [ ] Refactor TopThreadsStream to accept props
- [ ] Refactor TopSitesStream to accept props
- [ ] Remove Astro cache headers from index.astro
- [ ] Implement RSS feed timeout protection
- [ ] Add error boundaries for external feeds
- [ ] Benchmark edgeMiddleware: false vs true
- [ ] Optimize parallel API calls
- [ ] Test and measure improvements

### Phase 3: Bundle Optimization & Code Splitting 📦
- [ ] Verify Cyan CSS compression and minification
- [ ] Add preload hints for Cyan CSS if beneficial
- [ ] Implement lazy Firebase Auth loading
- [ ] Optimize Vite build configuration for Cyan packages
- [ ] Analyze bundle with rollup visualizer
- [ ] Identify non-critical JS that can be deferred (not Cyan)
- [ ] Review Cyan package bundle size (report to maintainers if excessive)
- [ ] Test and measure improvements

### Phase 4: Image Optimization 🖼️
- [ ] Convert BackgroundPoster to use Astro Image
- [ ] Generate AVIF format images
- [ ] Add responsive images with srcset
- [ ] Preload hero image
- [ ] Add loading="lazy" to below-fold images
- [ ] Add fetchpriority="high" to LCP image
- [ ] Optimize image compression
- [ ] Test and measure improvements

### Phase 5: Accessibility & Best Practices ♿
- [ ] Audit and fix color contrast issues
- [ ] Add ARIA labels to icon buttons
- [ ] Fix keyboard navigation issues
- [ ] Add alt text to all images (or role="presentation")
- [ ] Implement Content Security Policy
- [ ] Fix mixed content warnings
- [ ] Update dependencies with deprecation warnings
- [ ] Resolve console errors/warnings
- [ ] Test and measure improvements

---

## Acceptance Criteria

### Performance Targets
- [ ] **Performance Score: 90+** (currently 54)
- [ ] **Accessibility Score: 95+** (currently 84)
- [ ] **Best Practices Score: 95+** (currently 83)
- [ ] **SEO Score: 95+** (currently 92)
- [ ] **PWA Score: 100** (maintain current)

### Core Web Vitals
- [ ] **LCP (Largest Contentful Paint): < 2.5s** (target < 2.0s)
- [ ] **FID (First Input Delay): < 100ms** (target < 50ms)
- [ ] **CLS (Cumulative Layout Shift): < 0.1** (target < 0.05)
- [ ] **TTFB (Time to First Byte): < 600ms** (target < 400ms)
- [ ] **FCP (First Contentful Paint): < 1.8s** (target < 1.5s)

### Bundle Size Targets
- [ ] **Total JS Bundle: < 150KB gzipped** (measure baseline first)
- [ ] **Critical CSS: < 20KB inlined**
- [ ] **Initial Page Weight: < 500KB**
- [ ] **Time to Interactive: < 3.5s**

### Testing Requirements
- [ ] Lighthouse CI integrated into deployment pipeline
- [ ] Performance budgets configured
- [ ] Automated performance regression tests
- [ ] Manual testing on 3G connection
- [ ] Manual testing on low-end mobile device
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Documentation
- [ ] Performance optimization guide created
- [ ] Bundle analysis documentation
- [ ] Image optimization guidelines
- [ ] Caching strategy documented
- [ ] Performance monitoring setup guide

---

## Success Metrics

### Before (Baseline)
- Performance: 54
- Accessibility: 84
- Best Practices: 83
- SEO: 92
- PWA: 100

### After (Target)
- **Performance: 90+** (+36 points)
- **Accessibility: 95+** (+11 points)
- **Best Practices: 95+** (+12 points)
- **SEO: 95+** (+3 points)
- **PWA: 100** (maintained)

### User Experience Improvements
- 40% faster page load time
- 50% reduction in time to interactive
- Improved mobile experience
- Better search engine rankings
- Reduced bounce rate
- Higher user engagement

---

## Technical Debt & Considerations

### Performance Monitoring
- **Lighthouse CI**: Integrate into GitHub Actions
- **Real User Monitoring**: Consider Sentry Performance or similar
- **Core Web Vitals**: Monitor via Google Search Console
- **Bundle Analysis**: Regular audits with rollup-plugin-visualizer

### Trade-offs
- **Cache Duration**: Longer cache = stale content risk
- **Code Splitting**: More chunks = more HTTP requests (NOT applicable to Cyan - must stay monolithic)
- **Image Formats**: AVIF/WebP support vs fallbacks
- **Edge Middleware**: Performance vs functionality
- **Cyan Bundle Size**: Critical dependency trade-off - design system completeness vs bundle size

### Future Optimizations (Out of Scope)
- HTTP/3 and QUIC protocol
- Service Worker caching strategies
- Static site generation for front page
- GraphQL federation for API consolidation
- CDN edge caching strategies
- Database query optimization
- Serverless function cold start optimization

---

## Dependencies

- **Astro 5.14.1+**: Latest features for image optimization
- **@11thdeg/cyan-css 4.0.0-beta.35**: May need performance improvements
- **Netlify**: CDN and edge function capabilities
- **Vite**: Build optimization and code splitting
- **rollup-plugin-visualizer**: Bundle analysis

---

## Related PBIs

- **PBI-024**: SEO Optimization (complementary)
- **Future PBI**: Static Site Generation Strategy
- **Future PBI**: Database Query Optimization
- **Future PBI**: CDN and Caching Architecture

---

## Testing Strategy

### Automated Testing
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('front page meets performance targets', async ({ page }) => {
  const response = await page.goto('/');
  
  // TTFB target
  expect(response.timing().responseStart).toBeLessThan(600);
  
  // Run Lighthouse
  const lighthouse = await page.lighthouse();
  expect(lighthouse.performance).toBeGreaterThan(90);
  expect(lighthouse.accessibility).toBeGreaterThan(95);
  expect(lighthouse.bestPractices).toBeGreaterThan(95);
  expect(lighthouse.seo).toBeGreaterThan(95);
});
```

### Manual Testing Checklist
- [ ] Test on 3G connection (DevTools throttling)
- [ ] Test on low-end device (CPU 4x slowdown)
- [ ] Visual regression testing
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Cross-browser testing (4 major browsers)

### Performance Budget
```json
{
  "budget": [
    {
      "path": "/",
      "resourceSizes": [
        { "resourceType": "script", "budget": 150 },
        { "resourceType": "stylesheet", "budget": 50 },
        { "resourceType": "image", "budget": 200 },
        { "resourceType": "document", "budget": 50 },
        { "resourceType": "total", "budget": 500 }
      ],
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1500 },
        { "metric": "largest-contentful-paint", "budget": 2000 },
        { "metric": "interactive", "budget": 3500 }
      ]
    }
  ]
}
```

---

## Related PBIs

- **PBI-033**: RSS Feed API Caching (dependency - must implement first)
- **Future**: Accessibility audit automation with axe-core in CI/CD
- **Future**: Real User Monitoring (RUM) integration for production metrics

---

## Notes

- Performance optimization is iterative - measure after each phase
- Prioritize user-facing improvements over score chasing
- Monitor real-world metrics, not just synthetic tests
- Balance performance with maintainability
- **CRITICAL**: Cyan CSS and Cyan Lit cannot be deferred - they are core dependencies
  - Accept their bundle size as necessary cost of design system
  - Focus on optimizing delivery (compression, caching) not loading strategy
  - Work with Cyan maintainers if bundle becomes excessive
- **RSS Feed Strategy**: API-level caching is superior to inline timeouts
  - 10-minute cache provides instant response for 90%+ of visitors
  - Stale-while-revalidate ensures content always available
  - Decouples page SSR from external service reliability
- Some improvements may require Cyan Design System updates
- Consider creating performance regression tests in CI/CD
- Document all optimizations for team knowledge sharing

---

## Rollback Plan

If performance changes cause regressions:

1. **Identify Issue**: Use Lighthouse reports to pinpoint regression
2. **Git Revert**: Roll back specific commits
3. **Feature Flags**: Toggle optimizations off if needed
4. **Gradual Rollout**: Deploy to staging first, A/B test
5. **Monitoring**: Watch real user metrics closely

Each phase should be independently deployable and reversible.
