# PBI-044 Commit 3: Client-Side API Wrapper Implementation

## Summary

Implemented the client-side wrapper for site updates that calls the new PATCH `/api/sites/[siteKey]` endpoint. This commit completes the API infrastructure and provides a clean interface for client components to migrate to the API-first pattern.

## What Changed

### 1. Added `authedPatch` Helper Method

**File:** `src/firebase/client/apiClient.ts`

**Changes:**
- Added `authedPatch()` convenience method to match existing `authedGet`, `authedPost`, `authedPut`, `authedDelete`
- Uses PATCH HTTP method (correct REST semantics for partial updates)
- Automatically handles JSON stringification and auth headers

**Why:**
- Our endpoint uses PATCH as the primary method (Commit 2.1 fix)
- Maintains consistency with existing API client helpers
- Reduces boilerplate in client code

### 2. Created `updateSiteApi` Wrapper

**File:** `src/firebase/client/site/updateSiteApi.ts`

**Purpose:** 
Provides a clean, consistent interface for updating sites via the API endpoint, maintaining API compatibility with the old `updateSite` function.

**Key Features:**
- ✅ Same signature as old `updateSite(site, silent)` - easy migration
- ✅ Validates `site.key` is present before making API call
- ✅ Excludes `key` from update payload (sent in URL path instead)
- ✅ Uses `authedPatch` for correct REST semantics
- ✅ Includes `silent` flag in request body for server-side timestamp control
- ✅ Comprehensive error handling with fallback for malformed JSON
- ✅ Debug logging for troubleshooting
- ✅ Full JSDoc documentation with usage examples

**API Surface:**
```typescript
async function updateSiteApi(
  site: Partial<Site>,
  silent = false
): Promise<void>
```

**Example Usage:**
```typescript
// Update site metadata
await updateSiteApi({ key: 'my-site', name: 'New Name' });

// Silent update (no timestamp change, still purges cache)
await updateSiteApi({ key: 'my-site', sortOrder: 'manual' }, true);
```

### 3. Comprehensive Unit Tests

**File:** `test/lib/client/updateSiteApi.test.ts`

**Coverage:** 12 tests covering:
- ✅ Validation (missing key throws error)
- ✅ Correct API endpoint called with right parameters
- ✅ Silent flag passed correctly
- ✅ Key excluded from update payload
- ✅ Multiple fields updated at once
- ✅ Success responses handled
- ✅ Error responses with error message
- ✅ Error responses without error message (fallback to HTTP status)
- ✅ Malformed JSON error responses
- ✅ Network errors
- ✅ Debug logging on success
- ✅ Error logging on failure

**Test Results:** ✅ All 366 tests pass (12 new tests for this commit)

## Technical Decisions

### 1. Why `authedPatch` Instead of `authedPut`?

**Decision:** Use PATCH as the primary method

**Rationale:**
- Our endpoint implements **partial updates** (only provided fields updated)
- PATCH is the correct REST semantic for partial updates
- PUT implies full resource replacement (all fields required)
- Commit 2.1 already made PATCH the primary method on the server
- Client should match server semantics

### 2. Why Keep `silent` Parameter?

**Decision:** Maintain `silent` parameter in wrapper

**Rationale:**
- Maintains API compatibility with old `updateSite` function
- Enables easy migration of existing components (Commits 4-6)
- Useful for metadata-only updates (e.g., TOC reordering)
- Server respects the flag (no timestamp updates when `silent=true`)
- Cache purging still happens even when silent (correct behavior)

### 3. Why Separate `updateSiteApi.ts` File?

**Decision:** Create dedicated wrapper file instead of inline `authedPatch` calls

**Rationale:**
- ✅ **Centralized Error Handling**: One place to handle site update errors
- ✅ **Consistent Interface**: All components use same function signature
- ✅ **Easy Testing**: Mock one function instead of `authedPatch` everywhere
- ✅ **Migration Path**: Direct 1:1 replacement for old `updateSite`
- ✅ **Logging**: Centralized debug/error logging for troubleshooting
- ✅ **Future Enhancements**: Easy to add retry logic, optimistic updates, etc.

### 4. Why Mock `authedPatch` in Tests?

**Decision:** Unit tests mock `authedPatch`, not real API calls

**Rationale:**
- These are **unit tests** for the wrapper logic, not integration tests
- Integration tests already exist in `test/api/sites-update.test.ts`
- Faster test execution (no real HTTP requests)
- Test wrapper's error handling without needing real error conditions
- Clear separation: unit tests for wrapper, integration tests for endpoint

## Migration Impact

### No Breaking Changes
- ✅ Old `updateSite` function still exists (removed in Commit 7)
- ✅ New `updateSiteApi` is purely additive
- ✅ Components can migrate gradually (Commits 4-6)
- ✅ Both patterns coexist temporarily

### Components Ready to Migrate
The following components can now migrate to the new API:

1. **SiteMetaForm.svelte** (Commit 4)
   - Replaces direct Firestore updates with API call
   - Benefits: server-side validation, atomic cache purging

2. **SiteTocTool.svelte** (Commit 5)
   - Manual TOC ordering (PBI-043 dependency)
   - Uses `silent=true` for TOC updates

3. **SiteCategoriesTool.svelte** (Commit 6)
   - Category management via API
   - Benefits: consistent error handling

## Testing Evidence

### Unit Tests
```bash
$ pnpm test updateSiteApi.test.ts

✓ test/lib/client/updateSiteApi.test.ts (12)
  ✓ should throw error if site.key is missing
  ✓ should call PATCH /api/sites/[siteKey] with correct parameters
  ✓ should pass silent flag to API
  ✓ should exclude key from update data
  ✓ should handle successful API response
  ✓ should throw error if API returns error response
  ✓ should throw error with HTTP status if no error message
  ✓ should handle malformed JSON error response
  ✓ should handle network errors
  ✓ should update multiple fields at once
  ✓ should log debug messages on success
  ✓ should log error messages on failure

Test Files  31 passed (31)
Tests  366 passed (366)
Duration  768ms
```

### Linting
```bash
$ pnpm biome check

Checked 3 files in 5ms. Fixed 2 files.
Found 0 errors.
```

## Files Changed

### Modified
1. `src/firebase/client/apiClient.ts` (+13 lines)
   - Added `authedPatch` helper method

### Created
1. `src/firebase/client/site/updateSiteApi.ts` (64 lines)
   - New client-side API wrapper
   
2. `test/lib/client/updateSiteApi.test.ts` (256 lines)
   - Comprehensive unit tests

3. `docs/pbi/044-commit-3-summary.md` (this file)
   - Documentation for review

### Updated
1. `docs/pbi/044-migrate-update-site-to-ssr.md`
   - Added "Implementation Status" section
   - Marked Commit 3 as complete

## Next Steps (Commit 4-7)

### Commit 4: Migrate SiteMetaForm.svelte
- Replace `updateSite` with `updateSiteApi`
- Test form submission updates site correctly
- Verify cache purging works

### Commit 5: Migrate SiteTocTool.svelte  
- Use `updateSiteApi` for TOC ordering
- Use `silent=true` for metadata-only updates
- Test drag-and-drop TOC reordering

### Commit 6: Migrate SiteCategoriesTool.svelte
- Use `updateSiteApi` for category updates
- Test category add/remove/reorder

### Commit 7: Remove Old Pattern
- Delete `src/firebase/client/site/updateSite.ts`
- Delete `src/firebase/client/cache/purgeCacheHelpers.ts`
- Update any remaining imports
- Verify no references to old pattern

## Review Checklist

- ✅ Code follows project patterns (nanostores, dynamic imports, etc.)
- ✅ Uses `pnpm` as package manager
- ✅ TypeScript types properly defined
- ✅ Biome formatting applied
- ✅ All tests passing (366/366)
- ✅ Error handling comprehensive
- ✅ Logging included for debugging
- ✅ JSDoc documentation complete
- ✅ No breaking changes
- ✅ Ready for component migration (Commit 4)

## Questions for Review

1. **Naming:** Is `updateSiteApi` clear enough, or should it be `updateSiteViaApi`?
2. **Error Handling:** Should we add retry logic now or wait for future enhancement?
3. **Logging:** Is the current logging level (debug/error) appropriate?
4. **Testing:** Should we add integration tests that actually call the API endpoint, or are unit tests sufficient?

---

**Ready to proceed to Commit 4**: Yes ✅

**Blockers**: None

**Risks**: None (purely additive change)