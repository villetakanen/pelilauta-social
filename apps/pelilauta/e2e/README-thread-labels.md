# Thread Labels E2E Tests

This directory contains end-to-end tests for **PBI-041** (Thread Labels) and **PBI-042** (Tag Index Race Condition Fix).

## Test Files

### `thread-labels.spec.ts`
Main test suite for PBI-041 admin-managed thread labels functionality.

**Tests:**
- ✅ Admin can add labels to a thread
- ✅ Labels persist after thread edit (validates PBI-042 fix)
- ✅ Labels appear on tag pages immediately (validates PBI-042 fix)
- ✅ Admin can remove labels from a thread
- ✅ Labels are visually distinct from user tags
- ✅ Non-admin users cannot add labels

### `thread-labels-race-condition.spec.ts`
Focused test suite for PBI-042 tag index synchronization fix.

**Tests:**
- ✅ Tag index is updated synchronously before API returns
- ✅ Multiple rapid label additions all complete synchronously
- ✅ Tag index update completes within acceptable time (< 500ms)
- ✅ Label removal also updates tag index synchronously
- ✅ Thread with invalid flowTime does not break tag index update

## Setup Requirements

### 1. Test Database Configuration

The tests require an admin user to be configured in the test database. Run the initialization script:

```bash
pnpm run init-test-db
```

This will create:
- Test threads and sites
- Admin user configuration in `meta/pelilauta` document
- Admin UID: `vN8RyOYratXr80130A7LqVCLmLn1` (sator@iki.fi)

### 2. Admin User Credentials

The admin user credentials are defined in `playwright/.auth/credentials.ts`:

```typescript
export const adminUser = {
  email: 'sator@iki.fi',
  password: 'test-test-test',
};
```

## Running the Tests

### Run all thread label tests
```bash
pnpm run test:e2e -- thread-labels
```

### Run specific test file
```bash
pnpm run test:e2e -- thread-labels.spec.ts
pnpm run test:e2e -- thread-labels-race-condition.spec.ts
```

### Run with UI mode (interactive)
```bash
pnpm run test:e2e -- --ui thread-labels
```

### Run in debug mode
```bash
pnpm run test:e2e -- --debug thread-labels
```

## Test Utilities

### `authenticate-admin.ts`
Helper function to authenticate as an admin user for tests that require admin privileges.

```typescript
import { authenticateAdmin } from './authenticate-admin';

test('admin feature test', async ({ page }) => {
  await authenticateAdmin(page);
  // Test admin-only features
});
```

## What These Tests Validate

### PBI-041: Thread Labels
1. **Admin Authorization**: Only admins can add/remove labels
2. **Label Persistence**: Labels survive user edits (unlike user tags)
3. **Visual Distinction**: Labels styled differently from user tags
4. **API Integration**: Labels API endpoints work correctly
5. **UI Integration**: Label manager component functions properly

### PBI-042: Race Condition Fix
1. **Synchronous Updates**: Tag index updated before API response returns
2. **Immediate Visibility**: Labels appear on tag pages instantly (no race condition)
3. **Performance**: Tag index updates complete within 500ms
4. **Consistency**: Multiple rapid operations all complete synchronously
5. **Error Handling**: Invalid flowTime values don't break tag index updates

## Common Issues

### "Label manager not visible"
If tests skip with this message, the authenticated user is not configured as admin:
- Verify `pnpm run init-test-db` was run successfully
- Check that `meta/pelilauta` document has admin UID in `admins` array
- Confirm credentials match the admin user

### "Thread is not immediately visible on tag page"
This indicates the race condition fix (PBI-042) is not working:
- Tag index update should be synchronous (awaited)
- Check `src/pages/api/threads/[threadKey]/labels.ts`
- Verify `updateTagIndexForThread()` is called with `await`

### Performance test failures
If "tag index update completes within 500ms" test fails:
- Check database connection speed
- Verify Firestore emulator is running locally
- Network issues may cause slower responses

## Test Data Cleanup

Tests automatically clean up created threads in `afterAll` hooks. If cleanup fails:
- Check browser console for errors
- Manually delete test threads via Firebase console
- Look for threads with titles starting with "E2E"

## Architecture Notes

### Why Admin Authentication is Required
The `/api/threads/[threadKey]/labels` endpoints verify admin status via:
1. `tokenToUid(request)` - Extract user from JWT token
2. `isAdmin(uid)` - Check if UID is in `meta/pelilauta.admins[]`
3. Returns 403 Forbidden if not admin

### How Tests Add Labels
Tests use `page.evaluate()` to call `authedFetch()` from client-side:

```typescript
await page.evaluate(async (key) => {
  const { authedFetch } = await import('/src/firebase/client/apiClient.ts');
  await authedFetch(`/api/threads/${key}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels: ['featured'] }),
  });
}, threadKey);
```

This approach:
- Uses real Firebase authentication
- Tests actual API endpoints
- Validates authorization flow
- More reliable than UI interaction

### Race Condition Fix Validation
The PBI-042 fix ensures tag index updates are synchronous:

**Before fix:**
```typescript
// Fire-and-forget - race condition!
executeLabelsBackgroundTasks(threadKey, updatedThread);
return response; // Returns before tag index update
```

**After fix:**
```typescript
// Synchronous - no race condition
await updateTagIndexForThread(threadKey, updatedThread);
return response; // Returns after tag index update
```

Tests validate this by:
1. Adding a unique label
2. Immediately navigating to tag page (within 100ms)
3. Verifying thread appears (would fail with race condition)

## Related Documentation

- **PBI-041 Specification**: `docs/pbi/041-admin-managed-thread-tags.md`
- **PBI-042 Bug Fix**: `docs/pbi/042-fix-label-cache-purging.md`
- **Manual Testing Guide**: `docs/pbi/041-manual-testing-guide.md`
- **Quick Reference**: `docs/pbi/041-quick-reference.md`

## Contributing

When adding new label-related features:
1. Add test cases to `thread-labels.spec.ts`
2. If testing timing/race conditions, add to `thread-labels-race-condition.spec.ts`
3. Update this README with new test descriptions
4. Ensure tests clean up after themselves

## Test Maintenance

**Run frequency**: Every PR that touches thread or label functionality

**Update triggers**:
- Changes to `/api/threads/[threadKey]/labels.ts`
- Changes to thread edit functionality
- Changes to tag index updates
- Changes to admin authorization

**Expected duration**: ~2-3 minutes for full suite