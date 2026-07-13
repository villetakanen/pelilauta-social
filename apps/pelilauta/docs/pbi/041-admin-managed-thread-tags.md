# PBI-041: Thread Labels (Moderator-Managed Tags)

**Priority:** Medium  
**Type:** Feature Enhancement  
**Estimated Effort:** 8-12 hours  

**User Story:** As a forum administrator, I want to add labels to threads that persist through user edits, so that I can improve content discovery and categorization without users accidentally removing my organizational tags.

## Terminology

- **Tags** (`thread.tags`): User-generated tags extracted from markdown content (hashtags like `#dnd #lfg`)
- **Labels** (`thread.labels`): Moderator/admin-assigned tags that are manually added, not extracted from content
- Both tags and labels appear together in the tag index for content discovery

---

## Problem Statement

Currently, thread tags are entirely controlled by thread authors through their markdown content (hashtags). This creates several issues for forum moderation and content organization:

1. **No Admin Curation**: Admins cannot add persistent labels to help users discover content
2. **Tags Lost on Edit**: If an admin manually adds tags to a thread document, they're lost when the user edits the thread (tags are re-extracted from content)
3. **Limited Categorization**: Users may not tag their content optimally for discovery
4. **Moderation Gap**: No way to add persistent labels for content warnings, topic categories, or system-level organization
5. **Community Standards**: Cannot enforce consistent labeling for special categories (events, announcements, etc.)

### Current Behavior

**Thread Update Flow:**
```typescript
// src/pages/api/threads/[threadKey].ts
export async function PUT({ params, request }: APIContext) {
  // 1. Verify user is thread owner
  if (!existingThread.owners?.includes(uid)) {
    return 403 Forbidden
  }
  
  // 2. Update thread with new data including tags
  await threadRef.update(toFirestoreEntry(updateData));
  
  // 3. Update tag index with ALL tags from thread
  if (updatedThread.tags && updatedThread.tags.length > 0) {
    await serverDB
      .collection(TAG_FIRESTORE_COLLECTION)
      .doc(threadKey)
      .set(tagData); // Uses thread.tags directly
  }
}
```

**Problem:** When a user edits their thread:
1. Client extracts tags from markdown content (e.g., `#dnd #pathfinder`)
2. Client sends `tags: ['dnd', 'pathfinder']` to API
3. API overwrites entire `tags` field
4. Any admin-added tags are lost

### Example Scenario

1. User creates thread: "Looking for D&D group" with content `#dnd #lfg`
2. Thread gets tags: `['dnd', 'lfg']`
3. Admin adds tag `beginner-friendly` to help new players find it
4. Thread now has tags: `['dnd', 'lfg', 'beginner-friendly']`
5. User edits thread to fix a typo in content
6. Client re-extracts tags from content: `['dnd', 'lfg']`
7. **Label `beginner-friendly` is lost** ❌

### Visual Examples

**Before (Current System):**
```
Thread: "Looking for D&D Group"
Tags: [#dnd] [#lfg]
         ↑       ↑
    (all user tags from content)

User edits content → all tags re-extracted
Admin cannot add persistent labels
```

**After (With Labels):**
```
Thread: "Looking for D&D Group"
Tags (user):   [#dnd] [#lfg]
Labels (mod):  [#beginner-friendly] [#quality-content]
                     ↑                    ↑
           (visually distinct with accent color)

Combined in Tag Index: ['dnd', 'lfg', 'beginner-friendly', 'quality-content']

User edits content → only user tags updated
Labels persist unchanged ✓
```

**Admin UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ ADMIN ▼                                     │
├─────────────────────────────────────────────┤
│ [Delete Thread]                             │
│                                             │
│ Move to channel: [General ▼]                │
│                                             │
│ Thread Labels                               │
│ ┌─────────────────────────┐ [Add]          │
│ │ Add label...            │                │
│ └─────────────────────────────┘             │
│                                             │
│ [#dnd]  [#lfg]                             │
│  tag     tag                               │
│                                             │
│ [#beginner-friendly ×]  [#quality-content ×]│
│      label                     label        │
│                                             │
│ Legend:                                     │
│ ● Label (mod)   ○ Tag (user)               │
└─────────────────────────────────────────────┘
```

### Data Flow Diagram

**Current Flow (Problem):**
```
┌──────────────┐
│ User Edits   │
│ Thread       │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│ Extract tags from markdown       │
│ content (hashtags)               │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ API: PUT /api/threads/[key]      │
│ body: { tags: ['dnd', 'lfg'] }   │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Firestore: UPDATE thread         │
│ SET tags = ['dnd', 'lfg']        │
│ ❌ Overwrites ALL tags           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Label 'beginner-friendly'        │
│ is LOST ❌                        │
└──────────────────────────────────┘
```

**Proposed Flow (Solution):**
```
┌──────────────┐                    ┌──────────────┐
│ User Edits   │                    │ Admin Adds   │
│ Thread       │                    │ Label        │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       ▼                                   ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ Extract user tags        │    │ API: POST                │
│ from content             │    │ /api/threads/[key]/      │
└──────┬───────────────────┘    │ labels                   │
       │                        │ ✓ Requires isAdmin()     │
       ▼                        └──────┬───────────────────┘
┌──────────────────────────┐           │
│ API: PUT                 │           │
│ /api/threads/[key]       │           │
│ body: {                  │           │
│   tags: ['dnd', 'lfg']   │           │
│ }                        │           │
└──────┬───────────────────┘           │
       │                               │
       ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ UPDATE thread            │    │ UPDATE thread            │
│ SET tags = [user tags]   │    │ SET labels = [...]       │
│ ✓ labels untouched       │    │ ✓ tags untouched         │
└──────┬───────────────────┘    └──────┬───────────────────┘
       │                               │
       └───────────┬───────────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │ getAllThreadTags()            │
       │ Combines: tags + labels       │
       │ Deduplicates                  │
       └───────────┬───────────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │ Update Tag Index              │
       │ with COMBINED tags            │
       │ ['dnd', 'lfg',                │
       │  'beginner-friendly']         │
       └───────────┬───────────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │ Purge Cache                   │
       │ - thread-{key}                │
       │ - tag-dnd, tag-lfg, etc.      │
       └───────────────────────────────┘
```

---

## Current Implementation Analysis

### Thread Schema
**File:** `src/schemas/ThreadSchema.ts`

```typescript
export const ThreadSchema = ContentEntrySchema.extend({
  title: z.string(),
  channel: z.string(),
  tags: z.array(z.string()).optional(), // From ContentEntrySchema
  // ... other fields
});
```

### Tag Index Schema
**File:** `src/schemas/TagSchema.ts`

Tags are indexed in the `tags` collection for discovery:
```typescript
export const TagSchema = z.object({
  key: z.string(),
  title: z.string(),
  type: z.enum(['page', 'thread', 'site']),
  author: z.string(),
  tags: z.array(z.string()), // All tags for this content
  flowTime: z.number(),
});
```

### Admin Tools Pattern
**File:** `src/components/svelte/threads/ThreadAdminActions.svelte`

Existing admin tools for threads:
- Delete thread
- Move thread to different channel

Admin access controlled by:
- `showAdminTools` store (client-side UI flag)
- `isAdmin(uid)` function (server-side verification)

---

## Proposed Solution

Add a separate `labels` field to threads that:
1. **Persists through user edits** - Never touched by normal thread updates
2. **Admin-only modification** - Only admins can add/remove labels
3. **Merged for discovery** - Combined with user tags for tag index and UI
4. **Visually distinct** - Labels shown with different styling to indicate curation

### Key Principle

**For any content entry (thread, page, site):**
- **Tags** are extracted from content fields (markdown, description, etc.)
- **Labels** are manually assigned metadata, never extracted from content

### Schema Changes

#### 1. Update ThreadSchema

**File:** `src/schemas/ThreadSchema.ts`

```typescript
export const ThreadSchema = ContentEntrySchema.extend({
  title: z.string(),
  channel: z.string(),
  tags: z.array(z.string()).optional(),     // User tags (from content)
  labels: z.array(z.string()).optional(),   // NEW: Moderator labels (manual)
  // ... other fields
});
```

**Migration:** Field is optional, existing threads continue to work without changes.

#### 2. Helper Functions

**File:** `src/utils/shared/threadTagHelpers.ts` (new)

```typescript
import type { Thread } from '@schemas/ThreadSchema';

/**
 * Get all tags for a thread (user tags + labels combined)
 * Used for tag index and discovery
 */
export function getAllThreadTags(thread: Partial<Thread>): string[] {
  const userTags = thread.tags || [];
  const labels = thread.labels || [];
  
  // Combine and deduplicate (in case of overlap)
  const allTags = [...new Set([...userTags, ...labels])];
  
  return allTags;
}

/**
 * Check if a tag is a label (moderator-assigned)
 */
export function isLabel(thread: Partial<Thread>, tag: string): boolean {
  return (thread.labels || []).includes(tag);
}

/**
 * Normalize tag for comparison (lowercase, trim)
 */
export function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}
```

### API Changes

#### 1. Update Thread Update Endpoint

**File:** `src/pages/api/threads/[threadKey].ts`

**Modify PUT handler:**
```typescript
export async function PUT({ params, request }: APIContext) {
  // ... existing authentication and validation ...

  // 5. Validate and prepare update data
  const allowedFields = [
    'title',
    'markdownContent',
    'channel',
    'tags',        // User tags - allowed for owners
    // labels NOT in allowedFields - cannot be modified via normal update
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

  // ... rest of update logic ...
  
  // 8. Update tag index with COMBINED tags
  if (
    JSON.stringify(updatedThread.tags) !== JSON.stringify(existingThread.tags) ||
    updatedThread.title !== existingThread.title
  ) {
    // Use helper to get all tags (user + admin)
    const { getAllThreadTags } = await import('@utils/shared/threadTagHelpers');
    const allTags = getAllThreadTags(updatedThread);
    
    if (allTags.length > 0) {
      const tagData = toTagData(
        { ...updatedThread, tags: allTags }, // Override with combined tags
        threadKey,
        'thread',
        toDate(updatedThread.flowTime).getTime(),
      );

      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .set(tagData);
    } else {
      // Remove from tag index if no tags at all
      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .delete();
    }
  }
}
```

#### 2. Create Labels API Endpoint

**File:** `src/pages/api/threads/[threadKey]/labels.ts` (new)

```typescript
import { serverDB } from '@firebase/server';
import { isAdmin } from '@firebase/server/admin';
import { TAG_FIRESTORE_COLLECTION } from '@schemas/TagSchema';
import {
  THREADS_COLLECTION_NAME,
  type Thread,
  ThreadSchema,
} from '@schemas/ThreadSchema';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { toDate } from '@utils/schemaHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { toTagData } from '@utils/shared/toTagData';
import { getAllThreadTags, normalizeTag } from '@utils/shared/threadTagHelpers';
import type { APIContext } from 'astro';

/**
 * Manage labels for a thread
 * POST /api/threads/[threadKey]/labels - Add label(s)
 * DELETE /api/threads/[threadKey]/labels - Remove label(s)
 */

async function verifyAdmin(request: Request): Promise<string | Response> {
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userIsAdmin = await isAdmin(uid);
  if (!userIsAdmin) {
    return new Response('Forbidden: Admin privileges required', {
      status: 403,
    });
  }

  return uid;
}

/**
 * Add admin tag(s) to a thread
 */
export async function POST({ params, request }: APIContext): Promise<Response> {
  const endpointName = 'addAdminTags';
  const { threadKey } = params;

  if (!threadKey) {
    return new Response('Thread key required', { status: 400 });
  }

  // 1. Verify admin
  const uidOrResponse = await verifyAdmin(request);
  if (typeof uidOrResponse !== 'string') {
    return uidOrResponse;
  }
  const uid = uidOrResponse;

  try {
    // 2. Parse request body
    const body = await request.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return new Response('Tags array required', { status: 400 });
    }

    // Normalize tags
    const normalizedTags = tags.map(normalizeTag);

    logDebug(endpointName, 'Adding labels', {
      threadKey,
      uid,
      tags: normalizedTags,
    });

    // 3. Get existing thread
    const threadRef = serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return new Response('Thread not found', { status: 404 });
    }

    const thread = ThreadSchema.parse({
      key: threadKey,
      ...threadDoc.data(),
    });

    // 4. Add new labels (deduplicate)
    const existingAdminTags = thread.labels || [];
    const updatedAdminTags = [
      ...new Set([...existingAdminTags, ...normalizedTags]),
    ];

    // 5. Update thread document
    await threadRef.update({
      labels: updatedAdminTags,
    });

    logDebug(endpointName, 'Admin tags updated', {
      threadKey,
      oldCount: existingAdminTags.length,
      newCount: updatedAdminTags.length,
    });

    // 6. Update tag index with combined tags
    const updatedThread = { ...thread, labels: updatedAdminTags };
    const allTags = getAllThreadTags(updatedThread);

    if (allTags.length > 0) {
      const tagData = toTagData(
        { ...updatedThread, tags: allTags },
        threadKey,
        'thread',
        toDate(thread.flowTime).getTime(),
      );

      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .set(tagData);

      logDebug(endpointName, 'Tag index updated', {
        threadKey,
        totalTags: allTags.length,
      });
    }

    // 7. Purge cache
    try {
      const { NetlifyCachePurger } = await import(
        '../../../../lib/server/netlify-cache'
      );
      const purger = new NetlifyCachePurger();

      if (purger.isConfigured()) {
        const cacheTags = [
          `thread-${threadKey}`,
          ...normalizedTags.map((tag) => `tag-${tag}`),
        ];
        await purger.purgeTags(cacheTags);

        logDebug(endpointName, 'Cache purged', {
          threadKey,
          tagCount: cacheTags.length,
        });
      }
    } catch (error) {
      logWarn(endpointName, 'Cache purging failed:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        labels: updatedAdminTags,
        allTags,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    logError(endpointName, 'Failed to add labels:', error);
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
 * Remove admin tag(s) from a thread
 */
export async function DELETE({
  params,
  request,
}: APIContext): Promise<Response> {
  const endpointName = 'removeAdminTags';
  const { threadKey } = params;

  if (!threadKey) {
    return new Response('Thread key required', { status: 400 });
  }

  // 1. Verify admin
  const uidOrResponse = await verifyAdmin(request);
  if (typeof uidOrResponse !== 'string') {
    return uidOrResponse;
  }
  const uid = uidOrResponse;

  try {
    // 2. Parse request body
    const body = await request.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return new Response('Tags array required', { status: 400 });
    }

    // Normalize tags
    const normalizedTags = tags.map(normalizeTag);

    logDebug(endpointName, 'Removing labels', {
      threadKey,
      uid,
      tags: normalizedTags,
    });

    // 3. Get existing thread
    const threadRef = serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return new Response('Thread not found', { status: 404 });
    }

    const thread = ThreadSchema.parse({
      key: threadKey,
      ...threadDoc.data(),
    });

    // 4. Remove specified labels
    const existingAdminTags = thread.labels || [];
    const updatedAdminTags = existingAdminTags.filter(
      (tag) => !normalizedTags.includes(normalizeTag(tag)),
    );

    // 5. Update thread document
    await threadRef.update({
      labels: updatedAdminTags,
    });

    logDebug(endpointName, 'Admin tags updated', {
      threadKey,
      oldCount: existingAdminTags.length,
      newCount: updatedAdminTags.length,
      removed: existingAdminTags.length - updatedAdminTags.length,
    });

    // 6. Update tag index with combined tags
    const updatedThread = { ...thread, labels: updatedAdminTags };
    const allTags = getAllThreadTags(updatedThread);

    if (allTags.length > 0) {
      const tagData = toTagData(
        { ...updatedThread, tags: allTags },
        threadKey,
        'thread',
        toDate(thread.flowTime).getTime(),
      );

      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .set(tagData);

      logDebug(endpointName, 'Tag index updated', {
        threadKey,
        totalTags: allTags.length,
      });
    } else {
      // Remove from tag index if no tags at all
      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .delete();

      logDebug(endpointName, 'Removed from tag index (no tags left)', {
        threadKey,
      });
    }

    // 7. Purge cache
    try {
      const { NetlifyCachePurger } = await import(
        '../../../../lib/server/netlify-cache'
      );
      const purger = new NetlifyCachePurger();

      if (purger.isConfigured()) {
        const cacheTags = [
          `thread-${threadKey}`,
          ...normalizedTags.map((tag) => `tag-${tag}`),
        ];
        await purger.purgeTags(cacheTags);

        logDebug(endpointName, 'Cache purged', {
          threadKey,
          tagCount: cacheTags.length,
        });
      }
    } catch (error) {
      logWarn(endpointName, 'Cache purging failed:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        labels: updatedAdminTags,
        allTags,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    logError(endpointName, 'Failed to remove labels:', error);
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
```

### Styling and Design Principles

**CRITICAL: Follow Cyan Design System patterns - NO component-level `<style>` tags**

Per `AGENTS.md`:
> Avoid writing `<style>` tags inside the Svelte components, as we are using Lit + external CSS design system classes and atomics for styling.

#### Styling Approach

**Use Cyan DS classes and utilities:**
- **Base component styles**: `.cn-tag`, `.cn-card`, `.cn-button`, etc.
- **Utility classes**: `.flex`, `.gap-1`, `.wrap`, `.p-2`, `.mt-1`, etc.
- **Typography**: `.text-caption`, `.downscaled`, `.text-low`, `.text-high`
- **Visual utilities**: `.radius-s`, `.radius-m`, `.radius-round`, `.border`, `.elevated`
- **Theme classes**: `.accent` for accent color theme
- **Inline styles**: Only for design tokens (e.g., `style="border: 1px solid var(--color-accent)"`)

#### Visual Design

**Labels (moderator-assigned):**
```svelte
<span 
  class="cn-tag elevated accent" 
  style="border: 1px solid var(--color-accent)"
>
  #label-name
</span>
```

**Tags (user-generated):**
```svelte
<span class="cn-tag">
  #tag-name
</span>
```

**Why this approach:**
- ✅ Consistent with design system
- ✅ Lightweight components
- ✅ Easier theming and maintenance
- ✅ No CSS specificity conflicts
- ✅ Better performance (shared styles)

---

### UI Changes

#### 1. Label Manager Component

**File:** `src/components/svelte/threads/LabelManager.svelte` (new)

```svelte
<script lang="ts">
import type { Thread } from '@schemas/ThreadSchema';
import { getAllThreadTags, isLabel } from '@utils/shared/threadTagHelpers';
import { authedFetch } from '@utils/client/authedFetch';
import { pushSnack } from '@utils/client/snackUtils';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';

interface Props {
  thread: Thread;
}

const { thread }: Props = $props();

let newLabel = $state('');
let updating = $state(false);

const allTags = $derived(getAllThreadTags(thread));
const labels = $derived(thread.labels || []);

async function addLabel() {
  if (!newLabel.trim() || updating) return;

  const label = newLabel.trim().toLowerCase();
  
  // Check if label already exists
  if (allTags.includes(label)) {
    pushSnack(t('admin:thread_labels.already_exists'));
    return;
  }

  updating = true;

  try {
    const response = await authedFetch(
      `/api/threads/${thread.key}/labels`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [label] }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add label: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local thread object
    thread.labels = result.labels;
    
    logDebug('LabelManager', 'Label added', { label });
    pushSnack(t('admin:thread_labels.added'));
    
    // Clear input
    newLabel = '';
  } catch (error) {
    logError('LabelManager', 'Failed to add label:', error);
    pushSnack(t('admin:thread_labels.add_failed'));
  } finally {
    updating = false;
  }
}

async function removeLabel(label: string) {
  if (updating) return;

  updating = true;

  try {
    const response = await authedFetch(
      `/api/threads/${thread.key}/labels`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [label] }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove label: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local thread object
    thread.labels = result.labels;
    
    logDebug('LabelManager', 'Label removed', { label });
    pushSnack(t('admin:thread_labels.removed'));
  } catch (error) {
    logError('LabelManager', 'Failed to remove label:', error);
    pushSnack(t('admin:thread_labels.remove_failed'));
  } finally {
    updating = false;
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addLabel();
  }
}
</script>

<section class="p-2">
  <h3 class="text-caption downscaled">{t('admin:thread_labels.title')}</h3>
  <p class="text-caption downscaled text-low mt-05">
    {t('admin:thread_labels.description')}
  </p>
  
  <!-- Add new label -->
  <div class="flex gap-1 mt-1">
    <input
      type="text"
      bind:value={newLabel}
      onkeypress={handleKeyPress}
      placeholder={t('admin:thread_labels.add_placeholder')}
      disabled={updating}
      class="grow"
    />
    <button
      onclick={addLabel}
      disabled={!newLabel.trim() || updating}
      class="button"
    >
      {t('actions:add')}
    </button>
  </div>

  <!-- Display all tags and labels -->
  {#if allTags.length > 0}
    <div class="mt-2 flex gap-1 wrap">
      {#each allTags as tag}
        {@const isModLabel = isLabel(thread, tag)}
        <span 
          class="cn-tag {isModLabel ? 'elevated accent' : ''}"
          style={isModLabel ? 'border: 1px solid var(--color-accent)' : ''}
        >
          #{tag}
          {#if isModLabel}
            <button
              onclick={() => removeLabel(tag)}
              disabled={updating}
              class="text-button p-0 ml-05"
              style="font-size: 1.2em; line-height: 1; opacity: 0.7;"
              aria-label={t('actions:remove')}
            >
              ×
            </button>
          {/if}
        </span>
      {/each}
    </div>
  {:else}
    <p class="text-caption downscaled text-low mt-2">
      {t('admin:thread_labels.no_items')}
    </p>
  {/if}

  <!-- Legend -->
  <div class="mt-2 flex gap-2 text-caption downscaled text-low">
    <div class="flex items-center gap-05">
      <span class="radius-round" style="width: 8px; height: 8px; background-color: var(--color-accent); display: inline-block;"></span>
      {t('admin:thread_labels.label')}
    </div>
    <div class="flex items-center gap-05">
      <span class="radius-round" style="width: 8px; height: 8px; background-color: var(--color-faint); display: inline-block;"></span>
      {t('admin:thread_labels.tag')}
    </div>
  </div>
</section>
```

#### 2. Update ThreadAdminActions

**File:** `src/components/svelte/threads/ThreadAdminActions.svelte`

```svelte
<script lang="ts">
import type { Thread } from '@schemas/ThreadSchema';
import { meta, metaLoading } from '@stores/admin/ChannelsAdminStore';
import { showAdminTools } from '@stores/session';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import LabelManager from './LabelManager.svelte'; // NEW

interface Props {
  thread?: Thread;
}
const { thread }: Props = $props();

let updating = $state(false);

$effect(() => {
  void $meta;
});

async function handleChannelChange(event: Event) {
  // ... existing channel change logic ...
}
</script>

{#if $showAdminTools && thread}
  <cn-accordion 
    class="border radius-m"
    title="ADMIN" 
    noun="admin">

    <a
        href={`/threads/${thread?.key}/confirmDelete`}
        class="button text-center text"
      >
        {t('actions:delete')} 
      </a>
    
    <label>
      Move to channel:
      {#if $metaLoading}
        <select disabled>
          <option>Loading channels...</option>
        </select>
      {:else if $meta?.topics && $meta.topics.length > 0}
        <select 
          name="channel"
          onchange={handleChannelChange}
          disabled={updating}
          value={thread.channel}
        >
          {#each $meta.topics as channel}
            <option value={channel.slug}>
              {channel.name}
            </option>
          {/each}
        </select>
      {:else}
        <select disabled>
          <option>No channels available</option>
        </select>
      {/if}
    </label>

    <!-- NEW: Label Manager -->
    <LabelManager {thread} />
  </cn-accordion>
{/if}
```

#### 3. Update Thread Tag Display

**File:** `src/components/server/ThreadsApp/ThreadInfoSection.astro`

Add visual distinction for labels using Cyan DS classes:

```astro
---
// ... existing imports ...
import { getAllThreadTags, isLabel } from '@utils/shared/threadTagHelpers';

// ... existing code ...

const allTags = getAllThreadTags(thread);
---

<!-- Existing thread info section -->

<!-- Tags section -->
{allTags && allTags.length > 0 && (
  <section class="tags-section mt-2">
    <div class="flex gap-1 wrap">
      {allTags.map((tag) => {
        const isModLabel = isLabel(thread, tag);
        return (
          <a 
            href={`/tags/${tag.toLowerCase()}`}
            class={`cn-tag ${isModLabel ? 'elevated accent' : ''}`}
            style={isModLabel ? 'border: 1px solid var(--color-accent)' : ''}
          >
            #{tag}
          </a>
        );
      })}
    </div>
  </section>
)}

```

**Note:** Astro components can use scoped `<style>` tags if needed, but prefer Cyan DS classes when possible. For this feature, all styling is handled via classes and inline design tokens.

### i18n Translations

#### English
**File:** `src/locales/en/admin.ts`

```typescript
export default {
  // ... existing translations ...
  
  thread_labels: {
    title: 'Thread Labels',
    add_placeholder: 'Add label...',
    label: 'Label',
    tag: 'Tag',
    no_items: 'No tags or labels on this thread',
    already_exists: 'This label already exists',
    added: 'Label added',
    add_failed: 'Failed to add label',
    removed: 'Label removed',
    remove_failed: 'Failed to remove label',
    description: 'Labels are moderator-assigned tags that persist through edits',
  },
};
```

#### Finnish
**File:** `src/locales/fi/admin.ts`

```typescript
export default {
  // ... existing translations ...
  
  thread_labels: {
    title: 'Ketjun tunnisteet',
    add_placeholder: 'Lisää tunniste...',
    label: 'Tunniste',
    tag: 'Tagi',
    no_items: 'Ei tageja tai tunnisteita tässä ketjussa',
    already_exists: 'Tämä tunniste on jo olemassa',
    added: 'Tunniste lisätty',
    add_failed: 'Tunnisteen lisäys epäonnistui',
    removed: 'Tunniste poistettu',
    remove_failed: 'Tunnisteen poisto epäonnistui',
    description: 'Tunnisteet ovat moderaattorin lisäämiä tageja, jotka säilyvät muokkausten läpi',
  },
};
```

---

## Testing Plan

### Unit Tests

**File:** `test/utils/threadTagHelpers.test.ts` (new)

```typescript
import { describe, it, expect } from 'vitest';
import {
  getAllThreadTags,
  isAdminTag,
  normalizeTag,
} from '@utils/shared/threadTagHelpers';
import type { Thread } from '@schemas/ThreadSchema';

describe('threadTagHelpers', () => {
  describe('getAllThreadTags', () => {
    it('should return empty array when no tags', () => {
      const thread: Partial<Thread> = {};
      expect(getAllThreadTags(thread)).toEqual([]);
    });

    it('should return only user tags when no labels', () => {
      const thread: Partial<Thread> = {
        tags: ['dnd', 'lfg'],
      };
      expect(getAllThreadTags(thread)).toEqual(['dnd', 'lfg']);
    });

    it('should return only labels when no user tags', () => {
      const thread: Partial<Thread> = {
        labels: ['beginner-friendly', 'featured'],
      };
      expect(getAllThreadTags(thread)).toEqual([
        'beginner-friendly',
        'featured',
      ]);
    });

    it('should combine user and labels', () => {
      const thread: Partial<Thread> = {
        tags: ['dnd', 'lfg'],
        labels: ['beginner-friendly'],
      };
      expect(getAllThreadTags(thread)).toEqual([
        'dnd',
        'lfg',
        'beginner-friendly',
      ]);
    });

    it('should deduplicate overlapping tags', () => {
      const thread: Partial<Thread> = {
        tags: ['dnd', 'lfg'],
        labels: ['dnd', 'featured'], // 'dnd' appears in both
      };
      const result = getAllThreadTags(thread);
      expect(result).toHaveLength(3);
      expect(result).toContain('dnd');
      expect(result).toContain('lfg');
      expect(result).toContain('featured');
    });
  });

  describe('isAdminTag', () => {
    it('should return false when no labels', () => {
      const thread: Partial<Thread> = {
        tags: ['dnd'],
      };
      expect(isAdminTag(thread, 'dnd')).toBe(false);
    });

    it('should return true for admin tag', () => {
      const thread: Partial<Thread> = {
        labels: ['featured'],
      };
      expect(isAdminTag(thread, 'featured')).toBe(true);
    });

    it('should return false for user tag', () => {
      const thread: Partial<Thread> = {
        tags: ['dnd'],
        labels: ['featured'],
      };
      expect(isAdminTag(thread, 'dnd')).toBe(false);
    });
  });

  describe('normalizeTag', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTag('DnD')).toBe('dnd');
    });

    it('should trim whitespace', () => {
      expect(normalizeTag('  dnd  ')).toBe('dnd');
    });

    it('should handle mixed case and whitespace', () => {
      expect(normalizeTag('  BeGinNeR-FrIeNdLy  ')).toBe('beginner-friendly');
    });
  });
});
```

**File:** `test/api/threads-admin-tags.test.ts` (new)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import type { Thread } from '@schemas/ThreadSchema';
// Test API endpoints with mock admin authentication

describe('Admin Tags API', () => {
  let testThreadKey: string;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Setup: Create test thread and get auth tokens
  });

  describe('POST /api/threads/[threadKey]/admin-tags', () => {
    it('should add admin tag when authenticated as admin', async () => {
      // Test adding tag with admin auth
    });

    it('should reject when not authenticated', async () => {
      // Test 401 response
    });

    it('should reject when not admin', async () => {
      // Test 403 response with user token
    });

    it('should deduplicate existing tags', async () => {
      // Test adding same tag twice
    });

    it('should normalize tag case', async () => {
      // Test that 'DnD' and 'dnd' are treated as same tag
    });
  });

  describe('DELETE /api/threads/[threadKey]/admin-tags', () => {
    it('should remove admin tag when authenticated as admin', async () => {
      // Test removing tag with admin auth
    });

    it('should reject when not authenticated', async () => {
      // Test 401 response
    });

    it('should reject when not admin', async () => {
      // Test 403 response with user token
    });

    it('should not affect user tags', async () => {
      // Ensure removing admin tag doesn't touch user tags
    });
  });
});
```

### E2E Tests

**File:** `e2e/admin-thread-tags.spec.ts` (new)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Thread Tags', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    // ... authentication steps ...
  });

  test('should add admin tag to thread', async ({ page }) => {
    // 1. Navigate to a thread
    await page.goto('/threads/test-thread');
    
    // 2. Open admin tools
    await page.click('cn-accordion[title="ADMIN"]');
    
    // 3. Add admin tag
    await page.fill('input[placeholder*="Add admin tag"]', 'featured');
    await page.click('button:has-text("Add")');
    
    // 4. Verify tag appears
    await expect(page.locator('.admin-tag:has-text("#featured")')).toBeVisible();
    
    // 5. Reload page and verify persistence
    await page.reload();
    await expect(page.locator('.admin-tag:has-text("#featured")')).toBeVisible();
  });

  test('should remove admin tag from thread', async ({ page }) => {
    // 1. Navigate to thread with admin tag
    await page.goto('/threads/test-thread-with-admin-tag');
    
    // 2. Open admin tools
    await page.click('cn-accordion[title="ADMIN"]');
    
    // 3. Remove admin tag
    await page.click('.admin-tag:has-text("#featured") .remove-button');
    
    // 4. Verify tag removed
    await expect(page.locator('.admin-tag:has-text("#featured")')).not.toBeVisible();
  });

  test('labels should persist when user edits thread', async ({ page, context }) => {
    // 1. As admin, add admin tag to user's thread
    await page.goto('/threads/user-thread');
    await page.click('cn-accordion[title="ADMIN"]');
    await page.fill('input[placeholder*="Add admin tag"]', 'quality-content');
    await page.click('button:has-text("Add")');
    await expect(page.locator('.admin-tag:has-text("#quality-content")')).toBeVisible();
    
    // 2. Logout and login as thread owner
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Logout")');
    
    // Login as user
    await page.goto('/login');
    // ... user authentication ...
    
    // 3. Edit the thread
    await page.goto('/threads/user-thread');
    await page.click('button[aria-label="Edit thread"]');
    await page.fill('textarea[name="markdownContent"]', 'Updated content #newusertag');
    await page.click('button:has-text("Save")');
    
    // 4. Verify admin tag still present
    await expect(page.locator('.admin-tag:has-text("#quality-content")')).toBeVisible();
    
    // 5. Verify user's new tag also present
    await expect(page.locator('.user-tag:has-text("#newusertag")')).toBeVisible();
  });

  test('labels should be visually distinct from user tags', async ({ page }) => {
    await page.goto('/threads/test-thread-mixed-tags');
    
    // Check admin tag styling
    const label = page.locator('.admin-tag').first();
    await expect(label).toHaveCSS('border-color', /.+/); // Has accent border
    
    // Check user tag styling  
    const userTag = page.locator('.user-tag').first();
    await expect(userTag).toHaveCSS('background-color', /.+/); // Different background
  });

  test('should not allow non-admin to add labels', async ({ page }) => {
    // Login as regular user (not admin)
    await page.goto('/login');
    // ... non-admin authentication ...
    
    // Navigate to a thread
    await page.goto('/threads/test-thread');
    
    // Admin tools should not be visible
    await expect(page.locator('cn-accordion[title="ADMIN"]')).not.toBeVisible();
  });
});
```

### Manual Testing Checklist

- [ ] **Admin Tag Addition**
  - [ ] Can add single admin tag to thread
  - [ ] Can add multiple labels at once
  - [ ] Tags are normalized (lowercase, trimmed)
  - [ ] Cannot add duplicate tags
  - [ ] Success notification appears

- [ ] **Admin Tag Removal**
  - [ ] Can remove labels via X button
  - [ ] Removing admin tag doesn't affect user tags
  - [ ] Success notification appears

- [ ] **Persistence Through User Edits**
  - [ ] Admin adds tag to user's thread
  - [ ] User edits thread content
  - [ ] User adds/removes their own tags
  - [ ] Admin tag remains unchanged
  - [ ] Both tag types appear in tag index

- [ ] **Tag Display**
  - [ ] Admin tags visually distinct (accent color)
  - [ ] User tags use standard styling
  - [ ] Legend shows difference between tag types
  - [ ] Tags clickable and link to tag pages

- [ ] **Tag Index Updates**
  - [ ] Thread appears on admin tag pages
  - [ ] Thread appears on user tag pages
  - [ ] Removing all tags removes from tag index
  - [ ] Cache purged after tag changes

- [ ] **Authorization**
  - [ ] Non-admin users cannot see admin tools
  - [ ] API rejects non-admin tag modifications (403)
  - [ ] API rejects unauthenticated requests (401)

- [ ] **Edge Cases**
  - [ ] Thread with only labels
  - [ ] Thread with only user tags
  - [ ] Thread with overlapping tags
  - [ ] Empty tag string handled gracefully
  - [ ] Very long tag names handled

---

## Migration Strategy

### Phase 1: Schema and Helpers (Non-Breaking)
**Duration:** 2 hours

1. Add `labels` field to `ThreadSchema` (optional, non-breaking)
2. Create `threadTagHelpers.ts` utility file
3. Add unit tests for helper functions
4. Run build and verify no errors

**Deliverable:** Schema supports labels, but no UI or API changes yet

### Phase 2: API Endpoints (Non-Breaking)
**Duration:** 3-4 hours

1. Create `/api/threads/[threadKey]/admin-tags.ts` endpoint
2. Update `/api/threads/[threadKey].ts` to use `getAllThreadTags()` for tag index
3. Add API unit tests
4. Test with Postman/curl

**Deliverable:** Admin tags can be added/removed via API, existing functionality unchanged

### Phase 3: UI Components (Feature-Complete)
**Duration:** 3-4 hours

1. Create `AdminTagManager.svelte` component
2. Update `ThreadAdminActions.svelte` to include tag manager
3. Update `ThreadInfoSection.astro` for visual distinction
4. Add i18n translations
5. Add E2E tests

**Deliverable:** Full UI for admin tag management

### Phase 4: Testing and Refinement
**Duration:** 2 hours

1. Run full test suite
2. Manual testing checklist
3. Fix any bugs or edge cases
4. Performance testing
5. Documentation updates

**Deliverable:** Production-ready feature

---

## Acceptance Criteria

### Core Functionality
- [ ] Admins can add tags to threads without being the owner
- [ ] Admins can remove labels from threads
- [ ] Admin tags persist when thread owner edits the thread
- [ ] User tags and labels are kept separate in thread document
- [ ] Combined tags appear in tag index for discovery

### API Requirements
- [ ] `POST /api/threads/[threadKey]/admin-tags` adds labels
- [ ] `DELETE /api/threads/[threadKey]/admin-tags` removes labels
- [ ] Both endpoints require admin authentication
- [ ] Non-admins receive 403 Forbidden response
- [ ] Unauthenticated requests receive 401 Unauthorized
- [ ] Tag normalization (lowercase, trim) applied consistently
- [ ] Duplicate tags automatically deduplicated

### UI Requirements
- [ ] Admin tag manager appears in ThreadAdminActions accordion
- [ ] Can add tags via input field and button
- [ ] Can add tags via Enter key
- [ ] Can remove labels via X button
- [ ] Cannot remove user tags (no X button shown)
- [ ] Admin tags visually distinct (accent color/border)
- [ ] User tags use standard styling
- [ ] Legend explains difference between tag types
- [ ] Success/error notifications for all actions

### Data Integrity
- [ ] `thread.tags` only modified by thread owner
- [ ] `thread.labels` only modified by admins
- [ ] Tag index always shows combined tags
- [ ] Removing all tags removes entry from tag index
- [ ] Cache purged after tag modifications

### Performance
- [ ] Tag operations complete in < 2 seconds
- [ ] No performance regression on thread update
- [ ] Cache purging works correctly
- [ ] No N+1 queries introduced

### Testing
- [ ] Unit tests for all helper functions pass
- [ ] API endpoint tests pass
- [ ] E2E tests pass
- [ ] Manual testing checklist completed
- [ ] No TypeScript errors
- [ ] Build succeeds

---

## Rollout Plan

### Pre-Deployment Checklist
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Code review completed
- [ ] i18n translations verified
- [ ] No breaking changes to existing functionality

### Deployment Steps

1. **Deploy Phase 1-2** (Backend only)
   - Deploy schema and API changes
   - No UI changes visible to users
   - Monitor logs for any errors
   - Test API with admin account

2. **Deploy Phase 3** (Full Feature)
   - Deploy UI components
   - Monitor for any client-side errors
   - Test full workflow as admin
   - Verify cache purging works

3. **Monitoring** (First 24 hours)
   - Watch error logs for API failures
   - Monitor Firestore write counts
   - Check cache purge success rate
   - Gather admin user feedback

### Rollback Plan

If critical issues arise:

1. **UI Rollback** (Quick - 5 minutes)
   - Revert UI components
   - Admin tag manager disappears
   - API still works but no UI to use it

2. **API Rollback** (Moderate - 15 minutes)
   - Revert API endpoints
   - Revert thread update endpoint changes
   - Admin tags in database remain but unused

3. **Full Rollback** (Complete - 30 minutes)
   - Revert all schema changes
   - Revert helper functions
   - No data loss (labels field simply ignored)

**Risk Level:** Low
- Optional field addition (non-breaking)
- New API endpoints (doesn't affect existing)
- Admin-only feature (limited user impact)
- Gradual rollout possible

---

## Related Documentation

- **PBI-030**: Fix Thread Tags Update (context on tag index updates)
- **PBI-031**: Migrate Thread Updates to SSR API (thread update patterns)
- **PBI-020**: Comprehensive Forum Admin Tool (admin UI patterns)
- **TagSchema**: `src/schemas/TagSchema.ts` (tag index structure)
- **ThreadSchema**: `src/schemas/ThreadSchema.ts` (thread data model)
- **Admin Utilities**: `src/firebase/server/admin.ts` (isAdmin function)
- **Documentation**: `src/docs/entry-labels-and-tags.md` (labels vs tags definition)

---

## File Structure Overview

### Files to Create

```
src/
├── utils/
│   └── shared/
│       └── threadTagHelpers.ts        # Helper functions for tag/label operations
├── pages/
│   └── api/
│       └── threads/
│           └── [threadKey]/
│               └── labels.ts          # API endpoint for label management
├── components/
│   └── svelte/
│       └── threads/
│           └── LabelManager.svelte    # UI component for managing labels
├── docs/
│   └── entry-labels-and-tags.md       # Documentation explaining the distinction
└── test/
    ├── utils/
    │   └── threadTagHelpers.test.ts   # Unit tests for helpers
    ├── api/
    │   └── threads-labels.test.ts     # API endpoint tests
    └── e2e/
        └── thread-labels.spec.ts      # End-to-end tests
```

### Files to Modify

```
src/
├── schemas/
│   └── ThreadSchema.ts                # Add labels field
├── pages/
│   └── api/
│       └── threads/
│           └── [threadKey].ts         # Use getAllThreadTags() for tag index
├── components/
│   ├── svelte/
│   │   └── threads/
│   │       └── ThreadAdminActions.svelte  # Add LabelManager component
│   └── server/
│       └── ThreadsApp/
│           └── ThreadInfoSection.astro    # Visual distinction styling
└── locales/
    ├── en/
    │   └── admin.ts                   # Add thread_labels translations
    └── fi/
        └── admin.ts                   # Add Finnish translations
```

---

## Documentation Requirement

### Create /src/docs Entry Definition

**File:** `src/docs/entry-labels-and-tags.md` (new)

```markdown
# Entry Labels and Tags

## Definitions

For any content entry in the system (threads, pages, sites):

### Tags
**Tags** are content-derived metadata:
- Automatically extracted from content fields (markdown, description, etc.)
- Typically extracted from hashtags in markdown (e.g., `#dnd #lfg`)
- User-controlled through content editing
- Updated whenever content is edited

### Labels
**Labels** are manually-assigned metadata:
- **Not** extracted from content
- Manually added by moderators/admins
- Persistent through content edits
- Used for curation, categorization, and content organization

## Implementation

### Threads
- `thread.tags` - Extracted from `markdownContent`
- `thread.labels` - Manually assigned by admins

### Pages
- `page.tags` - Extracted from content
- `page.labels` - (Future: manually assigned)

### Sites
- `site.tags` - Manually assigned in settings
- (Sites don't have markdown content to extract from)

## Tag Index

The tag index combines both tags and labels for discovery:
- Users can find content via either tags or labels
- `/tags/[tag]` pages show content with that tag OR label
- Visual distinction in UI shows which is which

## Key Principle

**Tags are extracted, Labels are assigned.**
```

This documentation should be:
- [ ] Created in `src/docs/entry-labels-and-tags.md`
- [ ] Linked from main documentation index
- [ ] Referenced in schema JSDoc comments
- [ ] Used as single source of truth for the distinction

## Future Enhancements (Out of Scope)

These improvements could be considered in future PBIs:

1. **Label Templates**: Pre-defined labels for common categories
2. **Bulk Label Operations**: Add/remove labels on multiple threads at once
3. **Label Suggestions**: AI-powered label suggestions based on content
4. **Label Analytics**: Track most-used labels and effectiveness
5. **Label Permissions**: Fine-grained control (who can add which labels)
6. **Label Audit Log**: Track who added/removed which labels when
7. **Tag/Label Aliases**: Map multiple names to canonical tags
8. **Label Categories**: Group labels into categories (content-warning, quality, topic)
9. **Page Labels**: Extend label system to wiki pages

---

## Estimated Effort

- **Phase 1 (Schema):** 2 hours
- **Phase 2 (API):** 3-4 hours
- **Phase 3 (UI):** 3-4 hours
- **Phase 4 (Testing):** 2 hours

**Total:** 10-12 hours

---

## Success Metrics

After 2 weeks in production:

- [ ] At least 5 threads have labels added
- [ ] Zero instances of labels being lost during user edits
- [ ] < 0.5% error rate on admin tag API calls
- [ ] Admin users report improved content organization
- [ ] Tag pages show better content discovery
- [ ] No performance degradation on thread pages

---

## Notes

### Design Decisions

1. **Separate Fields vs. Metadata**: Chose separate `labels` field over metadata flag because:
   - Simpler querying
   - Clearer separation of concerns
   - Easier to implement and maintain

2. **Visual Distinction**: Admin tags use accent color to:
   - Make it clear they're special/official
   - Help users understand content curation
   - Prevent confusion with user tags

3. **No Tag Overlap Validation**: Allow same tag in both user and labels because:
   - Simplifies logic (just deduplicate on display)
   - Users may add tags admins want to preserve
   - Deduplication happens in `getAllThreadTags()`

### Security Considerations

- Admin status verified server-side on every API call
- No client-side trust for admin operations
- Admin endpoints separate from user endpoints
- Proper error messages (no info leakage)

### UX Considerations

- Visual distinction helps users understand admin curation
- Legend explains difference between tag types
- Non-destructive (admins don't remove user tags)
- Clear feedback for all operations