````markdown
# PBI-020: Comprehensive Forum Admin Tool with SSR Authentication

**User Story:** As a forum administrator, I want a comprehensive server-side admin tool to manage forum channels and topics, so that I can efficiently maintain the forum structure with proper CRUD operations, statistics management, and organizational capabilities without relying on local development environment flags.

## Problem Statement

The current forum administration functionality is severely limited and unreliable:

1. **Environment-Dependent Access**: Current admin tools are only available when `SECRET_FEATURE_FLAG_Admin_tools='true'`, limiting access to local development environments
2. **Incomplete CRUD Operations**: Only partial functionality exists for channel management with buggy implementations
3. **No Statistics Management**: No way to manually refresh channel/topic statistics when needed
4. **Missing Organization Features**: Cannot move channels between topics or manage topic hierarchy
5. **No Topic/Group Management**: Cannot add, remove, or reorganize topics/groups
6. **Production Unavailability**: Admin tools don't work in production cloud environment due to environment flag dependency
7. **Poor Authentication**: No proper server-side admin role verification
8. **Limited Functionality**: Current `ChannelsAdmin.svelte` has placeholder functions that don't actually perform operations

## Current Situation Analysis

### Existing Implementation Issues
- **`/admin/channels.astro`**: Relies on environment flag `SECRET_FEATURE_FLAG_Admin_tools`
- **`ChannelsAdmin.svelte`**: Contains incomplete `addChannel` function with only logging
- **`AddChannelDialog.svelte`**: Form exists but `addChannel` callback doesn't persist data
- **`ChannelSettings.svelte`**: Only has manual refresh functionality, no edit/delete operations
- **No Server-Side Admin Verification**: No integration with existing `isAdmin()` function from `firebase/server/admin.ts`

### Current Data Structure
- Channels stored in `meta/threads` document with `topics` array
- Each channel has: `slug`, `category`, `threadCount`, `flowTime`, `icon`
- Topics/categories are derived from channel `category` field
- Statistics manually calculated from thread collections

## Proposed Solution

Create a comprehensive, production-ready forum administration tool with proper SSR authentication and full CRUD capabilities.

### Core Features

1. **Server-Side Admin Authentication**: Use existing `isAdmin()` function with proper SSR verification
2. **Complete Channel CRUD Operations**: Create, read, update, and delete channels with validation
3. **Manual Statistics Refresh**: Force refresh statistics for individual channels and all channels
4. **Channel Organization**: Move channels between topics/groups with drag-and-drop or selection
5. **Topic/Group Management**: Add, rename, remove, and reorder topics/groups
6. **Production Compatibility**: Works in all environments without feature flags
7. **Proper Error Handling**: Comprehensive error handling with user feedback
8. **Audit Logging**: Track all administrative actions for accountability

### Key Components

- **Enhanced Admin Page**: Server-side authentication with proper access control
- **Channel Management API**: RESTful endpoints for channel CRUD operations
- **Statistics Management**: Manual refresh capabilities with progress feedback
- **Topic Management UI**: Interface for organizing topics and moving channels
- **Comprehensive Admin Dashboard**: Overview of forum structure and statistics
- **Audit Trail**: Logging system for administrative actions

## Acceptance Criteria

### Authentication & Access Control
- [ ] Admin page uses `verifySession()` and `isAdmin()` for server-side authentication
- [ ] Unauthorized users redirected to login with proper redirect parameter
- [ ] Admin status verified on page load and API calls
- [ ] Works in production environment without feature flag dependencies
- [ ] Proper error handling for authentication failures

### Channel CRUD Operations
- [ ] **Create Channel**: Add new channels with name, category, icon, and validation
- [ ] **Read Channels**: Display all channels organized by topics with statistics
- [ ] **Update Channel**: Edit channel properties (name, category, icon) in-place
- [ ] **Delete Channel**: Remove channels with confirmation dialog and cascade handling
- [ ] Form validation prevents duplicate slugs and invalid characters
- [ ] Real-time updates reflect changes immediately in UI
- [ ] Proper error handling with user-friendly messages

### Statistics Management
- [ ] **Single Channel Refresh**: Force refresh statistics for individual channels
- [ ] **All Channels Refresh**: Batch refresh all channel statistics with progress indicator
- [ ] Statistics calculation includes thread count and latest flow time
- [ ] Progress feedback during refresh operations with loading states
- [ ] Error handling for failed refresh operations
- [ ] Refresh operations update meta/threads document correctly

### Topic/Group Management
- [ ] **Add Topic**: Create new topics/categories for organizing channels
- [ ] **Rename Topic**: Edit existing topic names with validation
- [ ] **Delete Topic**: Remove empty topics with confirmation
- [ ] **Move Channels**: Transfer channels between topics via dropdown or drag-and-drop
- [ ] **Reorder Topics**: Change topic display order in admin interface
- [ ] Validation prevents deleting topics with existing channels
- [ ] Updates automatically reflected in channel listings

### User Interface & Experience
- [ ] Clean, organized admin dashboard with overview statistics
- [ ] Intuitive channel management interface with clear actions
- [ ] Responsive design works on desktop and tablet devices
- [ ] Loading states for all asynchronous operations
- [ ] Success/error notifications using `cn-snackbar` component
- [ ] Confirmation dialogs for destructive operations
- [ ] Keyboard shortcuts for common actions

### API Integration
- [ ] **POST `/api/admin/channels`**: Create new channel endpoint
- [ ] **PUT `/api/admin/channels/:slug`**: Update channel endpoint
- [ ] **DELETE `/api/admin/channels/:slug`**: Delete channel endpoint
- [ ] **POST `/api/admin/channels/refresh`**: Refresh statistics endpoint
- [ ] **POST `/api/admin/topics`**: Create/update topics endpoint
- [ ] **DELETE `/api/admin/topics/:name`**: Delete topic endpoint
- [ ] All endpoints verify admin authentication using `tokenToUid()` and `isAdmin()`
- [ ] Proper HTTP status codes and error responses
- [ ] Request validation using Zod schemas

### Data Integrity & Validation
- [ ] Channel slugs automatically generated from names using `toMekanismiURI()`
- [ ] Duplicate slug validation prevents conflicts
- [ ] Category/topic validation ensures proper organization
- [ ] Icon validation from predefined set or custom options
- [ ] Orphaned thread handling when channels are deleted
- [ ] Transaction-based updates for data consistency

## Technical Implementation

### Authentication Flow
```astro
---
// src/pages/admin/channels.astro
import { verifySession } from '@utils/server/auth/verifySession';
import { isAdmin } from '@firebase/server/admin';

const session = await verifySession(Astro);
if (!session?.uid) {
  return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
}

const userIsAdmin = await isAdmin(session.uid);
if (!userIsAdmin) {
  return Astro.redirect('/403'); // Forbidden page
}
---
<PageWithTray title="Forum Administration" noSharing>
  <AdminTray client:only="svelte" slot="app-tray" />
  <ForumAdminDashboard client:only="svelte" />
</PageWithTray>
```

### API Endpoint Structure
```typescript
// src/pages/api/admin/channels/index.ts
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { isAdmin } from '@firebase/server/admin';
import { ChannelSchema } from '@schemas/ChannelSchema';

export async function POST({ request }: APIContext) {
  const uid = await tokenToUid(request);
  if (!uid || !(await isAdmin(uid))) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Channel creation logic
}

export async function PUT({ request, params }: APIContext) {
  // Channel update logic with admin verification
}

export async function DELETE({ params }: APIContext) {
  // Channel deletion logic with admin verification
}
```

### Enhanced Channel Management Component
```svelte
<!-- ForumAdminDashboard.svelte -->
<script lang="ts">
import { uid, authUser } from '@stores/session';
import { authedFetch } from '@utils/client/authedFetch';
import type { Channel } from '@schemas/ChannelSchema';

let channels: Channel[] = $state([]);
let topics: string[] = $state([]);
let isRefreshing = $state(false);
let selectedTopic = $state<string>('');

// Wait for both uid and authUser to prevent race conditions
$effect(() => {
  if ($uid && $authUser) {
    loadChannels();
    loadTopics();
  }
});

async function createChannel(data: {name: string, category: string, icon: string}) {
  try {
    const response = await authedFetch('/api/admin/channels', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (response.ok) {
      await loadChannels(); // Refresh data
      showSuccess('Channel created successfully');
    }
  } catch (error) {
    showError('Failed to create channel');
  }
}

async function updateChannel(slug: string, updates: Partial<Channel>) {
  // Update channel implementation
}

async function deleteChannel(slug: string) {
  // Delete channel implementation with confirmation
}

async function refreshAllChannels() {
  isRefreshing = true;
  try {
    await authedFetch('/api/admin/channels/refresh', { method: 'POST' });
    await loadChannels();
    showSuccess('All channels refreshed');
  } finally {
    isRefreshing = false;
  }
}

async function moveChannel(channelSlug: string, newCategory: string) {
  // Move channel to different topic
}
</script>

<div class="content-columns">
  <section class="column-l">
    <div class="toolbar">
      <h1>Forum Administration</h1>
      <button onclick={refreshAllChannels} disabled={isRefreshing}>
        {#if isRefreshing}<cn-loader small></cn-loader>{/if}
        Refresh All Statistics
      </button>
    </div>
    
    <ChannelManager 
      {channels}
      {topics}
      {createChannel}
      {updateChannel}
      {deleteChannel}
      {moveChannel}
    />
    
    <TopicManager
      {topics}
      onAddTopic={addTopic}
      onRenameTopic={renameTopic}
      onDeleteTopic={deleteTopic}
      onReorderTopics={reorderTopics}
    />
  </section>
</div>
```

### Statistics Refresh Implementation
```typescript
// Enhanced statistics refresh with proper error handling
async function refreshChannelStatistics(channelSlug: string): Promise<void> {
  const { db } = await import('@firebase/client');
  const { collection, query, where, getDocs, doc, updateDoc, getDoc } = await import('firebase/firestore');
  
  try {
    // Get thread count and latest flow time
    const threadsRef = collection(db, THREADS_COLLECTION_NAME);
    const q = query(threadsRef, where('channel', '==', channelSlug));
    const threads = await getDocs(q);
    
    const threadCount = threads.size;
    const latestFlowTime = threads.docs.reduce((latest, doc) => {
      const flowTime = doc.data().flowTime.toMillis();
      return flowTime > latest ? flowTime : latest;
    }, 0);
    
    // Update channel statistics
    const metaRef = doc(db, 'meta', 'threads');
    const metaDoc = await getDoc(metaRef);
    
    if (metaDoc.exists()) {
      const data = metaDoc.data();
      const updatedTopics = data.topics.map((channel: Channel) => {
        if (channel.slug === channelSlug) {
          return { ...channel, threadCount, flowTime: latestFlowTime };
        }
        return channel;
      });
      
      await updateDoc(metaRef, { topics: updatedTopics });
    }
  } catch (error) {
    logError('refreshChannelStatistics', `Failed to refresh ${channelSlug}:`, error);
    throw error;
  }
}
```

## Dependencies

- **Existing Authentication System**: `verifySession()`, `tokenToUid()`, `isAdmin()` functions
- **Firebase Admin SDK**: Server-side Firestore operations
- **Channel Schema**: `ChannelSchema` from `@schemas/ChannelSchema`
- **Thread Schema**: `THREADS_COLLECTION_NAME` constant
- **Cyan Design System**: UI components (`cn-snackbar`, `cn-loader`, etc.)
- **Authentication Stores**: `uid`, `authUser` from `@stores/session`
- **Client Utilities**: `authedFetch()` for authenticated API calls

## Out of Scope (Future Enhancements)

- **Bulk Operations**: Mass channel operations (bulk delete, bulk move)
- **Channel Templates**: Pre-defined channel configurations for different forum types
- **Advanced Permissions**: Granular permissions beyond admin/non-admin
- **Analytics Dashboard**: Advanced statistics and usage analytics
- **Channel Archiving**: Archive instead of delete with restoration capabilities
- **Import/Export**: Channel configuration backup and restore
- **Real-time Collaboration**: Multiple admin simultaneous editing prevention
- **Channel Moderation**: Content moderation tools within channels

## Implementation Steps

### Phase 1: Authentication & Foundation
1. **Update Admin Page**: Remove environment flag dependency, add SSR auth
2. **Create Admin API Routes**: Implement authenticated API endpoints for channel operations
3. **Error Handling Setup**: Implement proper error handling and user feedback system
4. **Testing Framework**: Set up API testing for admin operations

### Phase 2: Channel CRUD Implementation
5. **Create Channel API**: Implement channel creation with validation
6. **Update Channel API**: Enable channel property editing
7. **Delete Channel API**: Implement channel deletion with cascade handling
8. **Channel Management UI**: Build comprehensive channel management interface

### Phase 3: Statistics & Organization
9. **Statistics Refresh**: Implement manual refresh for individual and all channels
10. **Channel Movement**: Enable moving channels between topics
11. **Topic Management**: Add, rename, delete topics functionality
12. **Progress Indicators**: Add loading states and progress feedback

### Phase 4: Enhanced UX & Polish
13. **Dashboard Overview**: Create admin dashboard with forum statistics overview
14. **Confirmation Dialogs**: Add confirmation for destructive operations
15. **Keyboard Shortcuts**: Implement keyboard navigation and shortcuts
16. **Responsive Design**: Ensure mobile/tablet compatibility

### Phase 5: Testing & Deployment
17. **Unit Tests**: Test all API endpoints and business logic
18. **Integration Tests**: Test complete workflows end-to-end
19. **Security Testing**: Verify admin authentication and authorization
20. **Production Deployment**: Deploy and test in production environment

## Non-Functional Requirements

### Security
- All admin operations require proper authentication verification
- Admin status checked on both client and server side
- API endpoints protected against unauthorized access
- Audit logging for accountability and security monitoring

### Performance
- Statistics refresh operations should be efficient and non-blocking
- UI should remain responsive during batch operations
- Database operations should use transactions where appropriate
- Implement proper loading states to manage user expectations

### Reliability
- Error handling prevents data corruption
- Operations should be atomic where possible
- Fallback mechanisms for failed operations
- Data validation prevents invalid states

### Usability
- Intuitive interface following established admin patterns
- Clear feedback for all operations
- Confirmation dialogs prevent accidental destructive actions
- Consistent with Cyan Design System patterns

### Compatibility
- Works in production cloud environment
- Compatible with existing forum data structures
- Backward compatible with current channel storage format
- Works across modern browsers and devices

## Priority

**High** - Current admin functionality is broken and unavailable in production, blocking essential forum management tasks

## Estimated Effort

**2-3 sprints** - Involves comprehensive admin interface redesign, multiple API endpoints, proper authentication integration, and extensive testing

## Definition of Done

### Core Functionality
- [ ] Admin page authenticates using SSR with proper admin role verification
- [ ] All CRUD operations for channels work correctly with validation
- [ ] Statistics refresh functionality works for individual and all channels
- [ ] Topic/group management allows adding, renaming, deleting, and organizing
- [ ] Channel movement between topics works correctly
- [ ] All operations work in production environment without feature flags

### API & Integration
- [ ] All admin API endpoints properly authenticate and authorize requests
- [ ] Proper HTTP status codes and error responses implemented
- [ ] Request validation using Zod schemas prevents invalid data
- [ ] Audit logging tracks all administrative actions
- [ ] Integration with existing authentication and authorization systems

### User Experience
- [ ] Responsive admin dashboard with clear overview of forum structure
- [ ] Loading states and progress indicators for all async operations
- [ ] Success/error notifications provide clear feedback to users
- [ ] Confirmation dialogs prevent accidental destructive operations
- [ ] Keyboard navigation and shortcuts improve workflow efficiency

### Testing & Quality
- [ ] Unit tests cover all API endpoints and business logic
- [ ] Integration tests verify complete admin workflows
- [ ] Security tests confirm proper authentication and authorization
- [ ] Performance tests ensure operations complete in reasonable time
- [ ] Manual testing confirms usability and edge case handling

### Documentation & Deployment
- [ ] API documentation describes all admin endpoints and usage
- [ ] User documentation explains admin interface and procedures
- [ ] Deployment procedures updated for production admin access
- [ ] Security review completed for admin functionality
- [ ] Code review confirms adherence to project standards and patterns
````