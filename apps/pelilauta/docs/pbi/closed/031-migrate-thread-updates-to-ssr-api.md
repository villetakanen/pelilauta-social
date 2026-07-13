# PBI-031: Migrate Thread Updates to SSR API

**Status:** Draft  
**Priority:** High  
**Type:** Refactoring / Bug Fix  
**Estimated Effort:** 4-6 hours  
**Created:** October 17, 2025

**Supersedes:** PBI-030 (Fix Thread Tags Update) - This PBI includes the tag fix as part of the migration

---

## Problem Statement

Thread **creation** has been successfully migrated to use a server-side API endpoint (`/api/threads/create`), but thread **updates/edits** still use direct client-side Firestore writes. This creates inconsistencies and missing functionality:

### Current State

**✅ Thread Creation** (Already Migrated to SSR):
```typescript
// Uses /api/threads/create endpoint
const threadKey = await createThreadApi(data, files);
// Server handles: validation, tag indexing, cache purging, background tasks
```

**❌ Thread Updates** (Still CSR):
```typescript
// Direct Firestore write from client
await updateThread(data);
// Missing: tag index updates, cache purging, server-side validation
```

### Issues with Current Approach

1. **No Tag Index Updates**: Editing thread tags doesn't update the tag collection (PBI-030)
2. **No Cache Purging**: Edited threads don't trigger Netlify cache purges
3. **Inconsistent Security**: Creation uses server-side auth validation, updates rely on Firestore rules
4. **Code Duplication**: Similar logic scattered between client and server
5. **No Server-Side Validation**: Thread updates bypass server validation
6. **Missing Audit Trail**: No server logs for thread edits
7. **Pattern Inconsistency**: Pages use API endpoints, threads use mixed approach

### Comparison with Pages

Pages already follow the correct pattern:
- Page creation: Server-side API
- Page updates: Server-side API (via `updatePage()` → Firestore with proper hooks)

Threads should follow the same pattern for consistency.

---

## Proposed Solution

Create a server-side API endpoint for thread updates and migrate client code to use it, mirroring the page update pattern and the existing thread creation endpoint.

### Architecture

```
┌─────────────────┐
│ Thread Editor   │
│ (Svelte)        │
└────────┬────────┘
         │
         │ submitThreadUpdate()
         ├───────────────────────────────────┐
         │                                   │
         v                                   v
┌─────────────────┐              ┌─────────────────┐
│ createThreadApi │              │ updateThreadApi │
│ (existing)      │              │ (NEW)           │
└────────┬────────┘              └────────┬────────┘
         │                                │
         v                                v
┌─────────────────┐              ┌─────────────────┐
│ POST            │              │ PUT/PATCH       │
│ /api/threads/   │              │ /api/threads/   │
│ create          │              │ [key]           │
│ (existing)      │              │ (NEW)           │
└─────────────────┘              └────────┬────────┘
                                          │
                                          v
                              ┌───────────────────────┐
                              │ Server-Side Tasks:    │
                              │ • Validate & Update   │
                              │ • Update Tag Index    │
                              │ • Purge Caches        │
                              │ • Update flowTime     │
                              │ • Audit Logging       │
                              └───────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create Server-Side Update API

#### Step 1.1: Create API Endpoint

**File:** `src/pages/api/threads/[threadKey].ts` (new file)

```typescript
import type { APIContext } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { TAG_FIRESTORE_COLLECTION, TagSchema } from 'src/schemas/TagSchema';
import { THREADS_COLLECTION_NAME, ThreadSchema, type Thread } from 'src/schemas/ThreadSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { toDate } from 'src/utils/schemaHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { serverDB } from '../../../firebase/server';

const endpointName = 'updateThread';

/**
 * Update an existing thread
 * PUT /api/threads/[threadKey]
 */
export async function PUT({ params, request }: APIContext): Promise<Response> {
  const { threadKey } = params;

  if (!threadKey) {
    return new Response(JSON.stringify({ error: 'Thread key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Authenticate user
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Parse request body
    const body = await request.json();
    
    logDebug(endpointName, 'Update request received', {
      threadKey,
      uid,
      fields: Object.keys(body),
    });

    // 3. Get existing thread
    const threadRef = serverDB.collection(THREADS_COLLECTION_NAME).doc(threadKey);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingThread = threadDoc.data() as Thread;

    // 4. Verify ownership
    if (!existingThread.owners?.includes(uid)) {
      logWarn(endpointName, 'Unauthorized update attempt', {
        threadKey,
        uid,
        owners: existingThread.owners,
      });
      return new Response(JSON.stringify({ error: 'Forbidden: Not thread owner' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Validate and prepare update data
    const allowedFields = [
      'title',
      'markdownContent',
      'channel',
      'tags',
      'youtubeId',
      'poster',
      'public',
    ];

    const updateData: Partial<Thread> & Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Parse tags if provided as JSON string
    if (typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags as string);
      } catch {
        logWarn(endpointName, 'Invalid tags JSON format');
      }
    }

    // Add server timestamps
    updateData.updatedAt = FieldValue.serverTimestamp();
    
    // Only update flowTime if not a silent update
    if (!body.silent) {
      updateData.flowTime = FieldValue.serverTimestamp();
    }

    // 6. Update thread document
    await threadRef.update(updateData);
    
    logDebug(endpointName, 'Thread document updated', { threadKey });

    // 7. Get updated thread for post-processing
    const updatedDoc = await threadRef.get();
    const updatedThread = {
      key: threadKey,
      ...updatedDoc.data(),
    } as Thread;

    // 8. Return success immediately (background tasks run async)
    const response = new Response(
      JSON.stringify({
        success: true,
        threadKey,
        message: 'Thread updated successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );

    // 9. Execute background tasks asynchronously
    executeUpdateBackgroundTasks(threadKey, updatedThread, existingThread);

    return response;
  } catch (error) {
    logError(endpointName, 'Failed to update thread:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

/**
 * Background tasks after thread update
 */
function executeUpdateBackgroundTasks(
  threadKey: string,
  updatedThread: Thread,
  existingThread: Thread,
): void {
  Promise.resolve().then(async () => {
    try {
      // Task 1: Update tag index if tags or title changed
      if (
        updatedThread.tags !== existingThread.tags ||
        updatedThread.title !== existingThread.title
      ) {
        if (updatedThread.tags && updatedThread.tags.length > 0) {
          const tagData = TagSchema.parse({
            key: threadKey,
            title: updatedThread.title,
            type: 'thread',
            author: updatedThread.owners[0] || '',
            tags: updatedThread.tags,
            flowTime: toDate(updatedThread.flowTime).getTime(),
          });

          await serverDB
            .collection(TAG_FIRESTORE_COLLECTION)
            .doc(threadKey)
            .set(tagData);
          
          logDebug('updateThread:background', 'Updated tag index', { threadKey });
        } else {
          // Remove from tag index if no tags
          await serverDB
            .collection(TAG_FIRESTORE_COLLECTION)
            .doc(threadKey)
            .delete();
          
          logDebug('updateThread:background', 'Removed from tag index', { threadKey });
        }
      }

      // Task 2: Purge thread cache
      const { purger } = await import('src/lib/server/cache-purger');
      
      const cacheTags = [`thread-${threadKey}`];
      
      // Add tag cache tags if tags changed
      if (updatedThread.tags !== existingThread.tags) {
        const allTags = [
          ...(updatedThread.tags || []),
          ...(existingThread.tags || []),
        ];
        const uniqueTags = [...new Set(allTags)];
        cacheTags.push(...uniqueTags.map((tag) => `tag-${tag.toLowerCase()}`));
      }
      
      await purger.purgeTags(cacheTags);
      
      logDebug('updateThread:background', 'Cache purged', {
        threadKey,
        tagCount: cacheTags.length,
      });
    } catch (error) {
      logError('updateThread:background', 'Background task failed:', error);
    }
  });
}

/**
 * PATCH is an alias for PUT (partial updates)
 */
export const PATCH = PUT;
```

#### Step 1.2: Create Client-Side Helper

**File:** `src/firebase/client/threads/updateThreadApi.ts` (new file)

```typescript
import type { Thread } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Updates an existing thread using the server-side API endpoint.
 * This replaces the old client-side updateThread function.
 *
 * @param thread - Partial thread data with key required
 * @param silent - If true, doesn't update flowTime (for metadata-only updates)
 * @returns Promise<void>
 */
export async function updateThreadApi(
  thread: Partial<Thread>,
  silent = false,
): Promise<void> {
  const endpointName = 'updateThreadApi';

  if (!thread.key) {
    throw new Error('Thread key is required to update thread');
  }

  try {
    logDebug(endpointName, 'Updating thread via API', {
      threadKey: thread.key,
      fields: Object.keys(thread),
      silent,
    });

    // Get the current user's auth token
    const { auth } = await import('@firebase/client');
    const { getIdToken } = await import('firebase/auth');

    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await getIdToken(auth.currentUser);

    // Prepare request body
    const body = {
      ...thread,
      silent,
    };
    
    // Remove key from body as it's in the URL
    delete body.key;

    // Make the API request
    const response = await fetch(`/api/threads/${thread.key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    if (!response.ok) {
      logError(endpointName, 'API request failed', {
        status: response.status,
        error: responseData.error,
      });
      throw new Error(
        responseData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    logDebug(endpointName, 'Thread updated successfully', {
      threadKey: thread.key,
    });
  } catch (error) {
    logError(endpointName, 'Failed to update thread:', error);
    throw error;
  }
}
```

### Phase 2: Update Client Code

#### Step 2.1: Update submitThreadUpdate

**File:** `src/components/svelte/thread-editor/submitThreadUpdate.ts`

```typescript
export async function submitThreadUpdate(
  data: Partial<Thread>,
  files?: File[],
) {
  const { createThreadApi } = await import(
    '../../../firebase/client/threads/createThreadApi.ts'
  );
  const { updateThreadApi } = await import(
    '../../../firebase/client/threads/updateThreadApi.ts'  // NEW
  );

  if (!data.title || !data.markdownContent || !data.channel || !data.owners) {
    throw new Error('Missing minimum required fields');
  }

  // Handle thread updates (e.g., editing a thread)
  if (data.key) {
    // NEW: Use API instead of direct Firestore write
    await updateThreadApi(data);
    return data.key;
  }

  // Create new thread using the API (existing code)
  const threadKey = await createThreadApi(data, files || []);

  const postedThread: Thread = {
    ...data,
    key: threadKey,
  } as Thread;

  await syndicateToBsky(postedThread, data.owners[0]);

  return threadKey;
}
```

#### Step 2.2: Deprecate Old updateThread Function

**File:** `src/firebase/client/threads/updateThread.ts`

```typescript
// DEPRECATED: Use updateThreadApi() instead
// This function is kept temporarily for backward compatibility
// TODO: Remove after all usages are migrated to updateThreadApi

import { logWarn } from '@utils/logHelpers';
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';

/**
 * @deprecated Use updateThreadApi() instead for proper server-side validation,
 * tag indexing, and cache purging
 */
export async function updateThread(data: Partial<Thread>, silent = false) {
  logWarn(
    'updateThread',
    'DEPRECATED: This function is deprecated. Use updateThreadApi() instead.',
    { threadKey: data.key },
  );

  if (!data.key) {
    throw new Error('Thread key is required to update thread');
  }

  const { doc, getFirestore, updateDoc, serverTimestamp } = await import(
    'firebase/firestore'
  );

  const threadRef = doc(getFirestore(), THREADS_COLLECTION_NAME, data.key);

  if (silent) {
    await updateDoc(threadRef, data);
  } else {
    await updateDoc(threadRef, {
      ...data,
      flowTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
```

### Phase 3: Update Other Thread Update Locations

Search for and update all usages of `updateThread()`:

```bash
# Find all usages
grep -r "updateThread(" src/
```

Common locations to check:
- Reply submission (if it updates parent thread)
- Thread metadata updates (views, reactions)
- Admin/moderation actions
- Thread archiving/locking

---

## Testing Plan

### Unit Tests

**File:** `test/api/threads-update.test.ts` (new file)

```typescript
import { describe, expect, it } from 'vitest';
import { getMultipartAuthHeaders, makeApiRequest, TEST_USERS } from './helpers';

describe('Thread Update API', () => {
  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await makeApiRequest('/api/threads/test-thread-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject updates from non-owners', async () => {
      // Create thread as user A
      const threadKey = 'test-thread-key';
      
      // Try to update as user B
      const headers = await getMultipartAuthHeaders(TEST_USERS.OTHER);
      const response = await makeApiRequest(`/api/threads/${threadKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Hacked Title' }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Thread Updates', () => {
    it('should update thread title', async () => {
      // Setup: Create a thread first
      const threadKey = 'test-thread-for-update';
      
      // Update title
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);
      const response = await makeApiRequest(`/api/threads/${threadKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should update thread tags and tag index', async () => {
      const threadKey = 'test-thread-tags';
      
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);
      const response = await makeApiRequest(`/api/threads/${threadKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: ['newtag', 'anothertag'],
        }),
      });

      expect(response.status).toBe(200);
      
      // Wait for background task
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify tag index updated
      const tagResponse = await makeApiRequest('/api/tags/newtag.json');
      const tagData = await tagResponse.json();
      
      expect(tagData.entries.some((e: any) => e.key === threadKey)).toBe(true);
    });

    it('should remove thread from tag index when tags cleared', async () => {
      const threadKey = 'test-thread-clear-tags';
      
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);
      const response = await makeApiRequest(`/api/threads/${threadKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [],
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Silent Updates', () => {
    it('should not update flowTime for silent updates', async () => {
      const threadKey = 'test-thread-silent';
      
      const headers = await getMultipartAuthHeaders(TEST_USERS.NORMAL);
      
      // Get initial flowTime
      const initialResponse = await makeApiRequest(`/api/threads/${threadKey}.json`);
      const initialData = await initialResponse.json();
      const initialFlowTime = initialData.flowTime;
      
      // Perform silent update
      await makeApiRequest(`/api/threads/${threadKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public: false,
          silent: true,
        }),
      });
      
      // Verify flowTime unchanged
      const updatedResponse = await makeApiRequest(`/api/threads/${threadKey}.json`);
      const updatedData = await updatedResponse.json();
      
      expect(updatedData.flowTime).toBe(initialFlowTime);
    });
  });
});
```

### E2E Tests

**File:** `e2e/thread-editing.spec.ts` (new file)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Thread Editing', () => {
  test('should update thread title via editor', async ({ page }) => {
    // Create a thread
    await page.goto('/channels/general');
    await page.getByTestId('new-thread-button').click();
    await page.fill('[name="title"]', 'Original Title');
    await page.fill('[name="markdownContent"]', 'Original content');
    await page.getByTestId('send-thread-button').click();
    
    await page.waitForURL(/\/threads\/.+/);
    const threadUrl = page.url();
    
    // Edit the thread
    await page.getByTestId('edit-thread-button').click();
    await page.fill('[name="title"]', 'Updated Title');
    await page.getByTestId('send-thread-button').click();
    
    // Verify update
    await expect(page.getByRole('heading', { name: 'Updated Title' })).toBeVisible();
  });

  test('should update thread tags and reflect in tag pages', async ({ page }) => {
    // Create thread
    await page.goto('/channels/general');
    await page.getByTestId('new-thread-button').click();
    await page.fill('[name="title"]', 'Test Thread');
    await page.fill('[name="markdownContent"]', 'Content with #originaltag');
    await page.getByTestId('send-thread-button').click();
    
    await page.waitForURL(/\/threads\/.+/);
    const threadUrl = page.url();
    
    // Wait for background tasks
    await page.waitForTimeout(2000);
    
    // Verify in tag page
    await page.goto('/tags/originaltag');
    await expect(page.getByText('Test Thread')).toBeVisible();
    
    // Edit thread to add new tag
    await page.goto(threadUrl);
    await page.getByTestId('edit-thread-button').click();
    await page.fill('[name="markdownContent"]', 'Content with #originaltag and #newtag');
    await page.getByTestId('send-thread-button').click();
    
    await page.waitForTimeout(2000);
    
    // Verify both tags work
    await page.goto('/tags/newtag');
    await expect(page.getByText('Test Thread')).toBeVisible();
    
    await page.goto('/tags/originaltag');
    await expect(page.getByText('Test Thread')).toBeVisible();
  });
});
```

---

## Migration Strategy

### Step-by-Step Rollout

1. **Implement API endpoint** (Phase 1.1)
2. **Implement client helper** (Phase 1.2)
3. **Add comprehensive tests** (Unit + E2E)
4. **Update main editor flow** (Phase 2.1)
5. **Deploy to production**
6. **Monitor for 1-2 days**
7. **Migrate remaining usages** (Phase 3)
8. **Remove deprecated function** (after migration complete)

### Rollback Plan

1. **Keep old `updateThread()` function** during migration
2. **Feature flag** - Add config to switch between old/new implementations
3. **Netlify instant rollback** available
4. **No breaking changes** - Old function still works

---

## Benefits

### Immediate Benefits

1. ✅ **Tag Index Updates** - Edits properly update tag collection (fixes PBI-030)
2. ✅ **Cache Purging** - Thread edits trigger Netlify cache invalidation
3. ✅ **Server-Side Validation** - Consistent validation across create/update
4. ✅ **Audit Logging** - Server logs for all thread modifications
5. ✅ **Security** - Server-side ownership verification

### Long-Term Benefits

1. ✅ **Consistency** - Same pattern as pages (all mutations via API)
2. ✅ **Maintainability** - Single source of truth for thread updates
3. ✅ **Extensibility** - Easy to add webhooks, notifications, etc.
4. ✅ **Performance** - Background tasks don't block client
5. ✅ **Testability** - API endpoints easier to test than client code

---

## Acceptance Criteria

- [ ] API endpoint `/api/threads/[threadKey]` created and functional
- [ ] `updateThreadApi()` client helper created
- [ ] Thread editor uses new API for updates
- [ ] Tag index updates correctly on thread edits
- [ ] Cache purging works for edited threads
- [ ] Ownership validation enforced server-side
- [ ] Silent updates don't change flowTime
- [ ] Unit tests pass (>90% coverage)
- [ ] E2E tests pass
- [ ] No regressions in thread creation
- [ ] Performance benchmarks met (<500ms for updates)
- [ ] Server logs show update events

---

## Related Files

**New Files:**
- `src/pages/api/threads/[threadKey].ts` - Update API endpoint
- `src/firebase/client/threads/updateThreadApi.ts` - Client helper
- `test/api/threads-update.test.ts` - Unit tests
- `e2e/thread-editing.spec.ts` - E2E tests

**Modified Files:**
- `src/components/svelte/thread-editor/submitThreadUpdate.ts` - Use new API
- `src/firebase/client/threads/updateThread.ts` - Mark as deprecated

**Reference Files:**
- `src/pages/api/threads/create.ts` - Pattern to follow
- `src/firebase/client/page/updatePage.ts` - Similar pattern for pages

---

## Dependencies

**Blocks:**
- PBI-030 (Fix Thread Tags Update) - Superseded by this PBI

**Related:**
- PBI-027 (Advanced Tag Support) - Benefits from proper tag index updates
- PBI-024 (SEO Optimization) - Cache purging improves SEO freshness

---

## Notes

### Why This Wasn't Done Initially

Thread creation was migrated to SSR for performance (file uploads) and background tasks, but updates were left as client-side for simplicity. As the app matured, the need for consistency and proper tag handling became apparent.

### Performance Considerations

- API call adds ~50-100ms latency vs direct Firestore
- Background tasks run async (no user-facing delay)
- Cache purging ensures fresh data for all users
- Net positive: better UX for all users, slight delay for editor

### Future Enhancements (Out of Scope)

- Optimistic UI updates (show changes before API confirms)
- Thread edit history/revisions
- Rich diff view for edits
- Edit notifications to thread followers
