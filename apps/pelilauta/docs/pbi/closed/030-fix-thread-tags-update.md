# PBI-030: Fix Thread Tags Update from Editor

**Status:** Superseded by PBI-031  
**Priority:** High  
**Type:** Bug Fix  
**Estimated Effort:** 2-4 hours  
**Created:** October 17, 2025

**⚠️ SUPERSEDED:** This PBI has been superseded by **PBI-031: Migrate Thread Updates to SSR API**, which addresses this issue as part of a broader migration to server-side thread updates. The tag fix is included in that PBI along with cache purging, proper validation, and consistency improvements.

---

## Problem Statement

Thread tags are **not being saved to the tag index** when editing an existing thread, unlike pages which correctly update the tag index. This creates an inconsistency where:

1. **Pages**: Tag index is updated on both creation AND editing (via `updatePageTags()`)
2. **Threads**: Tag index is only updated on creation (server-side in background tasks)
3. **Thread edits**: Tag index is NOT updated, causing stale or missing tag data

### Current Behavior

**Page Flow (Working Correctly):**
```typescript
// src/firebase/client/page/updatePage.ts
export async function updatePage(siteKey, pageKey, changes) {
  // 1. Add revision
  await addPageRevision(current, changes);
  
  // 2. Update page document
  await updateDoc(pageRef, toFirestoreEntry(changes));
  
  // 3. Update page references
  await updatePageRef(updatedPage);
  
  // 4. ✅ Update tag index
  await updatePageTags(updatedPage);
  
  // 5. Purge cache
  await purgeCacheForPage(siteKey, pageKey);
}
```

**Thread Flow (Broken for Edits):**
```typescript
// src/firebase/client/threads/updateThread.ts
export async function updateThread(data: Partial<Thread>, silent = false) {
  // 1. Update thread document
  await updateDoc(threadRef, {
    ...data,
    flowTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // ❌ Missing: await updateThreadTags(data);
  // ❌ Missing: cache purging
}
```

**Thread Creation (Working on Server):**
```typescript
// src/pages/api/threads/create.ts - Background tasks
if (thread.tags && thread.tags.length > 0) {
  const tagData = TagSchema.parse({
    key: threadKey,
    title: thread.title,
    type: 'thread',
    author: uid,
    tags: thread.tags,
    flowTime: toDate(thread.flowTime).getTime(),
  });
  
  await serverDB
    .collection(TAG_FIRESTORE_COLLECTION)
    .doc(threadKey)
    .set(tagData);
}
```

### Impact

- **Tag pages** (`/tags/[tag]`) show outdated thread titles if edited
- **Tag pages** don't reflect tag additions/removals from thread edits
- **Search/Discovery**: Threads with updated tags are not findable via those tags
- **Inconsistent data**: Tag index and thread documents fall out of sync

---

## Proposed Solution

Add `updateThreadTags()` call to the `updateThread()` function, mirroring the page update flow.

### Implementation Steps

#### 1. Update `updateThread()` to Save Tags

**File:** `src/firebase/client/threads/updateThread.ts`

```typescript
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';
import { updateThreadTags } from './updateThreadTags'; // Import the existing helper

export async function updateThread(data: Partial<Thread>, silent = false) {
  if (!data.key) {
    throw new Error('Thread key is required to update thread');
  }

  const { doc, getFirestore, updateDoc, serverTimestamp, getDoc } = await import(
    'firebase/firestore'
  );

  const threadRef = doc(getFirestore(), THREADS_COLLECTION_NAME, data.key);

  if (silent) {
    // Silent update - only update the provided fields without touching timestamps
    await updateDoc(threadRef, data);
  } else {
    // Normal update - include timestamp updates
    await updateDoc(threadRef, {
      ...data,
      flowTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // NEW: Update tag index if tags are present in the update
  if (data.tags !== undefined || data.title !== undefined) {
    // Re-read the thread document to get the complete data with server timestamps
    const updatedDoc = await getDoc(threadRef);
    if (updatedDoc.exists()) {
      const completeThread = {
        key: data.key,
        ...updatedDoc.data(),
        ...data, // Overlay the changes we know about
      } as Thread;
      
      await updateThreadTags(completeThread);
    }
  }
}
```

**Key Changes:**
- Import and call `updateThreadTags()` after document update
- Only update tags if `tags` or `title` fields are being modified
- Re-read the document to ensure we have complete thread data with server timestamps
- Overlay the changes to ensure tags are up-to-date

#### 2. Optional: Add Cache Purging for Threads

**File:** `src/firebase/client/threads/updateThread.ts`

```typescript
// After tag update, add cache purging
if (data.tags !== undefined || data.title !== undefined) {
  // ... existing tag update code ...
  
  // NEW: Purge caches for affected tag pages
  try {
    const { purgeThreadCaches } = await import('../cache/purgeCacheHelpers');
    await purgeThreadCaches(data.key, completeThread.tags || []);
  } catch (error) {
    // Cache purging failures should not block thread updates
    logDebug('updateThread', 'Cache purging failed but thread update succeeded', error);
  }
}
```

**Note:** Requires implementing `purgeThreadCaches()` helper if not already available.

---

## Testing Plan

### Unit Tests

**File:** `test/lib/threads-update.test.ts` (or similar)

```typescript
describe('Thread Tag Updates', () => {
  it('should update tag index when thread tags are modified', async () => {
    // 1. Create thread with initial tags
    const threadKey = await createThreadApi({
      title: 'Test Thread',
      markdownContent: 'Content with #initialTag',
      tags: ['initialTag'],
      // ... other required fields
    }, []);
    
    // 2. Wait for background tasks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Verify tag index entry exists
    const tagDoc = await getDoc(doc(getFirestore(), TAG_FIRESTORE_COLLECTION, threadKey));
    expect(tagDoc.exists()).toBe(true);
    expect(tagDoc.data()?.tags).toEqual(['initialTag']);
    
    // 4. Update thread with new tags
    await updateThread({
      key: threadKey,
      title: 'Updated Thread',
      tags: ['initialTag', 'newTag'],
    });
    
    // 5. Verify tag index was updated
    const updatedTagDoc = await getDoc(doc(getFirestore(), TAG_FIRESTORE_COLLECTION, threadKey));
    expect(updatedTagDoc.data()?.tags).toEqual(['initialTag', 'newTag']);
    expect(updatedTagDoc.data()?.title).toBe('Updated Thread');
  });
  
  it('should remove tag index entry when tags are cleared', async () => {
    // 1. Create thread with tags
    const threadKey = await createThreadApi({
      title: 'Test Thread',
      tags: ['testTag'],
      // ... other required fields
    }, []);
    
    // 2. Update thread to remove all tags
    await updateThread({
      key: threadKey,
      tags: [],
    });
    
    // 3. Verify tag index entry was removed
    const tagDoc = await getDoc(doc(getFirestore(), TAG_FIRESTORE_COLLECTION, threadKey));
    expect(tagDoc.exists()).toBe(false);
  });
});
```

### E2E Tests

**File:** `e2e/thread-tags.spec.ts` (new file)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Thread Tag Editing', () => {
  test('should update tag index when editing thread tags', async ({ page }) => {
    // 1. Create a thread with #testTag in content
    await page.goto('/channels/general');
    await page.getByTestId('new-thread-button').click();
    await page.fill('[name="title"]', 'Test Thread for Tags');
    await page.fill('[name="markdownContent"]', 'Content with #testTag');
    await page.getByTestId('send-thread-button').click();
    
    // 2. Wait for navigation to thread page
    await page.waitForURL(/\/threads\/.+/);
    const threadUrl = page.url();
    
    // 3. Wait a bit for background tasks
    await page.waitForTimeout(2000);
    
    // 4. Navigate to tag page and verify thread appears
    await page.goto('/tags/testtag');
    await expect(page.getByText('Test Thread for Tags')).toBeVisible();
    
    // 5. Go back and edit the thread - change title and add tag
    await page.goto(threadUrl);
    await page.getByTestId('edit-thread-button').click();
    await page.fill('[name="title"]', 'Updated Test Thread');
    await page.fill('[name="markdownContent"]', 'Content with #testTag and #anotherTag');
    await page.getByTestId('send-thread-button').click();
    
    // 6. Verify tag index was updated - check original tag
    await page.goto('/tags/testtag');
    await expect(page.getByText('Updated Test Thread')).toBeVisible();
    
    // 7. Verify new tag also has the thread
    await page.goto('/tags/anothertag');
    await expect(page.getByText('Updated Test Thread')).toBeVisible();
  });
});
```

### Manual Testing Checklist

- [ ] Create a new thread with tags (e.g., `#d&d #pathfinder`)
- [ ] Verify thread appears on both tag pages (`/tags/d&d`, `/tags/pathfinder`)
- [ ] Edit the thread to change title
- [ ] Verify tag pages show the updated title
- [ ] Edit the thread to add a new tag (`#5e`)
- [ ] Verify thread appears on new tag page (`/tags/5e`)
- [ ] Edit the thread to remove one tag (remove `#pathfinder`)
- [ ] Verify thread no longer appears on removed tag page
- [ ] Edit the thread to remove all tags
- [ ] Verify thread is removed from all tag pages

---

## Rollout Plan

### Phase 1: Implementation (1-2 hours)
1. Update `updateThread()` function with tag update logic
2. Add logging to track tag updates
3. Local testing with manual thread edits

### Phase 2: Testing (1-2 hours)
1. Run unit tests
2. Run E2E tests
3. Manual verification of tag update flow

### Phase 3: Deployment (Low Risk)
1. Deploy to production
2. Monitor logs for any tag update errors
3. Spot-check a few edited threads on tag pages

### Rollback Plan

If issues arise:
1. **Revert commit** - Single file change, easy rollback
2. **Deploy previous version** - Netlify instant rollback
3. **No data corruption** - Tag index updates are additive, no breaking changes

**Risk Level:** Low
- Single function modification
- Uses existing, tested `updateThreadTags()` helper
- Mirrors working page update flow
- No schema changes

---

## Related Files

**Core Files to Modify:**
- `src/firebase/client/threads/updateThread.ts` - Add tag update call

**Reference Files (No Changes Needed):**
- `src/firebase/client/threads/updateThreadTags.ts` - Existing helper (already works correctly)
- `src/firebase/client/page/updatePage.ts` - Reference for correct pattern
- `src/pages/api/threads/create.ts` - Shows tag creation on server

**Testing Files:**
- New: `test/lib/threads-update.test.ts`
- New: `e2e/thread-tags.spec.ts`

---

## Acceptance Criteria

- [ ] Thread tag updates are saved to tag index when editing threads
- [ ] Thread title updates are reflected in tag index
- [ ] Removing tags from threads removes entries from tag index
- [ ] Tag pages show correct thread titles after edits
- [ ] Existing thread creation flow is not affected
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing checklist completed
- [ ] No performance degradation

---

## Notes

### Why This Was Missed

The discrepancy arose because:
1. **Thread creation** uses server-side API with background tasks that handle tags
2. **Thread editing** uses client-side `updateThread()` which was never extended to handle tags
3. **Page updates** handle tags correctly because they were implemented together from the start

### Performance Considerations

- Tag updates are lightweight Firestore writes
- No additional reads required (we already read the thread document)
- Async/await pattern ensures tags are updated before function returns
- No user-facing latency impact (happens after successful thread update)

### Future Improvements

Consider these follow-up improvements (out of scope for this PBI):
1. Move tag updates to server-side for consistency
2. Add cache purging for thread tag pages
3. Implement tag synonym resolution for threads
4. Add tag analytics/trending for threads
