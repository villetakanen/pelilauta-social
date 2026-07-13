--CANCELLED--

**Title:** Convert Channels Page to Client-Side Cached Loading

**As a** user, **I want to** see the channels page load instantly with cached data, **so that** I don't have to wait for the same loading animation on repeated visits and have a smoother browsing experience.

---

### Description

Currently, the channels page uses `server:defer` on the `ChannelsApp` component, which causes a loading delay every time users visit the page. This creates poor UX as users see the same loading animation repeatedly, even when visiting the page multiple times in a session.

The current implementation in `/src/pages/channels/index.astro`:
```astro
<ChannelsApp server:defer>
  <DeferredSection class="column-l" noun="discussion" slot="fallback"/>
</ChannelsApp>
```

This approach loads the data server-side on each request, which:
- Shows loading spinners on every page visit
- Doesn't utilize browser caching capabilities
- Creates unnecessary server load for repeated requests
- Provides poor perceived performance

#### Proposed Solution:

Convert the channels page to use client-side data fetching with persistent nanostore caching:

1. **Immediate Rendering:** Remove `server:defer` and render ChannelsApp immediately
2. **Stale-While-Revalidate:** Show cached data instantly, then fetch fresh data from API
3. **API Integration:** Fetch data from Astro API routes, not Firebase directly
4. **Simple Caching:** Use persistent nanostores for client-side cache only
5. **Server-Side Optimization:** Complex caching and data aggregation handled at API level

### Proposed Workflow:

#### First Visit (No Cache):
1. ChannelsApp renders immediately with placeholder/skeleton content
2. Client-side API call to `/api/channels` begins automatically
3. Loading indicators show while fetching from API
4. Data loads and replaces placeholders
5. Fresh data is cached to a persistent nanostore

#### Subsequent Visits (Stale-While-Revalidate):
1. ChannelsApp renders immediately with cached data from nanostore
2. Background API call to `/api/channels` begins silently
3. Update nanostore cache with new data
4. Svelte components automatically re-render with updated data from store

#### Cache Management:
- **Storage:** Use `persistentAtom` from `@nanostores/persistent` 
- **Strategy:** Simple stale-while-revalidate on each page visit
- **Scope:** Client-side cache only, no complex TTL logic
- **Server Optimization:** API routes handle Firebase caching and optimization, the API should implement caching strategies to reduce load times and improve performance.

### Technical Implementation:

#### Files to Modify/Create:

1. **Update:** `/src/pages/channels/index.astro`
   - Remove `server:defer` from ChannelsApp
   - Convert to `client:load` or `client:only="svelte"`

2. **Convert:** `/src/components/server/ChannelApp/ChannelsApp.astro`
   - Convert from Astro component to Svelte component
   - Move to `/src/components/svelte/channels/ChannelsApp.svelte`

3. **Create:** `/src/stores/channels.ts`
   - Persistent nanostores for channels data
   - Simple cache management without TTL logic
   - Stale-while-revalidate pattern implementation

4. **Create:** `/src/pages/api/channels.ts` (or update existing)
   - Astro API route for channels data
   - Server-side Firebase optimization and caching
   - Complex data aggregation handled server-side

5. **Create:** `/src/utils/api/fetchChannels.ts`
   - Client-side API calls to `/api/channels`
   - Error handling and retry logic
   - Integration with persistent nanostores

5. **Update:** Related components to work with Svelte instead of Astro

#### Store Structure:
```typescript
import { persistentAtom } from '@nanostores/persistent';
import { atom } from 'nanostores';

interface ChannelsData {
  channels: Channel[];
  lastUpdated: number; // Simple timestamp for display purposes
}

// Persistent store for channels data (simple cache)
export const channelsCache = persistentAtom<ChannelsData | null>('channels-cache', null);

// Reactive loading state
export const channelsLoading = atom<boolean>(false);
export const channelsRefreshing = atom<boolean>(false);
```

#### API Route Structure:
```typescript
// GET /api/channels
export async function GET(): Promise<Response> {
  try {
    // Server-side optimization:
    // - Firebase connection pooling
    // - Data aggregation and transformation
    // - Server-side caching (Redis, memory, etc.)
    // - Complex filtering and sorting
    
    const channels = await getChannelsFromFirebase();
    
    return new Response(JSON.stringify({
      channels,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response('Error fetching channels', { status: 500 });
  }
}
```

#### Data Fetching Strategy:
```typescript
// Stale-while-revalidate pattern using API routes
async function loadChannelsData(): Promise<Channel[]> {
  const cachedData = channelsCache.get();
  
  // 1. Show cached data immediately if available
  if (cachedData) {
    // Start background refresh from API
    refreshChannelsFromApi();
    return cachedData.channels;
  }
  
  // 2. No cache - fetch from API with loading state
  channelsLoading.set(true);
  const response = await fetch('/api/channels');
  const data = await response.json();
  
  // 3. Update cache with API response
  channelsCache.set({
    channels: data.channels,
    lastUpdated: Date.now()
  });
  
  channelsLoading.set(false);
  return data.channels;
}

async function refreshChannelsFromApi(): Promise<void> {
  channelsRefreshing.set(true);
  try {
    const response = await fetch('/api/channels');
    const data = await response.json();
    
    // Update cache silently
    channelsCache.set({
      channels: data.channels,
      lastUpdated: Date.now()
    });
  } catch (error) {
    logError('ChannelsStore', 'Failed to refresh channels:', error);
  } finally {
    channelsRefreshing.set(false);
  }
}
```

### Acceptance Criteria

#### Must Have:
- [ ] Remove `server:defer` from ChannelsApp in `/src/pages/channels/index.astro`
- [ ] Convert ChannelsApp to Svelte component with client-side rendering
- [ ] Create or update `/api/channels` API route with server-side optimizations
- [ ] Implement persistent nanostores for simple client-side caching
- [ ] Implement stale-while-revalidate pattern (show cache, fetch in background)
- [ ] Show cached data immediately on subsequent visits
- [ ] Background API refresh on every page visit
- [ ] Loading states only for initial visits (no cached data available)
- [ ] Graceful error handling when API calls fail
- [ ] Use `persistentAtom` from `@nanostores/persistent` for data persistence

#### Should Have:
- [ ] Skeleton placeholders for initial loading states
- [ ] Visual indication when data is being refreshed in background
- [ ] Cache versioning for future schema migrations
- [ ] Metrics/logging for API call success/failure rates
- [ ] Server-side caching in the API route (Redis, memory cache, etc.)
- [ ] API route optimization (connection pooling, data aggregation)

#### Could Have:
- [ ] Preloading channels data on hover over navigation links
- [ ] Service worker integration for offline caching
- [ ] Progressive loading of channel details
- [ ] Cache compression for large datasets

### Performance Requirements

- **Initial Render:** Page should render immediately (< 100ms) on cached visits
- **Cache Hit:** Cached data should display within 200ms
- **Cache Miss:** Fresh data should load within 2 seconds
- **Background Refresh:** Should not block UI or cause visual flickering
- **Memory Usage:** Cache managed automatically by nanostores persistence

### Testing Requirements

- [ ] Unit tests for persistent nanostore utilities
- [ ] Unit tests for API fetching logic
- [ ] Integration tests for stale-while-revalidate pattern
- [ ] API route tests for `/api/channels` endpoint
- [ ] E2E tests for first visit vs. cached visit scenarios
- [ ] Performance tests to verify loading time requirements
- [ ] API error handling and fallback tests

### Migration Strategy

1. **Phase 1:** Create or update `/api/channels` API route with server-side optimizations
2. **Phase 2:** Create persistent nanostores and API fetching utilities
3. **Phase 3:** Convert ChannelsApp from Astro to Svelte component
4. **Phase 4:** Implement stale-while-revalidate pattern in the Svelte component
5. **Phase 5:** Update the index.astro page to use client-side rendering
6. **Phase 6:** Test thoroughly across different scenarios
7. **Phase 7:** Deploy with monitoring for API performance
8. **Phase 8:** Cleanup old server-side rendering code

### Benefits

- **Improved UX:** Instant page loads for returning users with stale-while-revalidate
- **Better Perceived Performance:** No loading spinners on cached visits
- **Cleaner Architecture:** API routes handle complex Firebase logic, not client
- **Server-Side Optimization:** Centralized caching and data aggregation at API level
- **Reduced Client Complexity:** Simple cache strategy without TTL management
- **Better Error Handling:** API route can implement retry logic and fallbacks

### Risks and Mitigation

#### Risk: Stale Data Display
- **Mitigation:** Stale-while-revalidate ensures data refreshes on every visit
- **Mitigation:** Background refresh is transparent to users

#### Risk: API Route Performance
- **Mitigation:** Implement server-side caching in the API route
- **Mitigation:** Monitor API response times and optimize as needed

#### Risk: Network Failures
- **Mitigation:** Show cached data when API calls fail
- **Mitigation:** Implement retry logic in API fetching utilities

#### Risk: Initial Load Performance Regression
- **Mitigation:** Maintain loading states for cache misses
- **Mitigation:** Optimize bundle size for client-side components

### Priority

**Medium Priority** - This improves user experience significantly for returning users but doesn't block critical functionality. Should be implemented after core features are stable.

---

### Implementation Notes

- Follow the project's Svelte + TypeScript patterns using runes mode
- Use nanostores for simple client-side state management (no complex TTL logic)
- Use Astro API routes for server-side Firebase interactions and optimizations
- Follow the existing pattern of `@stores` imports and `$storeName` usage
- Use the project's logging utilities (`logDebug`, `logError`) with proper context
- Implement Zod schemas for API response validation
- Keep client-side logic simple - complex caching should be server-side
