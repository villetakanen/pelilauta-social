# PBI-041 Quick Reference Card

## At a Glance

**Feature:** Admin-managed thread tags that persist through user edits  
**Effort:** 10-12 hours  
**Risk:** Low (optional field, non-breaking)  
**Status:** Open

---

## Problem in 30 Seconds

When users edit threads, all tags are re-extracted from content. Any admin-added tags are lost.

**Example:**
1. User posts: "Looking for D&D group" with `#dnd #lfg`
2. Admin adds tag: `beginner-friendly`
3. User edits post (fixes typo)
4. ❌ Admin tag is lost (tags re-extracted from content)

---

## Solution in 30 Seconds

Add separate `labels` field that:
- Only admins can modify
- Never touched by user edits
- Merged with user tags for discovery
- Visually distinct in UI

---

## Quick Implementation Guide

### 1. Schema Change
```typescript
// src/schemas/ThreadSchema.ts
export const ThreadSchema = ContentEntrySchema.extend({
  tags: z.array(z.string()).optional(),        // User tags
  labels: z.array(z.string()).optional(),   // NEW: Admin tags
  // ...
});
```

### 2. Helper Functions
```typescript
// src/utils/shared/threadTagHelpers.ts

// Get all tags (user + admin combined)
export function getAllThreadTags(thread: Partial<Thread>): string[] {
  const userTags = thread.tags || [];
  const labels = thread.labels || [];
  return [...new Set([...userTags, ...labels])];
}

// Check if tag is admin-managed
export function isAdminTag(thread: Partial<Thread>, tag: string): boolean {
  return (thread.labels || []).includes(tag);
}

// Normalize tag (lowercase, trim)
export function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}
```

### 3. API Endpoints
```typescript
// src/pages/api/threads/[threadKey]/admin-tags.ts

// Add labels
export async function POST({ params, request }: APIContext) {
  const uid = await tokenToUid(request);
  if (!uid || !(await isAdmin(uid))) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Add tags to thread.labels
  // Update tag index with getAllThreadTags()
  // Purge cache
}

// Remove labels
export async function DELETE({ params, request }: APIContext) {
  // Similar to POST but removes tags
}
```

### 4. Update Thread Endpoint
```typescript
// src/pages/api/threads/[threadKey].ts

// In PUT handler:
const allowedFields = [
  'tags',        // User can update
  // labels NOT in allowedFields - protected!
];

// When updating tag index:
const allTags = getAllThreadTags(updatedThread);
await serverDB.collection('tags').doc(threadKey).set({
  ...tagData,
  tags: allTags, // Combined tags
});
```

### 5. UI Component
```svelte
<!-- src/components/svelte/threads/LabelManager.svelte -->
<script lang="ts">
  const { thread }: Props = $props();
  let newLabel = $state('');
  
  async function addLabel() {
    await authedFetch(`/api/threads/${thread.key}/labels`, {
      method: 'POST',
      body: JSON.stringify({ tags: [newLabel.trim()] }),
    });
  }
</script>

<!-- Use Cyan DS classes and atomics - NO component-level <style> -->
<section class="p-2">
  <input bind:value={newLabel} placeholder="Add label..." class="grow" />
  <button onclick={addLabel}>Add</button>

  <div class="mt-2 flex gap-1 wrap">
    {#each getAllThreadTags(thread) as tag}
      {@const isModLabel = isLabel(thread, tag)}
      <span 
        class="cn-tag {isModLabel ? 'elevated accent' : ''}"
        style={isModLabel ? 'border: 1px solid var(--color-accent)' : ''}
      >
        #{tag}
        {#if isModLabel}
          <button 
            onclick={() => removeLabel(tag)}
            class="text-button p-0 ml-05"
          >
            ×
          </button>
        {/if}
      </span>
    {/each}
  </div>
</section>
```

---

## Key Files

### New Files
- `src/utils/shared/threadTagHelpers.ts` - Helper functions
- `src/pages/api/threads/[threadKey]/admin-tags.ts` - API endpoint
- `src/components/svelte/threads/AdminTagManager.svelte` - UI component
- `test/utils/threadTagHelpers.test.ts` - Unit tests
- `test/api/threads-admin-tags.test.ts` - API tests
- `e2e/admin-thread-tags.spec.ts` - E2E tests

### Modified Files
- `src/schemas/ThreadSchema.ts` - Add `labels` field
- `src/pages/api/threads/[threadKey].ts` - Use `getAllThreadTags()`
- `src/components/svelte/threads/ThreadAdminActions.svelte` - Add tag manager
- `src/components/server/ThreadsApp/ThreadInfoSection.astro` - Visual styling
- `src/locales/en/admin.ts` - Add translations
- `src/locales/fi/admin.ts` - Add translations

---

## Implementation Phases

### Phase 1: Schema (2h)
- Add `labels` field to schema
- Create helper functions
- Unit tests

### Phase 2: API (3-4h)
- Create admin-tags endpoint
- Update thread endpoint
- API tests

### Phase 3: UI (3-4h)
- Create AdminTagManager
- Update ThreadAdminActions
- Update tag display
- E2E tests

### Phase 4: Testing (2h)
- Full test suite
- Manual testing
- Bug fixes

---

## Testing Checklist

### Unit Tests
- [ ] `getAllThreadTags()` combines tags correctly
- [ ] `getAllThreadTags()` deduplicates overlapping tags
- [ ] `isAdminTag()` identifies labels
- [ ] `normalizeTag()` lowercases and trims

### API Tests
- [ ] POST requires admin auth (401 without, 403 for non-admin)
- [ ] POST adds labels successfully
- [ ] DELETE removes labels successfully
- [ ] Tag index updated with combined tags
- [ ] Cache purged after changes

### E2E Tests
- [ ] Add admin tag via UI
- [ ] Remove admin tag via UI
- [ ] Admin tags persist when user edits thread
- [ ] Visual distinction rendered correctly
- [ ] Non-admin cannot see admin tools

### Manual Testing
- [ ] Admin adds tag to thread
- [ ] Thread owner edits content
- [ ] Admin tag still present after edit
- [ ] Both tags appear on tag pages
- [ ] Visual styling correct

---

## Data Structure

### Thread Document (Firestore)
```json
{
  "key": "abc123",
  "title": "Looking for D&D Group",
  "markdownContent": "New to the area... #dnd #lfg",
  "tags": ["dnd", "lfg"],
  "labels": ["beginner-friendly", "quality-content"],
  "owners": ["user123"],
  "channel": "looking-for-group"
}
```

### Tag Index Document (Firestore)
```json
{
  "key": "abc123",
  "title": "Looking for D&D Group",
  "type": "thread",
  "author": "user123",
  "tags": ["dnd", "lfg", "beginner-friendly", "quality-content"],
  "flowTime": 1234567890
}
```

Note: Tag index uses **combined** tags for discovery

---

## API Endpoints

### Add Admin Tags
```http
POST /api/threads/[threadKey]/admin-tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["beginner-friendly", "quality-content"]
}

Response 200:
{
  "success": true,
  "labels": ["beginner-friendly", "quality-content"],
  "allTags": ["dnd", "lfg", "beginner-friendly", "quality-content"]
}
```

### Remove Admin Tags
```http
DELETE /api/threads/[threadKey]/admin-tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["beginner-friendly"]
}

Response 200:
{
  "success": true,
  "labels": ["quality-content"],
  "allTags": ["dnd", "lfg", "quality-content"]
}
```

---

## i18n Keys

```typescript
// English (src/locales/en/admin.ts)
thread_tags: {
  title: 'Admin Tags',
  add_placeholder: 'Add admin tag...',
  admin_tag: 'Admin tag',
  user_tag: 'User tag',
  no_tags: 'No tags on this thread',
  already_exists: 'Tag already exists',
  added: 'Admin tag added',
  add_failed: 'Failed to add admin tag',
  removed: 'Admin tag removed',
  remove_failed: 'Failed to remove admin tag',
}
```

---

## Styling with Cyan DS

**NO component-level `<style>` tags - use Cyan DS classes instead:**

```svelte
<!-- Labels (moderator-assigned) -->
<span class="cn-tag elevated accent" style="border: 1px solid var(--color-accent)">
  #label-name
</span>

<!-- Tags (user-generated) -->
<span class="cn-tag">
  #tag-name
</span>
```

**Key Cyan DS classes used:**
- `.cn-tag` - Base tag styling
- `.elevated` - Elevated background color
- `.accent` - Accent color theme
- `.p-1`, `.p-2`, `.mt-1`, `.mt-2` - Spacing atomics
- `.flex`, `.gap-1`, `.wrap` - Layout utilities
- `.text-caption`, `.downscaled`, `.text-low` - Typography
- `.radius-round` - Border radius

**Why no component styles:**
- We use Cyan Design System classes and atomics
- Keeps components lightweight and consistent
- Easier to maintain and theme

---

## Security Checklist

- [ ] All admin operations verify `isAdmin(uid)` server-side
- [ ] `labels` not in `allowedFields` for normal thread updates
- [ ] Admin endpoints return 401 for unauthenticated
- [ ] Admin endpoints return 403 for non-admin authenticated users
- [ ] No info leakage in error messages
- [ ] Client-side UI only shows admin tools if `$showAdminTools` is true

---

## Common Pitfalls

### ❌ DON'T: Use component-level styles
```svelte
<!-- BAD - Component-level styles not allowed -->
<span class="my-custom-label">Label</span>

<style>
  .my-custom-label {
    background: red;  /* ❌ No component styles */
  }
</style>
```

### ✅ DO: Use Cyan DS classes and atomics
```svelte
<!-- GOOD - Cyan DS classes and design tokens -->
<span class="cn-tag elevated accent" style="border: 1px solid var(--color-accent)">
  Label  <!-- ✅ Uses DS classes and CSS variables -->
</span>
```

### ❌ DON'T: Allow users to modify labels
```typescript
// BAD - allows user to modify labels
const allowedFields = ['tags', 'labels']; // ❌
```

### ✅ DO: Keep labels protected
```typescript
// GOOD - labels not in allowed fields
const allowedFields = ['tags']; // ✅
// labels can only be modified via separate admin endpoint
```

### ❌ DON'T: Use thread.tags for tag index
```typescript
// BAD - only shows user tags
await setDoc(tagDoc, { ...tagData, tags: thread.tags }); // ❌
```

### ✅ DO: Use getAllThreadTags()
```typescript
// GOOD - shows combined tags
const allTags = getAllThreadTags(thread);
await setDoc(tagDoc, { ...tagData, tags: allTags }); // ✅
```

### ❌ DON'T: Trust client-side admin checks
```typescript
// BAD - client can lie about being admin
if (body.isAdmin) { // ❌
  updateAdminTags();
}
```

### ✅ DO: Verify admin server-side
```typescript
// GOOD - server verifies admin status
const uid = await tokenToUid(request);
if (!(await isAdmin(uid))) { // ✅
  return new Response('Forbidden', { status: 403 });
}
```

---

## Rollback Plan

### Quick Rollback (UI only - 5 min)
```bash
git revert <ui-commit>
npm run build
# Admin tag manager disappears, API still works
```

### Medium Rollback (API - 15 min)
```bash
git revert <api-commit> <ui-commit>
npm run build
# Full feature disabled, labels in DB unused but harmless
```

### Full Rollback (30 min)
```bash
git revert <schema-commit> <api-commit> <ui-commit>
npm run build
# Complete revert, no functional changes
```

**Risk:** Low - optional field, no data corruption possible

---

## Success Metrics (2 weeks)

- [ ] At least 5 threads have labels
- [ ] Zero labels lost during user edits
- [ ] < 0.5% error rate on admin tag operations
- [ ] No performance degradation on thread pages
- [ ] Positive admin user feedback

---

## Questions?

See full documentation: `docs/pbi/041-admin-managed-thread-tags.md`
