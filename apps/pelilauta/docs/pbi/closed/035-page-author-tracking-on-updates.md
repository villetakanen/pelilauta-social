# PBI-035: Page Author Tracking on Updates

**Status:** Draft  
**Priority:** Medium  
**Type:** Feature Enhancement  
**Estimated Effort:** Small (2-3 hours)  
**Version Impact:** Minor version bump (requires data model change)

---

## Problem Statement

Pages (wiki pages) do not properly track the `author` field - specifically, the `author` field should always contain the UID of the latest user who saved the page, similar to how threads work. Currently:

1. **Missing `author` field in ContentEntry**: The `ContentEntrySchema` (which `PageSchema` extends) does not include an `author` field, unlike `ThreadSchema` which has it.

2. **No author update on page save**: When a page is created or updated, the `author` field is not set or updated to reflect who made the change.

3. **Author inference from owners[0]**: The system currently uses `owners[0]` as a fallback to determine the author (see `updatePageRef.ts` line 14: `author: owners[0] || '-'`), but this doesn't reflect who actually made the last edit.

4. **Inconsistency with threads**: Threads properly maintain the `author` field and ensure it's always set to `owners[0]` (see `ThreadSchema.ts` lines 59-61).

### Current Behavior

**Page Creation:**
- `addPage()` creates a page with `owners` array containing the creator's UID
- `updatePageRef()` uses `owners[0]` as the author in PageRef
- No `author` field is stored in the page document itself

**Page Update:**
- `updatePage()` adds revision history with the editor's UID as `revision.author`
- Page document's `owners` array is preserved (not updated)
- The actual page document has no `author` field reflecting the last editor

**Expected Behavior (matching threads):**
- Page document should have an `author` field
- `author` should be set to the UID of the user who last saved the page
- The editor should always be in the `owners` array (even if they edited via site-wide or admin access)
- This applies to both creation and updates

---

## User Story

**As a** site member or administrator  
**I want** the system to track who last edited each page  
**So that** we can properly attribute content changes, show accurate author information in page listings, and maintain audit trails for wiki pages.

---

## Acceptance Criteria

### Schema Changes

- [ ] `ContentEntrySchema` includes optional `author: z.string().optional()` field
- [ ] `PageSchema` properly inherits the `author` field from `ContentEntrySchema`
- [ ] `parsePage()` function handles author field appropriately

### Page Creation (addPage)

- [ ] When creating a page, set `author` to the current user's UID
- [ ] Ensure creator is in the `owners` array
- [ ] Both fields are properly stored in Firestore

### Page Update (updatePage)

- [ ] When updating a page, set `author` to the current user's UID (the editor)
- [ ] If the editor is not already in `owners` array, add them
- [ ] Preserve existing owners (don't remove them)
- [ ] Handle cases where user has site-wide or admin access but isn't originally an owner

### Page Reference Updates

- [ ] `updatePageRef()` uses `page.author` instead of `page.owners[0]`
- [ ] `addPageRef()` receives correct author from `updatePageRef()`
- [ ] PageRef author field accurately reflects the last editor

### Backward Compatibility

- [ ] Existing pages without `author` field continue to work
- [ ] `parsePage()` provides fallback: use `owners[0]` if `author` is missing
- [ ] Migration notes documented for existing data

### Display & UI

- [ ] Page listings show the actual last editor (from `author` field)
- [ ] "Latest Changes" component displays correct author
- [ ] Tags page entries show correct author
- [ ] No breaking changes to existing components

---

## Technical Implementation Plan

### Phase 1: Schema Updates

**File:** `src/schemas/ContentEntry.ts`

```typescript
export const ContentEntrySchema = EntrySchema.extend({
  public: z.boolean().optional(),
  sticky: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  markdownContent: z.string().optional(),
  htmlContent: z.string().optional(),
  content: z.string().optional(),
  images: z.array(z.string()).optional(),
  owners: z.array(z.string()),
  author: z.string().optional(), // NEW: Track last editor
});
```

**File:** `src/schemas/PageSchema.ts`

Update `parsePage()` to handle author field:

```typescript
export const parsePage = (
  data: Partial<Page>,
  key = '',
  siteKey = '',
): Page => {
  // ... existing code ...
  
  // Ensure author is set (fallback to owners[0] for backward compatibility)
  const author = data.author || (data.owners?.[0]) || '';

  try {
    return PageSchema.parse({
      ...data,
      siteKey: /* ... existing logic ... */,
      owners: /* ... existing logic ... */,
      flowTime: toDate(data.flowTime).getTime(),
      key,
      revisionHistory,
      markdownContent: data.markdownContent || '',
      author, // NEW: Include author
    });
  } catch (err: unknown) {
    // ... existing error handling ...
  }
};
```

### Phase 2: Update addPage Function

**File:** `src/firebase/client/page/addPage.ts`

```typescript
export async function addPage(
  siteKey: string,
  page: Partial<Page>,
  slug?: string,
) {
  logDebug('addPage', siteKey, page, slug);
  const { getDoc, doc } = await import('firebase/firestore');
  const u = uid.get(); // Get current user
  
  if (!u) {
    throw new Error('Cannot create page: user not authenticated');
  }
  
  // Ensure page has author and owners
  const pageWithAuthor = {
    ...page,
    author: u, // NEW: Set author to current user
    owners: page.owners?.includes(u) ? page.owners : [...(page.owners || []), u],
  };
  
  const key = await addPageToFirestore(siteKey, pageWithAuthor, slug);
  
  // ... rest of existing code ...
}
```

### Phase 3: Update updatePage Function

**File:** `src/firebase/client/page/updatePage.ts`

```typescript
export async function updatePage(
  siteKey: string,
  pageKey: string,
  changes: Partial<Page>,
) {
  const { getFirestore, doc, updateDoc, getDoc } = await import(
    'firebase/firestore'
  );
  const { toFirestoreEntry } = await import(
    'src/utils/client/toFirestoreEntry'
  );
  const db = getFirestore();
  
  const u = uid.get(); // NEW: Get current user
  
  if (!u) {
    throw new Error('Cannot update page: user not authenticated');
  }

  // Get current page
  const pageRef = doc(db, 'sites', siteKey, 'pages', pageKey);
  const currentPagedoc = await getDoc(pageRef);
  
  if (!currentPagedoc.exists())
    throw new Error('updatePage: Page not found before update');
    
  const current = PageSchema.parse(
    toClientEntry({
      ...(currentPagedoc.data() as Record<string, unknown>),
      key: pageKey,
      siteKey,
    }),
  );

  // Add revision to history
  await addPageRevision(current, changes);

  // NEW: Prepare updated changes with author
  const updatedChanges = {
    ...changes,
    author: u, // Set author to current editor
  };
  
  // NEW: Ensure editor is in owners array
  if (!current.owners.includes(u)) {
    updatedChanges.owners = [...current.owners, u];
  }

  // Update page document with changes
  await updateDoc(pageRef, toFirestoreEntry(updatedChanges));

  // ... rest of existing code ...
}
```

### Phase 4: Update updatePageRef Function

**File:** `src/firebase/client/page/updatePageRef.ts`

```typescript
export async function updatePageRef(page: Page) {
  const { addPageRef } = await import('./addPageRef');

  const { key, name, flowTime, category, author } = page; // Use author directly

  await addPageRef(
    {
      key,
      name,
      flowTime,
      category: category || '-',
      author: author || '-', // Use page.author instead of owners[0]
    },
    page.siteKey,
  );
}
```

### Phase 5: Update Form Submission

**File:** `src/components/svelte/page-editor/PageEditorForm.svelte`

The form already preserves owners correctly (line 74: `changes.owners = page.owners || [uid];`), but we should explicitly set author:

```typescript
async function handleSubmission(event: Event) {
  // ... existing code ...
  
  const changes: Partial<Page> = Object.fromEntries(formData.entries());
  changes.markdownContent = editorValue;
  changes.tags = tags;
  changes.owners = page.owners || [$uid]; // Preserve existing
  changes.author = $uid; // NEW: Set current user as author
  
  // ... rest of existing code ...
}
```

**File:** `src/components/svelte/sites/CreatePageForm.svelte`

Already sets owners correctly, but should also set author:

```typescript
const page = PageSchema.parse({
  key: urlKey || '',
  siteKey: site.key,
  name: title,
  markdownContent: `# ${title}\n\n`,
  category: category || '',
  owners: [$uid],
  author: $uid, // NEW: Set current user as author
});
```

---

## Testing Strategy

### Unit Tests

Create `test/schemas/PageSchema.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parsePage, PageSchema } from 'src/schemas/PageSchema';

describe('PageSchema with author field', () => {
  it('should accept author field', () => {
    const page = PageSchema.parse({
      key: 'test-page',
      name: 'Test Page',
      siteKey: 'test-site',
      owners: ['user1', 'user2'],
      author: 'user2',
      markdownContent: '# Test',
      flowTime: Date.now(),
    });
    
    expect(page.author).toBe('user2');
  });
  
  it('should handle missing author field (backward compatibility)', () => {
    const pageData = {
      key: 'test-page',
      name: 'Test Page',
      siteKey: 'test-site',
      owners: ['user1', 'user2'],
      markdownContent: '# Test',
      flowTime: Date.now(),
    };
    
    const page = parsePage(pageData);
    
    // Should fallback to owners[0]
    expect(page.author).toBe('user1');
  });
});
```

### E2E Tests

Update `e2e/page-editor.spec.ts`:

```typescript
test('Page update sets author to current user', async ({ page }) => {
  await authenticate(page, TEST_USERS.NORMAL);
  
  // Navigate to a test page
  await page.goto('http://localhost:4321/sites/e2e-test-site/test-page/edit');
  
  // Make a change
  await page.fill('[name="name"]', 'Updated Page Title');
  await page.click('[data-testid="save-button"]');
  
  // Verify the author field in database
  const { serverDB } = initializeTestFirebase();
  const pageDoc = await serverDB
    .collection('sites')
    .doc('e2e-test-site')
    .collection('pages')
    .doc('test-page')
    .get();
    
  const pageData = pageDoc.data();
  expect(pageData.author).toBe(TEST_USERS.NORMAL);
  expect(pageData.owners).toContain(TEST_USERS.NORMAL);
});
```

### Manual Testing Checklist

- [ ] Create a new page → verify `author` field is set in Firestore
- [ ] Edit a page as the same user → verify `author` remains correct
- [ ] Edit a page as a different owner → verify `author` updates to new editor
- [ ] Edit a page as site admin (not in owners) → verify editor added to owners
- [ ] Check page listings show correct author
- [ ] Verify "Latest Changes" shows correct author
- [ ] Verify tag pages show correct author
- [ ] Test with legacy pages (no author field) → verify fallback works

---

## Migration Considerations

### Data Migration

Since this is an **optional field** with **fallback logic**, no immediate data migration is required. The system will:

1. Continue to work with existing pages that don't have `author` field
2. Use `owners[0]` as fallback when displaying author information
3. Gradually populate the `author` field as pages are edited

### Optional: Batch Migration Script

If we want to backfill all existing pages (recommended for consistency), create `scripts/backfill-page-authors.mjs`:

```javascript
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

async function backfillPageAuthors() {
  const sitesSnapshot = await db.collection('sites').get();
  
  let totalPages = 0;
  let updatedPages = 0;
  
  for (const siteDoc of sitesSnapshot.docs) {
    const siteKey = siteDoc.id;
    console.log(`Processing site: ${siteKey}`);
    
    const pagesSnapshot = await db
      .collection('sites')
      .doc(siteKey)
      .collection('pages')
      .get();
    
    for (const pageDoc of pagesSnapshot.docs) {
      totalPages++;
      const pageData = pageDoc.data();
      
      // Skip if author already exists
      if (pageData.author) continue;
      
      // Set author to owners[0] (the original creator)
      const author = pageData.owners?.[0] || '-';
      
      await pageDoc.ref.update({ author });
      updatedPages++;
      
      if (updatedPages % 10 === 0) {
        console.log(`Updated ${updatedPages} pages...`);
      }
    }
  }
  
  console.log(`Migration complete: ${updatedPages}/${totalPages} pages updated`);
}

backfillPageAuthors().catch(console.error);
```

---

## Version Impact

This change requires a **minor version bump** (e.g., 16.x.0 → 16.y.0) because:

1. **Data model change**: Adding a new optional field to `ContentEntrySchema`
2. **Backward compatible**: Existing pages without the field continue to work
3. **No breaking changes**: All existing functionality preserved with fallback logic
4. **Feature enhancement**: Improves data tracking without disrupting existing features

**Recommended version:** If current version is `16.x.y`, bump to `16.(x+1).0`

---

## Dependencies

### Blocking Dependencies
None - this is a standalone enhancement

### Related Work
- Thread author tracking (existing implementation to follow)
- Page history/revision system (already uses `revision.author` correctly)
- Profile attribution in page listings

---

## Risks & Mitigation

### Risk 1: Performance Impact
**Description:** Adding author field and owners array updates on every page save  
**Impact:** Low  
**Mitigation:** These are simple field updates; Firestore handles them efficiently. No additional reads required.

### Risk 2: Backward Compatibility
**Description:** Existing code expects `owners[0]` as author  
**Impact:** Low  
**Mitigation:** Fallback logic in `parsePage()` ensures legacy pages work correctly.

### Risk 3: Authorization Edge Cases
**Description:** Admin users editing pages they don't own  
**Impact:** Medium  
**Mitigation:** Explicitly add editor to owners array on save (Phase 3 implementation).

---

## Success Metrics

- [ ] All new pages have `author` field populated
- [ ] All page updates set `author` to current editor
- [ ] Page listings display correct author information
- [ ] No errors with legacy pages missing `author` field
- [ ] E2E tests pass for page creation and editing
- [ ] Manual testing confirms correct behavior across all scenarios

---

## Documentation Updates

- [ ] Update schema documentation to include `author` field
- [ ] Document the author tracking behavior in wiki/pages feature docs
- [ ] Add migration notes for the optional backfill script
- [ ] Update API documentation if any page-related endpoints exist

---

## Implementation Timeline

**Total Estimate:** 2-3 hours

1. **Schema changes** (30 min)
   - Update `ContentEntrySchema`
   - Update `parsePage()` with fallback logic

2. **Update functions** (45 min)
   - Modify `addPage()` to set author
   - Modify `updatePage()` to update author and owners
   - Update `updatePageRef()` to use page.author

3. **Update components** (30 min)
   - Update `PageEditorForm.svelte`
   - Update `CreatePageForm.svelte`

4. **Testing** (45 min)
   - Write unit tests
   - Update E2E tests
   - Manual testing

5. **Documentation & Review** (30 min)

---

## Related Issues

- Similar to thread author tracking (already implemented correctly)
- Part of content attribution and audit trail improvements
- Foundation for future "last edited by" display features

---

## Notes

This implementation follows the existing pattern used in `ThreadSchema`, where:
- `author` is explicitly tracked as a field
- The author is always set to `owners[0]` or updated on changes
- Backward compatibility is maintained through fallback logic

The key insight is that `updatePageRef()` already expects an `author` field (line 14), but we're not providing it at the source (the page document itself). This PBI fixes that gap.
