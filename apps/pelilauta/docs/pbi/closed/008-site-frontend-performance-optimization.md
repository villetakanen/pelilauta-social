````markdown
# PBI-008: Site Frontend Performance and Data Synchronization Optimization

## Overview
Optimize the Site page (`/sites/[siteKey]/`) performance with focus on eliminating waterfall requests, reducing data re-parsing, and implementing a hybrid SSR + real-time subscription model for optimal user experience.

## Current Analysis

### Current Site Page Architecture
- **Route**: `/sites/[siteKey]/index.astro` 
- **Layout**: `PageWithTray.astro` (interactive layout with slide-out trays)
- **Data Flow**: 
  1. SSR fetches site data via `/api/sites/[siteKey]` (internal API call)
  2. SSR fetches homepage data via `/api/sites/[siteKey]/pages/[pageKey].json` (internal API call)  
  3. Client-side components initialize site store with SSR data
  4. Site store auto-subscribes to Firestore for real-time updates (if user authenticated)

### Performance Issues Identified

#### 1. **Double Data Parsing** (Critical)
**Root Cause**: Both API routes and SSR page parse the same data independently
```typescript
// API Route: /api/sites/[siteKey]/index.ts
const page = parseSite(toClientEntry(data), siteKey); // Parse #1

// SSR Page: /sites/[siteKey]/index.astro  
const site = parseSite(toClientEntry(await siteResponse.json()), siteKey); // Parse #2 (same data!)
```

#### 2. **Waterfall Request Pattern** (High Priority)
- SSR makes sequential API calls during page build
- Each API call adds HTTP overhead (routing, JSON serialization, parsing)
- Network latency multiplied by number of requests
- Slower TTFB and LCP metrics

#### 3. **Site Store Initialization Pattern** (Medium Priority)
Current pattern requires manual initialization in each component:
```svelte
<!-- Current: Manual store initialization in every site component -->
<script>
  import { site } from '@stores/site';
  const { site: initialSite } = $props();
  site.set(initialSite); // Manual seeding required
</script>
```

#### 4. **Firestore Subscription Inefficiency** (Medium Priority)
- Site store subscribes on every mount, even for anonymous users
- No pre-seeding with SSR data leads to flash of loading state
- Multiple components can trigger redundant subscriptions

#### 5. **Cache Strategy Inconsistency** (Low Priority)
- Site API has commented-out cache headers
- Page API explicitly disables caching (`no-store, no-cache`)
- No differentiation between static site metadata and dynamic page content

## Optimization Strategy

### 1. Eliminate Double Data Parsing with Shared Server Libraries

#### A. Create Shared Server Data Layer
**Priority: Critical** - Eliminate redundant API calls and parsing

```typescript
// src/lib/server/sites.ts
export async function getSiteData(siteKey: string): Promise<Site | null> {
  try {
    const siteDoc = await serverDB
      .collection(SITES_COLLECTION_NAME)
      .doc(siteKey)
      .get();
    
    if (!siteDoc.exists || !siteDoc.data()) {
      return null;
    }

    return parseSite(toClientEntry(siteDoc.data()), siteKey);
  } catch (error) {
    logError('getSiteData', 'Failed to fetch site:', error);
    return null;
  }
}

export async function getPageData(siteKey: string, pageKey: string, url: URL): Promise<Page | null> {
  try {
    const siteRef = serverDB.collection(SITES_COLLECTION_NAME).doc(siteKey);
    const pageRef = siteRef.collection(PAGES_COLLECTION_NAME).doc(pageKey);
    
    const [siteDoc, pageDoc] = await Promise.all([
      siteRef.get(),
      pageRef.get()
    ]);
    
    if (!siteDoc.exists || !pageDoc.exists) {
      return null;
    }

    const site = siteFrom(toClientEntry(siteDoc.data()), siteDoc.id);
    const page = parsePage(toClientEntry(pageDoc.data()), pageKey, siteKey);
    
    // Render wiki content
    page.htmlContent = await renderWikiContent(page, site, url);
    
    return page;
  } catch (error) {
    logError('getPageData', 'Failed to fetch page:', error);
    return null;
  }
}
```

#### B. Optimize SSR Page to Use Direct Firebase Access
```astro
---
// /sites/[siteKey]/index.astro - OPTIMIZED
import { getSiteData, getPageData } from '@lib/server/sites';

const { siteKey: siteKeyParam } = Astro.params;
const siteKey = siteKeyParam || 'mekanismi';

// Direct Firebase access - faster than API calls
const [site, page] = await Promise.all([
  getSiteData(siteKey),
  getPageData(siteKey, site?.homepage || siteKey, Astro.url)
]);

if (!site) {
  return Astro.redirect('/404');
}

if (!page) {
  logError(`Page ${site.homepage || siteKey} not found for site ${siteKey}`);
  return Astro.redirect('/404');
}
---
```

#### C. Update API Routes to Use Shared Libraries
```typescript
// /api/sites/[siteKey]/index.ts - OPTIMIZED
import { getSiteData } from '@lib/server/sites';

export async function GET({ params }: APIContext): Promise<Response> {
  const { siteKey } = params;
  if (!siteKey) {
    return new Response('Invalid request', { status: 400 });
  }

  const site = await getSiteData(siteKey); // Reuse shared logic
  
  if (!site) {
    return new Response('Site not found', { status: 404 });
  }

  return new Response(JSON.stringify(site), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=1800', // 5min cache
    },
  });
}
```

**Benefits:**
- **Performance**: Eliminates HTTP overhead and JSON serialization for SSR
- **Consistency**: Single source of truth for data fetching logic
- **Maintainability**: Shared libraries reduce code duplication
- **Reliability**: Fewer network dependencies for core content

### 2. Implement Smart Site Store Pre-seeding

#### A. Pre-seed Site Store with SSR Data
```typescript
### 2. Implement Smart Site Store Pre-seeding

#### A. Centralize Store Logic with Nanostore Hooks
**Pattern**: The store manages its own lifecycle and subscriptions using `onMount` and `onSet`. This encapsulates logic and removes the burden from components.

```typescript
// src/stores/site/index.ts - REFINED
import { atom, onMount, onSet } from 'nanostores';
import { uid } from '@stores/session';
import { logDebug } from '@utils/logHelpers';
import type { Site } from '@schemas/SiteSchema';
import { parseSite, toClientEntry } from '@schemas/SiteSchema';

export const site = atom<Site | null>(null);
export const isPreSeeded = atom<boolean>(false);

let unsubscribe: (() => void) | null = null;

// Runs when the store gets its first subscriber on the client
onMount(site, () => {
  logDebug('siteStore:onMount', 'Site store is now active on the client.');

  // Subscribe to auth changes to dynamically manage real-time updates
  const unbindUid = uid.subscribe(currentUid => {
    const currentSite = site.get();
    if (currentSite) {
      handleSubscription(currentSite, !!currentUid);
    }
  });

  // Cleanup when the store is no longer used
  return () => {
    logDebug('siteStore:onMount', 'Site store is no longer active, cleaning up.');
    unbindUid();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
});

// Runs every time `site.set()` is called
onSet(site, ({ newValue }) => {
  // When the site changes (e.g., navigating to a new site page),
  // update the subscription based on the current auth state.
  handleSubscription(newValue, !!uid.get());
});

async function handleSubscription(currentSite: Site | null, isAuthenticated: boolean) {
  // Always clean up the previous subscription first
  if (unsubscribe) {
    logDebug('siteStore:handleSubscription', 'Cleaning up previous subscription.');
    unsubscribe();
    unsubscribe = null;
  }

  // Only subscribe if authenticated and a site is loaded
  if (!isAuthenticated || !currentSite) {
    return;
  }

  logDebug('siteStore:handleSubscription', 'Starting real-time subscription for site:', currentSite.key);
  const { db } = await import('@firebase/client');
  const { doc, onSnapshot } = await import('firebase/firestore');

  unsubscribe = onSnapshot(doc(db, 'sites', currentSite.key), (doc) => {
    if (doc.exists()) {
      const updatedSite = parseSite(toClientEntry(doc.data()), currentSite.key);
      // Prevent infinite loops by checking for actual changes
      if (JSON.stringify(site.get()) !== JSON.stringify(updatedSite)) {
        site.set(updatedSite);
        logDebug('siteStore', 'Real-time update received for site:', currentSite.key);
      }
    } else {
      site.set(null); // Site was deleted
    }
  });
}
```

#### B. Create a Dedicated Store Initializer Component
**Pattern**: A single, "renderless" Svelte component is responsible for seeding the store with SSR data. This ensures initialization happens exactly once on the client.

```svelte
<!-- src/components/svelte/sites/SiteStoreInitializer.svelte - NEW -->
<script lang="ts">
  import type { Site } from '@schemas/SiteSchema';
  import { site, isPreSeeded } from '@stores/site';
  import { onMount } from 'svelte';
  import { logDebug } from '@utils/logHelpers';

  interface Props {
    site: Site;
  }
  const { site: initialSite }: Props = $props();

  // This component's sole purpose is to initialize the store on the client.
  onMount(() => {
    // Avoid re-initializing if already done (e.g., navigating between pages)
    if (isPreSeeded.get() && site.get()?.key === initialSite.key) {
      logDebug('SiteStoreInitializer', 'Store already seeded for this site.');
      return;
    }

    logDebug('SiteStoreInitializer', 'Seeding site store with SSR data.', initialSite.key);
    site.set(initialSite);
    isPreSeeded.set(true);
  });

  // This component renders nothing to the DOM.
</script>
```

#### C. Astro Integration with the Initializer
**Pattern**: The Astro page passes its server-fetched data to the initializer component, which runs only on the client.

```astro
<!-- /sites/[siteKey]/index.astro - REFINED -->
---
// ... existing imports and data fetching
import SiteStoreInitializer from '@components/svelte/sites/SiteStoreInitializer.svelte';
---

<!-- Pre-seed the site store with SSR data. This component renders no HTML. -->
<SiteStoreInitializer {site} client:only="svelte" />

<PageWithTray title={site.name} site={site}>
  <div class="content-columns">
    <PageArticle {page} {site} />
    <LatestPagesSection {site} />
  </div>
  <!-- Other components that use the site store -->
</PageWithTray>
```

### 3. Optimize Real-time Subscription Strategy

#### A. Conditional Firestore Subscriptions
```typescript
// Enhanced site store with conditional subscriptions
async function subscribe(key: string) {
  // Only subscribe if user is authenticated
  });
}
```

### 4. Implement Hybrid Caching Strategy

#### A. Cache Headers for Real-Time + SSR Model
**Pattern**: Optimize cache times for the hybrid model where anonymous users get fast static content and authenticated users get real-time updates.

```typescript
// Site pages: src/pages/sites/[siteKey]/index.astro
Astro.response.headers.set(
  'Cache-Control', 
  's-maxage=120, stale-while-revalidate=600'
);
// 2 min cache - Short enough for authenticated users to get fresh data
// 10 min stale-while-revalidate - Fast fallback for anonymous users
```

#### B. Netlify Edge Caching Configuration  
**Pattern**: Configure edge cache rules that complement the application cache headers.

```toml
# netlify.toml
[[headers]]
  for = "/sites/*"
  [headers.values]
    Cache-Control = "s-maxage=120, stale-while-revalidate=600"
    # 2 min cache, 10 min stale-while-revalidate for site pages
    # Short cache for authenticated users with real-time updates
```

#### C. Cache Strategy Rationale
- **2-minute `s-maxage`**: Short enough that authenticated users with real-time subscriptions get reasonably fresh data when the subscription hasn't kicked in yet
- **10-minute `stale-while-revalidate`**: Anonymous users get instant page loads from stale cache while fresh content loads in background  
- **No browser cache**: Relies on CDN/edge caching to avoid cache invalidation complexity for authenticated vs anonymous users
- **Progressive Enhancement**: Fast static experience enhanced with real-time updates
```

#### B. Smart Component Initialization Pattern
```svelte
<!-- src/components/svelte/sites/SiteMembersApp.svelte - ENHANCED -->
<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { uid } from '@stores/session';
import { initializeSiteStore } from '@stores/site';

interface Props {
  site: Site;
  enableRealtimeSync?: boolean;
}
const { site: initialSite, enableRealtimeSync = true }: Props = $props();

// Smart initialization: pre-seed with SSR data + optional real-time sync
initializeSiteStore(initialSite, enableRealtimeSync);
</script>

<!-- Component content remains the same -->
```

#### C. Astro Integration with Smart Store Initialization
```astro
<!-- PageApp.astro - ENHANCED with store pre-seeding -->
---
// ... existing imports
import SiteStoreInitializer from '@components/svelte/sites/SiteStoreInitializer.svelte';
---

<!-- Pre-seed the site store with SSR data -->
<SiteStoreInitializer {site} enableRealtimeSync={true} client:only="svelte" />

<div class="content-columns">
  <PageArticle {page} {site} />
  <PageSidebar {site} />
  <LatestPagesSection {site} />
</div>
```

### 3. Optimize Real-time Subscription Strategy

#### A. Conditional Firestore Subscriptions
```typescript
// Enhanced site store with conditional subscriptions
async function subscribe(key: string) {
  // Only subscribe if user is authenticated
  if (!uid.get()) {
    logDebug('siteStore', 'Skipping Firestore subscription - user not authenticated');
    return;
  }

  const { db } = await import('../../firebase/client');
  const { doc, onSnapshot } = await import('firebase/firestore');
  
  logDebug('siteStore', 'Starting real-time subscription for site:', key);
  
  onSnapshot(doc(db, SITES_COLLECTION_NAME, key), (doc) => {
    if (doc.exists()) {
      site.set(parseSite(toClientEntry(doc.data()), key));
      logDebug('siteStore', 'Real-time update received for site:', key);
    } else {
      site.set(null);
    }
  });
}
```

#### B. Subscription State Management
```typescript
// Track subscription state to prevent redundant subscriptions
let currentSubscription: string | null = null;
let unsubscribe: (() => void) | null = null;

async function subscribe(key: string) {
  // Prevent redundant subscriptions
  if (currentSubscription === key) {
    logDebug('siteStore', 'Already subscribed to site:', key);
    return;
  }

  // Clean up existing subscription
  if (unsubscribe) {
    unsubscribe();
    currentSubscription = null;
  }

  // ... subscription logic
  currentSubscription = key;
}
```

### 4. Implement Smart Caching Strategy

#### A. Differentiated Cache Headers
```typescript
// Site metadata: Longer cache (site info changes infrequently)
// Cache-Control: s-maxage=1800, stale-while-revalidate=3600 (30min/1hr)

// Page content: Shorter cache (pages can be edited frequently)  
// Cache-Control: s-maxage=60, stale-while-revalidate=300 (1min/5min)
```

#### B. ETag Support for Conditional Requests
```typescript
export async function GET({ params, request }: APIContext): Promise<Response> {
  const site = await getSiteData(siteKey);
  
  // Generate ETag based on site's updatedAt timestamp
  const etag = `"${site.updatedAt}"`;
  
  // Check if client has current version
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(JSON.stringify(site), {
    headers: {
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
```

### 5. Bundle Size Optimization for Site Pages

#### A. Lazy Load Non-Critical Components
```astro
<!-- Only load heavy components when needed -->
<PageFabs pageKey={homePageKey} site={site} client:load slot="fab-tray" />

<!-- Use client:visible for below-fold content -->
<LatestPagesSection {site} client:visible />
```

#### B. Optimize Firebase Imports
```typescript
// Use dynamic imports to reduce initial bundle size
const subscribeToSite = async (key: string) => {
  const [{ db }, { doc, onSnapshot }] = await Promise.all([
    import('../../firebase/client'),
    import('firebase/firestore')
  ]);
  // ... subscription logic
};
```

## Implementation Plan

### Phase 1: Shared Server Libraries (Sprint 1)
- [x] Create `src/firebase/server/sites.ts` with shared data fetching functions
- [x] Create `src/lib/server/pages.ts` with shared page data functions (merged into `sites.ts`)
- [x] Update `/sites/[siteKey]/index.astro` to use direct Firebase access
- [x] Update API routes to use shared libraries for consistency
- [x] Add comprehensive error handling and logging

### Phase 2: Smart Store Pre-seeding (Sprint 1-2)
- [x] Enhance site store with pre-seeding and conditional subscription logic
- [x] Create `SiteStoreInitializer.svelte` component for smart initialization
- [x] Update all site-related components to use new initialization pattern
- [x] Add subscription state management to prevent redundant connections
- [x] Implement proper cleanup for Firestore subscriptions

### Phase 3: Caching and Performance (Sprint 2)
- [ ] Implement differentiated cache strategies for site vs page content
- [ ] Add ETag support for conditional requests in API routes  
- [ ] Optimize Firebase SDK imports with dynamic loading
- [ ] Add bundle analysis for site page components
- [ ] Implement lazy loading for non-critical components

### Phase 4: Real-time Optimization (Sprint 2-3)
- [ ] Implement authentication-aware subscription logic
- [ ] Add fallback mechanisms for offline/failed subscriptions
- [ ] Optimize subscription lifecycle management
- [ ] Add performance monitoring for real-time updates
- [ ] Implement graceful degradation for anonymous users

## Success Metrics

### Performance Targets
- **TTFB (Time to First Byte)**: < 500ms (vs current ~800ms+)
- **LCP (Largest Contentful Paint)**: < 2.0s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Technical Metrics
- **API Call Reduction**: Eliminate 2 API calls per site page load (100% reduction for SSR)
- **Bundle Size**: Reduce Firebase-related chunks for site pages by 20%
- **Database Efficiency**: Batch Firestore queries where possible
- **Cache Hit Rate**: > 85% for site metadata, > 70% for page content
- **Real-time Connection Efficiency**: Only subscribe when user authenticated + content can change

### User Experience Metrics
- **Flash of Loading State**: Eliminate initial loading flash with pre-seeded stores
- **Real-time Update Latency**: < 500ms for authenticated users
- **Offline Resilience**: Site pages work with stale data when Firestore unavailable

## Architecture Benefits

### 1. **Hybrid SSR + Real-time Model**
- **Fast Initial Load**: SSR provides immediate content rendering
- **Live Updates**: Authenticated users get real-time changes via Firestore
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Optimal Resource Usage**: Only subscribe to updates when beneficial

### 2. **Smart Data Synchronization**
- **Pre-seeded Stores**: Eliminate flash of loading states
- **Conditional Subscriptions**: Only use real-time sync when user can benefit
- **Graceful Degradation**: Anonymous users get fast static content
- **Efficient Updates**: Real-time sync only for authenticated content creators

### 3. **Performance-First Architecture**
- **Eliminate Waterfall Requests**: Direct Firebase access for SSR
- **Reduce Bundle Size**: Dynamic imports for Firebase functionality
- **Smart Caching**: Different strategies for metadata vs dynamic content
- **Minimal JavaScript**: Core content works with progressive enhancement

## Risk Assessment

### High Risk
- **Store State Management**: Complex store initialization logic might introduce bugs
- **Subscription Cleanup**: Memory leaks if subscriptions aren't properly cleaned up

### Medium Risk
- **Cache Invalidation**: Need proper cache busting when site data changes
- **Firebase Connection Management**: Handle offline/online state transitions gracefully

### Low Risk
- **API Backward Compatibility**: API routes remain functional for external consumers
- **Development Experience**: Minimal impact on development workflow
- **User Experience**: Changes should be transparent to end users

## Technical Debt Considerations

- Remove API route usage from SSR pages once shared libraries are stable
- Consider implementing server-side caching layer for frequently accessed sites
- Evaluate moving to a more sophisticated state management solution for complex site data

## Dependencies

- Enhanced Astro SSR capabilities for direct Firebase access
- Svelte store patterns for smart state initialization
- Firebase SDK optimization for bundle size reduction
- Netlify edge caching for API route optimization

## Notes

This optimization transforms the site page architecture from an API-dependent waterfall pattern to a hybrid SSR + real-time subscription model. The key innovation is **conditional real-time synchronization** - authenticated users who can edit content get instant updates, while anonymous visitors get fast static content without the overhead of unnecessary Firestore connections.

**Key Architectural Decisions:**

1. **SSR-First for Core Content**: Site metadata and page content load immediately via direct Firebase access
2. **Smart Store Pre-seeding**: Eliminate loading states by initializing stores with SSR data
3. **Authentication-Aware Subscriptions**: Only use real-time sync when user can benefit from live updates
4. **Shared Server Libraries**: Single source of truth for data fetching, used by both SSR and API routes
5. **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with real-time features

This approach provides the best of both worlds: fast initial loads for all users and real-time collaboration features for authenticated content creators.

## Implementation Status

### ✅ Completed Tasks

#### 1. Smart Site Store Pre-seeding with Nanostore Hooks
- **Store Logic Centralization** ✅ DONE
  - Implemented `onMount` and `onSet` hooks for self-managing store lifecycle
  - Added subscription state tracking with `currentSubscriptionKey`
  - Enhanced error handling with proper cleanup functions
  - Optimized Firebase imports with `Promise.all()` pattern

- **Store Initializer Component** ✅ DONE
  - Created `SiteStoreInitializer.svelte` component for renderless initialization
  - Implemented proper SSR-to-client data handoff
  - Added duplicate initialization prevention logic
  - Fixed import paths for Svelte component compatibility

- **Astro Integration** ✅ DONE
  - Integrated `SiteStoreInitializer` in `/sites/[siteKey]/index.astro`
  - Eliminated manual store initialization from components
  - Implemented `client:only="svelte"` pattern for proper hydration

#### 2. Real-time Subscription Optimization
- **Authentication-Aware Subscriptions** ✅ DONE
  - Only subscribe to Firestore for authenticated users
  - Dynamic subscription management based on auth state changes
  - Proper cleanup to prevent memory leaks
  - Enhanced error handling for connection issues

#### 3. Direct Firebase Server Access Implementation
- **Server-Side Data Fetching** ✅ DONE
  - Already using `getSiteData()` and `getPageData()` from `@firebase/server/sites`
  - Eliminated waterfall API calls during SSR
  - Direct Firebase access in Astro frontmatter

### 🚧 In Progress Tasks

#### 4. E2E Test Coverage
- **Site Page Performance Tests** ✅ DONE
  - Created comprehensive `site-page.spec.ts` test suite
  - Tests for SSR data loading without waterfall requests
  - Authentication-aware real-time subscription testing
  - Store initialization and state management validation
  - Anonymous user experience verification
  - Cache header validation for hybrid model

#### 5. Hybrid Caching Strategy Implementation
- **Site Page Cache Headers** ✅ DONE  
  - Implemented `s-maxage=120, stale-while-revalidate=600` for site pages
  - 2-minute cache optimizes for real-time updates for authenticated users
  - 10-minute stale-while-revalidate provides fast fallback for anonymous users
  - Updated Netlify configuration for site route patterns
  - Added cache header tests to e2e suite

### 📋 Remaining Tasks

#### 5. Shared Server Libraries Enhancement
- **Consolidate Parsing Logic** 🔄 PENDING
  - Extract common site/page parsing into `@lib/server/sites.ts`
  - Update API routes to use shared libraries
  - Eliminate duplicate parsing between SSR and API routes

#### 6. Bundle Size Optimization
- **Dynamic Firebase Imports** 🔄 PENDING  
  - Audit client-side Firebase imports for tree-shaking
  - Implement `client:visible` for non-critical site components
  - Optimize component hydration timing

#### 7. Performance Monitoring
- **Metrics Implementation** 🔄 PENDING
  - Add Core Web Vitals tracking for site pages
  - Implement performance budgets for bundle sizes
  - Set up monitoring for real-time subscription performance

### 🧪 Testing Status

- **E2E Tests**: ✅ Implemented comprehensive site page testing
  - SSR performance validation
  - Store initialization testing  
  - Authentication flow testing
  - Anonymous user experience testing
  - Performance regression prevention

- **Unit Tests**: 🔄 PENDING
  - Store logic unit tests
  - Component initialization tests
  - Firebase integration mocking tests

````
