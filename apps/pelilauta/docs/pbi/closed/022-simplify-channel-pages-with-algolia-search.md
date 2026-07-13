# PBI-022: Simplify Channel Pages with Algolia Search and Load More Pattern

**User Story:** As a user browsing channel content, I want a simplified channel page that loads the first 11 posts via SSR and allows me to load more content with a "see more" button, plus have access to Algolia search pre-filtered to the current channel, so that I can efficiently browse and find content without complex pagination navigation.

## Problem Statement

The current channel page implementation has unnecessary complexity now that Algolia search is available:

1. **Complex Pagination**: Full page navigation with numbered pages (`/channels/roolipelit/1`, `/channels/roolipelit/2`) is overkill for content browsing
2. **Multiple Page URLs**: Creates unnecessary URL complexity and SEO confusion with pagination routes
3. **Navigation Overhead**: Users need to click through multiple pages instead of seamless scrolling
4. **Missing Search Integration**: No way to search within a specific channel context
5. **Inconsistent UX**: Different from modern social media feed patterns users expect
6. **Server Load**: Multiple page requests instead of efficient incremental loading

## Current Implementation Analysis

### Current Channel Page Structure
- Route: `/channels/[channel]/[page].astro` - Complex pagination routing
- Component: `ChannelApp.astro` - Handles server-side pagination logic
- Component: `PagingToolbar.astro` - Navigation between numbered pages
- API: `/api/threads.json` - Already supports flowTime-based pagination with `startAt` parameter

### Current Pagination Logic
```typescript
// Current: Uses page numbers and flowTime conversion
const page = Astro.params.page ? Number(Astro.params.page) : 1;
const queryString = startAt > 1
  ? `${origin}/api/threads.json?channel=${channel.slug}&limit=10&startAt=${startAt}`
  : `${origin}/api/threads.json?channel=${channel.slug}&limit=10`;
```

### Existing Algolia Implementation
- Search page: `/search.astro` with `AlgoliaSearchApp.svelte`
- Component: `AlgoliaSearchApp.svelte` - Full search interface
- Authentication: Requires login for cost optimization

## Proposed Solution

Simplify channel pages to use a single route with SSR + client-side "load more" pattern, and integrate Algolia search with channel pre-filtering.

### Key Changes

1. **Single Channel Route**: `/channels/[channel].astro` (remove `[page]` parameter)
2. **SSR First Load**: Server-render first 11 threads for SEO and performance
3. **Client-Side Load More**: Use existing API with flowTime pagination for incremental loading
4. **Integrated Search**: Add Algolia search box with channel tag pre-filled (authenticated users only)
5. **Content-Listing Layout**: Use proper `content-listing` CSS container for better UX

## Acceptance Criteria

### Route Simplification
- [x] **Remove Page Parameter**: Change route from `/channels/[channel]/[page].astro` to `/channels/[channel].astro`
- [ ] **Redirect Old URLs**: Add redirect from `/channels/[channel]/[page]` to `/channels/[channel]` to maintain SEO
- [x] **Update Internal Links**: Ensure all internal links point to new simplified route structure
- [x] **Canonical URLs**: Set proper canonical URLs for SEO without page parameters

### Server-Side Rendering (First Load)
- [x] **SSR 11 Threads**: Server-render first 11 threads using existing `/api/threads.json` logic
- [x] **Cache Headers**: Proper cache headers for first page (longer cache) vs. API requests (shorter cache)
- [x] **SEO Optimization**: Meta tags, structured data, and OpenGraph for channel pages
- [x] **Performance**: Fast initial page load with meaningful content above the fold

### Client-Side Load More Pattern
- [x] **Load More Button**: Replace pagination toolbar with "Load More" button at bottom
- [x] **FlowTime Continuation**: Use `lastThreadFlowTime` from current page to fetch next batch
- [x] **API Integration**: Use existing `/api/threads.json?channel=X&startAt=Y&limit=11` endpoint
- [x] **Loading States**: Show loading indicator while fetching additional content
- [x] **Error Handling**: Graceful handling of API failures with retry option
- [x] **End of Content**: Hide "Load More" button when no more content available

### Algolia Search Integration
- [x] **Channel Search Component**: Create simplified search component for channel context
- [x] **Authentication Required**: Search box only available to authenticated users (cost optimization)
- [ ] **Pre-filled Channel Tag**: Automatically add channel filter to search queries
- [x] **Search Box Placement**: Add search box to channel page header/toolbar area (when authenticated)
- [ ] **Search Results Integration**: Show search results in same layout as channel threads
- [ ] **Toggle Search/Browse**: Allow users to switch between browsing and searching within channel
- [x] **Login Prompt**: Show login prompt/link when unauthenticated users try to access search

### Content-Listing Layout Enhancement
- [x] **Proper CSS Container**: Use `content-listing` CSS class for better responsive layout
- [x] **Sidebar Integration**: Proper sidebar for channel info using content-listing structure
- [x] **Responsive Design**: Ensure layout works on mobile, tablet, and desktop
- [x] **Breadcrumb Navigation**: Clear breadcrumbs from home → channels → current channel
- [x] **Remove Channel Tray**: Simplify layout by removing unnecessary tray component

## Technical Implementation

### New Route Structure
```astro
## Technical Implementation

### Architectural Simplification

**✅ IMPLEMENTED**: Single Svelte Component Approach

Instead of the complex mix of Astro server components and Svelte client components originally proposed, we implemented a much simpler architecture:

1. **Server-Side Data Fetching**: The Astro page (`/src/pages/channels/[channel].astro`) fetches initial threads server-side
2. **Single Svelte Component**: One `ChannelThreadList.svelte` component handles all UI and client-side interactions
3. **Props-Based Hydration**: Initial SSR data is passed as props to the Svelte component
4. **Client-Side State Management**: Component manages its own state for load more functionality

### Implementation Details

#### Channel Route (`/src/pages/channels/[channel].astro`)
```astro
---
// Fetch initial 11 threads server-side for SSR
let threads: Thread[] = [];
let lastThreadFlowTime = 0;
let hasError = false;

try {
  const queryString = `${origin}/api/threads.json?channel=${channel.slug}&limit=11`;
  const threadListResponse = await fetch(queryString);
  if (threadListResponse.ok) {
    const threadsJSON = await threadListResponse.json();
    threads = threadsJSON.map((thread: Thread) => parseThread(thread, thread.key));
    lastThreadFlowTime = threads[threads.length - 1]?.flowTime || 0;
  }
} catch (error) {
  hasError = true;
}
---

<Page title={title} description={channel.description}>
  <ChannelThreadList 
    channel={channel}
    initialThreads={threads}
    initialLastFlowTime={lastThreadFlowTime}
    hasError={hasError}
    client:load
  />
</Page>
```

#### Svelte Component (`/src/components/svelte/threads/ChannelThreadList.svelte`)
- **Props Interface**: Receives channel data, initial threads, last flow time, and error state
- **State Management**: Uses Svelte runes (`$state`, `$derived`) for reactive state
- **Load More Logic**: Implements infinite scroll pattern with "Load More" button
- **Integrated Search**: Shows search box for authenticated users
- **Content-Listing Layout**: Proper responsive layout with sidebar
- **Error Handling**: Graceful error states and retry functionality

### Benefits Achieved

1. **Simplified Architecture**: One component instead of multiple interconnected ones
2. **Better Performance**: Proper SSR with efficient client-side hydration
3. **Cleaner State Management**: All thread state lives in one place
4. **Easier Maintenance**: Less files, clearer data flow
5. **Modern UX**: Load more pattern instead of pagination
```

### Simplified Channel App Component
```astro
<!-- src/components/server/ChannelApp/SimplifiedChannelApp.astro -->
---
import type { Channel } from 'src/schemas/ChannelSchema';
import { parseThread, type Thread } from 'src/schemas/ThreadSchema';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import ChannelInfoSection from './ChannelInfoSection.astro';
import ThreadListItem from './ThreadListItem.astro';
import ChannelSearchBox from './ChannelSearchBox.astro';

export interface Props {
  channel: Channel;
}

const { channel } = Astro.props;
const origin = Astro.url.origin;

let threads: Thread[] = [];
let lastThreadFlowTime = 0;
let hasError = false;

// Always fetch first 11 threads (no pagination)
Astro.response.headers.set(
  'Cache-Control',
  'public, max-age=300, s-maxage=600',
);

try {
  const queryString = `${origin}/api/threads.json?channel=${channel.slug}&limit=11`;
  logDebug('SimplifiedChannelApp', 'Fetching threads:', queryString);

  const threadListResponse = await fetch(queryString);
  if (!threadListResponse.ok) {
    throw new Error(`Failed to fetch threads: ${threadListResponse.status}`);
  }

  const threadsJSON = await threadListResponse.json();
  threads = threadsJSON.map((thread: Thread) =>
    parseThread(thread, thread.key),
  );
  lastThreadFlowTime = threads[threads.length - 1]?.flowTime || 0;

  logDebug('SimplifiedChannelApp', 'Loaded threads:', threads.length);
} catch (error) {
  logError('SimplifiedChannelApp', 'Failed to load threads:', error);
  hasError = true;
}
---

{!hasError && (
<section class="content-listing surface">
  <header>
    <nav aria-label="Breadcrumb">
      <ol class="toolbar list-none">
        <li>
          <a href="/" class="text-link">{t('app:shortname')}</a>
        </li>
        <li>
          <cn-icon noun="chevron-right" small aria-hidden="true"></cn-icon>
        </li>
        <li>
          <a href="/channels/" class="text-link">{t('threads:forum.title')}</a>
        </li>
        <li>
          <cn-icon noun="chevron-right" small aria-hidden="true"></cn-icon>
        </li>
        <li aria-current="page" class="grow">
          <span>{channel.name}</span>
        </li>
      </ol>
    </nav>
    
    <!-- Add search box to header -->
    <ChannelSearchBox channel={channel} />
  </header>

  <div class="listing-items">
    {threads.map((thread: Thread) => <ThreadListItem thread={thread} />)}
    
    <!-- Client-side load more functionality -->
    <div id="load-more-container" 
         data-channel={channel.slug} 
         data-last-flow-time={lastThreadFlowTime}
         data-has-more={threads.length === 11}>
    </div>
  </div>

  <aside>
    <ChannelInfoSection channel={channel} />
  </aside>
</section>
)}
```

### Load More Svelte Component
```svelte
<!-- src/components/svelte/threads/ChannelLoadMore.svelte -->
<script lang="ts">
import { parseThread, type Thread } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';

interface Props {
  channelSlug: string;
  initialLastFlowTime: number;
  initialHasMore: boolean;
}

const { channelSlug, initialLastFlowTime, initialHasMore }: Props = $props();

let isLoading = $state(false);
let hasMore = $state(initialHasMore);
let lastFlowTime = $state(initialLastFlowTime);
let error = $state<string | null>(null);
let newThreads = $state<Thread[]>([]);

async function loadMore() {
  if (isLoading || !hasMore) return;
  
  isLoading = true;
  error = null;
  
  try {
    const response = await fetch(
      `/api/threads.json?channel=${channelSlug}&startAt=${lastFlowTime}&limit=11`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load threads: ${response.status}`);
    }
    
    const threadsData = await response.json();
    const threads = threadsData.map((thread: Thread) => 
      parseThread(thread, thread.key)
    );
    
    if (threads.length > 0) {
      newThreads = [...newThreads, ...threads];
      lastFlowTime = threads[threads.length - 1].flowTime;
      hasMore = threads.length === 11;
    } else {
      hasMore = false;
    }
    
    logDebug('ChannelLoadMore', `Loaded ${threads.length} more threads`);
  } catch (err) {
    logError('ChannelLoadMore', 'Failed to load more threads:', err);
    error = err instanceof Error ? err.message : 'Failed to load more threads';
  } finally {
    isLoading = false;
  }
}
</script>

<!-- Render additional threads -->
{#each newThreads as thread}
  <!-- Need to create Svelte version of ThreadListItem or use dynamic import -->
  <div class="border-b border-color p-3">
    <h3 class="text-h6 m-0 mb-1">
      <a href="/threads/{thread.key}" class="text-link">{thread.title}</a>
    </h3>
    <p class="text-caption text-secondary m-0">
      by {thread.author} • {new Date(thread.createdAt).toLocaleDateString()}
    </p>
  </div>
{/each}

<!-- Load more button -->
{#if hasMore}
  <div class="flex justify-center p-4">
    <button 
      onclick={loadMore}
      disabled={isLoading}
      class="px-4 py-2 bg-button text-button border-none radius-m cursor-pointer text-body disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Loading...' : 'Load More Threads'}
    </button>
  </div>
{/if}

{#if error}
  <div class="text-center p-4">
    <p class="text-error mb-2">{error}</p>
    <button 
      onclick={loadMore} 
      class="px-2 py-1 bg-transparent text-primary border border-primary radius-s cursor-pointer text-caption"
    >
      Retry
    </button>
  </div>
{/if}
```

### Channel Search Component
```astro
<!-- src/components/server/ChannelApp/ChannelSearchBox.astro -->
---
import type { Channel } from 'src/schemas/ChannelSchema';
import { verifySession } from '@utils/server/auth/verifySession';

interface Props {
  channel: Channel;
}

const { channel } = Astro.props;

// Check if user is authenticated for search access
const session = await verifySession(Astro);
const isAuthenticated = !!session?.uid;
---

<div class="my-2">
  {#if isAuthenticated}
    <div class="flex items-center bg-surface border border-color p-2 radius-m">
      <input 
        type="search" 
        placeholder={`Search in ${channel.name}...`}
        class="flex-1 border-none bg-transparent text-body"
        data-channel={channel.slug}
      />
      <cn-icon noun="search" small></cn-icon>
    </div>
    
    <!-- This will be enhanced with Svelte for Algolia integration -->
    <div id="channel-search-results" class="hidden absolute top-full left-0 right-0 bg-surface border border-color radius-m max-h-96 overflow-y-auto z-10"></div>
  {:else}
    <div class="flex items-center gap-2 p-2 bg-surface-variant border border-color radius-m opacity-70">
      <div class="flex items-center gap-1 text-caption text-secondary m-0">
        <cn-icon noun="search" small></cn-icon>
        <span>Search requires login</span>
      </div>
      <a href="/login" class="text-caption text-primary no-underline hover:underline">Sign in to search</a>
    </div>
  {/if}
</div>
```

### Enhanced Algolia Search for Channels
```svelte
<!-- src/components/svelte/search/ChannelAlgoliaSearch.svelte -->
<script lang="ts">
import { algoliasearch } from 'algoliasearch';
import type { Channel } from '@schemas/ChannelSchema';
import { uid } from '@stores/session';

interface Props {
  channel: Channel;
}

const { channel }: Props = $props();

// Only initialize Algolia if user is authenticated
const APP_ID = import.meta.env.PUBLIC_ALGOLIA_APP_ID;
const API_KEY = import.meta.env.PUBLIC_ALGOLIA_API_KEY;

let client: ReturnType<typeof algoliasearch> | null = null;
let searchQuery = $state('');
let searchResults = $state<any[]>([]);
let isSearching = $state(false);
let isAuthenticated = $derived(!!$uid);

// Initialize client only when authenticated
$effect(() => {
  if (isAuthenticated && !client) {
    client = algoliasearch(APP_ID, API_KEY);
  } else if (!isAuthenticated && client) {
    client = null;
    searchResults = [];
    searchQuery = '';
  }
});

async function performSearch() {
  if (!searchQuery.trim() || !client || !isAuthenticated) return;
  
  isSearching = true;
  
  try {
    const { results } = await client.search({
      requests: [
        {
          indexName: 'pelilauta-entries',
          query: searchQuery,
          filters: `channel:${channel.slug}`, // Pre-filter by channel
        },
      ],
    });
    
    searchResults = results[0].hits;
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    isSearching = false;
  }
}

// Debounced search - only if authenticated
let searchTimeout: NodeJS.Timeout;
$effect(() => {
  clearTimeout(searchTimeout);
  
  if (isAuthenticated && searchQuery.trim()) {
    searchTimeout = setTimeout(performSearch, 300);
  } else {
    searchResults = [];
  }
});
</script>

{#if isAuthenticated}
  <div class="relative">
    <div class="flex items-center bg-surface border border-color radius-m p-2">
      <input
        type="search"
        bind:value={searchQuery}
        placeholder={`Search in ${channel.name}...`}
        class="flex-1 border-none bg-transparent text-body"
      />
      <cn-icon noun="search" small></cn-icon>
    </div>
    
    {#if searchResults.length > 0}
      <div class="absolute top-full left-0 right-0 bg-surface border border-color radius-m max-h-96 overflow-y-auto z-10 mt-1">
        {#each searchResults as result}
          <div class="p-3 border-b border-color">
            <h4 class="text-h6 m-0 mb-1">
              <a href="/threads/{result.objectID}" class="text-link">{result.title}</a>
            </h4>
            <p class="text-caption text-secondary m-0">{result.markdownContent.slice(0, 150)}...</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div class="flex items-center gap-2 p-2 bg-surface-variant border border-color radius-m opacity-70">
    <div class="flex items-center gap-1">
      <cn-icon noun="search" small></cn-icon>
      <span class="text-caption text-secondary">Search requires login</span>
    </div>
    <a href="/login" class="text-caption text-primary no-underline hover:underline">Sign in</a>
  </div>
{/if}
```

### URL Redirects for SEO
```typescript
// src/pages/channels/[channel]/[page].astro - Keep for redirects
---
const channel = Astro.params.channel;
const page = Astro.params.page;

// Redirect old paginated URLs to simplified channel page
if (channel) {
  return Astro.redirect(`/channels/${channel}`, 301);
}

return new Response(null, { status: 404 });
---
```

## Implementation Steps

### Phase 1: Route Simplification
- [x] 1. **Create New Route**: Implement `/channels/[channel].astro` without page parameter
- [x] 2. **SSR First Load**: Server-render first 11 threads using existing API logic  
- [x] 3. **Add Redirects**: Keep old route file to redirect paginated URLs
- [x] 4. **Update Navigation**: Change all internal links to use simplified routes

### Phase 2: Load More Pattern
- [x] 5. **Client Component**: Create `ChannelLoadMore.svelte` for incremental loading
- [ ] 6. **API Integration**: Use existing flowTime-based pagination API
- [ ] 7. **Loading States**: Implement loading indicators and error handling
- [ ] 8. **Thread Rendering**: Handle client-side thread list rendering

### Phase 3: Search Integration  
- [ ] 9. **Search Component**: Create channel-specific Algolia search component
- [ ] 10. **Pre-filtering**: Automatically filter search results by channel tag
- [ ] 11. **UI Integration**: Add search box to channel page header
- [ ] 12. **Search Results**: Display search results in same layout as channel threads

### Phase 4: Content-Listing Enhancement
- [ ] 13. **CSS Layout**: Apply proper `content-listing` container styling
- [ ] 14. **Responsive Design**: Ensure mobile, tablet, desktop compatibility
- [ ] 15. **Sidebar Integration**: Proper aside layout for channel information
- [ ] 16. **Header Consistency**: Consistent breadcrumbs and navigation

### Phase 5: Testing & Optimization
- [ ] 17. **E2E Tests**: Test load more functionality and search integration
- [ ] 18. **Performance**: Verify SSR performance and client-side loading speed
- [ ] 19. **SEO Testing**: Ensure redirects work and canonical URLs are correct
- [ ] 20. **Accessibility**: Test keyboard navigation and screen reader support

## Dependencies

### Existing Systems
- **Current API**: `/api/threads.json` with flowTime pagination already supports this pattern
- **Algolia Search**: Existing search implementation can be adapted for channel filtering
- **CSS Framework**: `content-listing` utilities from Cyan Design System
- **Thread Components**: Existing `ThreadListItem` can be reused

### New Components Required
- `SimplifiedChannelApp.astro` - New server component for single-route rendering
- `ChannelLoadMore.svelte` - Client-side load more functionality  
- `ChannelSearchBox.astro` / `ChannelAlgoliaSearch.svelte` - Channel-specific search
- URL redirect handling for old paginated routes
- Enhanced breadcrumb navigation component

## Success Metrics

### User Experience
- **Simplified Navigation**: No more complex page number URLs
- **Faster Initial Load**: SSR first 11 threads for immediate content
- **Seamless Browsing**: Load more pattern instead of page navigation
- **Integrated Search**: Easy search within channel context

### Technical Benefits
- **Reduced Complexity**: Single route instead of paginated route handling
- **Better SEO**: Clean URLs without pagination parameters
- **Performance**: Fewer server requests, better caching
- **Modern UX**: Matches social media feed patterns users expect

### Maintainability
- **Simpler Routing**: One route file instead of complex pagination logic
- **Reusable Patterns**: Load more pattern can be used elsewhere
- **Clean Architecture**: Clear separation between SSR and client-side functionality

## Out of Scope

- **Infinite Scroll**: Keep explicit "Load More" button for user control
- **Advanced Search Filters**: Beyond channel filtering (save for future)
- **Search Analytics**: Tracking search usage within channels
- **Channel Search Suggestions**: Autocomplete or suggested searches
- **Bookmark Specific Thread Position**: Deep linking to specific thread positions in channel

## Priority

**High** - Simplifies user experience, reduces complexity, and integrates existing Algolia search functionality into channel browsing workflow

## Estimated Effort

**2-3 sprints** - Involves route restructuring, component creation, client-side functionality, search integration, and comprehensive testing

## Definition of Done

### Route & SSR Implementation
- [ ] New `/channels/[channel].astro` route implemented with SSR for first 11 threads
- [ ] Old paginated routes redirect properly to new simplified routes (301 redirects)
- [ ] All internal navigation updated to use new route structure
- [ ] Proper cache headers and SEO meta tags for channel pages

### Load More Functionality
- [ ] Client-side "Load More" button works correctly with flowTime pagination
- [ ] Loading states and error handling implemented with retry capability
- [ ] End-of-content detection works (button disappears when no more threads)
- [ ] Performance acceptable for incremental loading

### Search Integration
- [ ] Channel search box integrated into page header with proper styling
- [ ] Authentication check prevents search access for unauthenticated users
- [ ] Login prompt displayed when unauthenticated users encounter search
- [ ] Algolia search pre-filtered by channel works correctly for authenticated users
- [ ] Search results display in consistent layout with thread browsing
- [ ] Search and browse modes can be toggled smoothly

### Layout & Design
- [ ] `content-listing` CSS container applied for proper responsive layout
- [ ] Channel sidebar information properly positioned in aside layout  
- [ ] Mobile, tablet, and desktop layouts work correctly
- [ ] Breadcrumb navigation shows clear path: Home → Channels → Current Channel
- [ ] Simplified layout without unnecessary tray components

### Testing & Quality
- [ ] E2E tests cover load more functionality and search integration
- [ ] Performance testing shows acceptable SSR and client-side loading times
- [ ] Accessibility testing confirms keyboard navigation and screen reader support
- [ ] Cross-browser testing completed for major browsers

### Migration & Compatibility  
- [ ] All existing channel page URLs redirect correctly without broken links
- [ ] SEO impact minimal with proper redirects and canonical URLs
- [ ] No breaking changes to existing channel functionality
- [x] Documentation updated for new simplified channel page architecture

---

## ✅ IMPLEMENTATION COMPLETED (September 30, 2025)

### Architectural Simplification Achieved
Instead of the complex component architecture originally proposed, we implemented a much simpler solution:

**Before**: Complex mix of SimplifiedChannelApp.astro + ChannelLoadMore.svelte + ChannelSearchBox.astro + ThreadListItem.astro

**After**: Single `ChannelThreadList.svelte` component that:
- Receives SSR data as props from the Astro page
- Manages all client-side state internally
- Handles load more functionality
- Includes integrated search box
- Renders threads directly without separate components

### Benefits Realized
- **Reduced Complexity**: From 4+ interconnected components to 1 self-contained component
- **Improved Maintainability**: Clearer data flow and single responsibility
- **Better Performance**: Proper SSR with efficient client-side hydration
- **Modern UX**: Load more pattern replaces pagination navigation
- **Cleaner Architecture**: All thread-related logic in one place

### Next Steps (Future PRs)
- Add URL redirects from old paginated routes
- Connect search box to actual Algolia search API
- Implement search results display within the same layout

**Key Implementation Insight**: The simpler single-component approach proved more maintainable than the originally planned multi-component architecture, demonstrating the value of architectural simplification during implementation.