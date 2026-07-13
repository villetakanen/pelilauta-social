# PBI-043 Phase 1: Data Layer Testing Guide

## Phase 1 Completion Summary

✅ **Commit 2**: Created `updatePageRefsOrder()` function
✅ **Commit 3**: Updated TOC display logic for manual sorting
✅ **Tests**: Added 9 unit tests for manual sorting logic (all passing)
✅ **Diagnostics**: No errors or warnings

## Files Changed

1. **`src/firebase/client/site/updatePageRefsOrder.ts`** (new)
   - Function to update page order via API
   - Assigns sequential order indices (0, 1, 2, ...)
   - Uses `silent: true` to avoid updating timestamps

2. **`src/components/server/SiteApp/SiteTocApp.astro`**
   - Added manual sorting logic
   - Sorts by `order` field when `sortOrder === 'manual'`
   - Falls back to `Number.MAX_SAFE_INTEGER` for missing order values

3. **`test/lib/toc/manualSorting.test.ts`** (new)
   - 9 unit tests covering all sorting scenarios
   - Tests edge cases (missing order, zero values, negative values, etc.)

## Manual Testing Steps

Since the UI doesn't exist yet, you can test the backend logic manually:

### Test 1: Verify Manual Sorting Works

1. **Setup**: Use Firebase Console or a script to update a test site:
   ```json
   {
     "key": "test-site",
     "name": "Test Site",
     "sortOrder": "manual",
     "pageRefs": [
       {
         "key": "page-c",
         "name": "Page C (Third)",
         "author": "testuser",
         "flowTime": 1700000000000,
         "order": 2
       },
       {
         "key": "page-a",
         "name": "Page A (First)",
         "author": "testuser",
         "flowTime": 1700000000000,
         "order": 0
       },
       {
         "key": "page-b",
         "name": "Page B (Second)",
         "author": "testuser",
         "flowTime": 1700000000000,
         "order": 1
       }
     ]
   }
   ```

2. **Navigate**: Go to `/sites/test-site/toc/`

3. **Expected Result**: Pages should display in order:
   - Page A (First)
   - Page B (Second)
   - Page C (Third)

4. **Verify**: Even though the `pageRefs` array has them in C-A-B order in Firestore, they should render in A-B-C order based on the `order` field.

### Test 2: Verify Backward Compatibility

1. **Setup**: Use Firebase Console to update a test site without `order` fields:
   ```json
   {
     "key": "test-site-2",
     "name": "Legacy Site",
     "sortOrder": "manual",
     "pageRefs": [
       {
         "key": "page-z",
         "name": "Page Z",
         "author": "testuser",
         "flowTime": 1700000000000
       },
       {
         "key": "page-a",
         "name": "Page A",
         "author": "testuser",
         "flowTime": 1700000000000
       }
     ]
   }
   ```

2. **Navigate**: Go to `/sites/test-site-2/toc/`

3. **Expected Result**: Pages should display in Firestore array order (Z, then A) since all have `order = undefined` (treated as `Number.MAX_SAFE_INTEGER`).

### Test 3: Verify Mixed Order Values

1. **Setup**: Create a site with some pages having order, others not:
   ```json
   {
     "key": "test-site-3",
     "name": "Mixed Site",
     "sortOrder": "manual",
     "pageRefs": [
       {
         "key": "page-a",
         "name": "Page A (No Order)",
         "author": "testuser",
         "flowTime": 1700000000000
       },
       {
         "key": "page-b",
         "name": "Page B (First)",
         "author": "testuser",
         "flowTime": 1700000000000,
         "order": 0
       },
       {
         "key": "page-c",
         "name": "Page C (No Order)",
         "author": "testuser",
         "flowTime": 1700000000000
       }
     ]
   }
   ```

2. **Navigate**: Go to `/sites/test-site-3/toc/`

3. **Expected Result**: 
   - Page B (First) - has order: 0
   - Page A (No Order) - no order field (at end)
   - Page C (No Order) - no order field (at end)

### Test 4: Verify Other Sort Orders Still Work

1. **Setup**: Ensure test sites with other sort orders aren't broken:
   - A site with `sortOrder: "name"`
   - A site with `sortOrder: "flowTime"`
   - A site with `sortOrder: "createdAt"`

2. **Navigate**: Visit each site's TOC page

3. **Expected Result**: All existing sort orders should work as before (no regression).

## API Testing (Optional)

If you want to test the `updatePageRefsOrder()` function directly:

1. Open browser console on any authenticated page
2. Run:
   ```javascript
   // Import the function (dynamic import in browser console)
   const { updatePageRefsOrder } = await import('/src/firebase/client/site/updatePageRefsOrder.ts');
   
   // Test updating order
   await updatePageRefsOrder('your-test-site-key', [
     { key: 'page-1', name: 'First', author: 'user', flowTime: 123 },
     { key: 'page-2', name: 'Second', author: 'user', flowTime: 456 },
     { key: 'page-3', name: 'Third', author: 'user', flowTime: 789 },
   ]);
   ```

3. Check Firebase Console to verify:
   - `pageRefs[0].order === 0`
   - `pageRefs[1].order === 1`
   - `pageRefs[2].order === 2`
   - Site's `flowTime`/`updatedAt` should NOT have changed (silent update)

## Success Criteria

- ✅ Manual sorting displays pages in correct order based on `order` field
- ✅ Pages without `order` field are placed at the end
- ✅ Backward compatible with existing sites
- ✅ Other sort orders (name, flowTime, createdAt) still work
- ✅ All 403 unit tests pass
- ✅ No diagnostics errors

## Known Limitations (Phase 1)

- No UI to set `sortOrder: "manual"` yet (comes in Phase 2)
- No UI to reorder pages yet (comes in Phase 2)
- Must manually edit Firestore to test manual ordering
- "Manual" option doesn't appear in dropdown yet (Phase 2)

## Next Phase

**Phase 2** will add:
- "Manual" option to the sort order dropdown
- Drag-and-drop `ManualTocOrdering.svelte` component
- Visual interface to reorder pages

## Testing Commands

```bash
# Run unit tests
pnpm run test

# Check for errors
pnpm exec biome check src/

# Run e2e tests (optional)
pnpm run test:e2e
```

## Rollback Instructions

If Phase 1 needs to be rolled back:

1. Delete `src/firebase/client/site/updatePageRefsOrder.ts`
2. Revert changes to `src/components/server/SiteApp/SiteTocApp.astro`
3. Delete `test/lib/toc/manualSorting.test.ts`
4. Delete `test/lib/toc/` directory if empty

The `order` field in `PageRefSchema` can remain (it's backward compatible and optional).