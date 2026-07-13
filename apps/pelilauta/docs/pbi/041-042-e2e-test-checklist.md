# E2E Test Execution Checklist: PBI-041 & PBI-042

**Purpose:** Step-by-step guide to run and validate thread labels e2e tests  
**Target:** Developers validating PBI-041 and PBI-042 implementation  
**Estimated Time:** 15-20 minutes

## Pre-Execution Checklist

### Environment Setup

- [ ] Development server is running (`pnpm run dev`)
- [ ] Firebase emulator is running (if using local testing)
- [ ] Test database is initialized (`pnpm run init-test-db`)
- [ ] No other tests are running concurrently
- [ ] Browser is closed (Playwright will launch its own)

### Verify Test Database

```bash
# Initialize or reset test database
pnpm run init-test-db
```

**Expected output:**
```
Using project_id: [your-project-id]
Test site created: e2e-test-site
Site owners: ['e2e-test-owner', 'JatmZFE8X9coxETMz2sUs5YW1r22', 'vN8RyOYratXr80130A7LqVCLmLn1', 'H3evfU7BDmec9KkotRiTV41YECg1']
...
App metadata created with admin user: vN8RyOYratXr80130A7LqVCLmLn1
Database initialization complete, fire away!
```

- [ ] ✅ Admin user configured (UID: vN8RyOYratXr80130A7LqVCLmLn1)
- [ ] ✅ Test sites created
- [ ] ✅ No errors in initialization

### Verify Admin Credentials

Check `playwright/.auth/credentials.ts`:

- [ ] `adminUser` export exists
- [ ] Email: `sator@iki.fi`
- [ ] Password configured
- [ ] User can log in manually (optional sanity check)

## Test Execution

### 1. Run All Thread Label Tests

```bash
pnpm run test:e2e -- thread-labels
```

**Expected:**
- [ ] 11 tests discovered (6 + 5 from both spec files)
- [ ] All tests pass
- [ ] Duration: 2-3 minutes
- [ ] No console errors
- [ ] Test threads cleaned up automatically

### 2. Run Individual Test Files

#### Main Functionality Tests
```bash
pnpm run test:e2e -- thread-labels.spec.ts
```

**Expected tests:**
- [ ] ✅ admin can add labels to a thread
- [ ] ✅ labels persist after thread edit (PBI-042 fix)
- [ ] ✅ labels appear on tag pages immediately (PBI-042 fix)
- [ ] ✅ admin can remove labels from a thread
- [ ] ✅ labels are visually distinct from user tags
- [ ] ✅ non-admin users cannot add labels

#### Race Condition Tests
```bash
pnpm run test:e2e -- thread-labels-race-condition.spec.ts
```

**Expected tests:**
- [ ] ✅ tag index is updated synchronously before API returns
- [ ] ✅ multiple rapid label additions all complete synchronously
- [ ] ✅ tag index update completes within acceptable time (< 500ms)
- [ ] ✅ label removal also updates tag index synchronously
- [ ] ✅ thread with invalid flowTime does not break tag index update

### 3. Run with UI Mode (Optional - for debugging)

```bash
pnpm run test:e2e -- --ui thread-labels
```

**Use UI mode to:**
- [ ] Watch tests execute in browser
- [ ] Pause and inspect state
- [ ] Debug failing tests
- [ ] Take screenshots

## Validation Checklist

### Functional Validation

- [ ] Labels can be added to threads
- [ ] Labels persist through thread edits
- [ ] Labels appear on tag pages immediately
- [ ] Labels can be removed from threads
- [ ] Only admins can manage labels
- [ ] API returns proper status codes (200, 403, etc.)

### Performance Validation

- [ ] API calls complete in < 500ms
- [ ] Tag pages load immediately after label addition
- [ ] No noticeable delays in UI
- [ ] Test suite completes in reasonable time (< 5 min)

### Race Condition Validation

- [ ] Thread appears on tag page within 100ms of label addition
- [ ] Multiple rapid additions all succeed
- [ ] No "No entries found" errors
- [ ] Synchronous behavior confirmed in logs

### Error Handling Validation

- [ ] Invalid flowTime values handled gracefully
- [ ] Failed operations don't break subsequent operations
- [ ] Proper error messages displayed
- [ ] Tests clean up even on failure

## Success Criteria

### All Tests Pass
```
✓ Thread Labels (PBI-041) (6)
  ✓ admin can add labels to a thread
  ✓ labels persist after thread edit
  ✓ labels appear on tag pages immediately
  ✓ admin can remove labels from a thread
  ✓ labels are visually distinct from user tags
  ✓ non-admin users cannot add labels

✓ Thread Labels - Tag Index Race Condition Fix (PBI-042) (5)
  ✓ tag index is updated synchronously before API returns
  ✓ multiple rapid label additions all complete synchronously
  ✓ tag index update completes within acceptable time
  ✓ label removal also updates tag index synchronously
  ✓ thread with invalid flowTime does not break tag index update

11 passed (2.5m)
```

### Console Output Validation

Look for these log messages:
- [ ] "Admin authentication completed successfully"
- [ ] "Created test thread: [threadKey]"
- [ ] "Add label API response status: [200]"
- [ ] "Label [name] is now visible on the thread"
- [ ] "✅ SUCCESS: Thread is immediately visible on tag page"
- [ ] "✅ Tag index was updated synchronously - no race condition"
- [ ] "Test thread cleaned up successfully"

### No Error Messages

Verify absence of:
- [ ] ❌ "Label manager not visible - user may not be an admin"
- [ ] ❌ "User not authenticated"
- [ ] ❌ "Failed to add labels"
- [ ] ❌ "Thread is not immediately visible"
- [ ] ❌ "Failed to clean up test thread"

## Troubleshooting

### Test Failures

#### "Label manager not visible"
**Problem:** User is not configured as admin

**Solution:**
1. Run `pnpm run init-test-db` again
2. Check `meta/pelilauta` document in Firestore
3. Verify admin UID: `vN8RyOYratXr80130A7LqVCLmLn1`
4. Ensure auth is working (check setting button visibility)

#### "Thread not visible on tag page"
**Problem:** Race condition fix not working

**Solution:**
1. Check `src/pages/api/threads/[threadKey]/labels.ts`
2. Verify `await updateTagIndexForThread()` is called
3. Check tag index collection is accessible
4. Review server logs for errors

#### "Performance test failure" (> 500ms)
**Problem:** Slow database or network

**Solution:**
1. Check Firestore emulator is running
2. Verify network connection
3. Try running tests again (may be transient)
4. Check system resources (CPU, memory)

#### Authentication failures
**Problem:** Cannot log in as admin user

**Solution:**
1. Verify credentials in `playwright/.auth/credentials.ts`
2. Check Firebase Auth has test user configured
3. Try manual login to verify credentials
4. Review browser console for auth errors

### Test Environment Issues

#### Port conflicts
```bash
# Check if port 4321 is in use
lsof -i :4321
```

#### Firestore connection issues
```bash
# Restart emulator
firebase emulators:restart
```

#### Stale test data
```bash
# Reset test database
pnpm run init-test-db
```

## Post-Execution Checklist

### Verify Test Results

- [ ] All 11 tests passed
- [ ] No console errors logged
- [ ] Test threads cleaned up
- [ ] No leftover data in database (optional check)
- [ ] Performance metrics within acceptable range

### Document Results

- [ ] Screenshot of test results
- [ ] Note any failures or warnings
- [ ] Record execution time
- [ ] Save console output (if errors occurred)

### Update Status

- [ ] Mark PBI-041 tests as ✅ Complete
- [ ] Mark PBI-042 tests as ✅ Complete
- [ ] Update implementation checklist
- [ ] Notify team of test results

## Manual Verification (Optional)

While e2e tests are comprehensive, you may want to manually verify:

### 1. Add a Label Manually
1. Log in as admin (sator@iki.fi)
2. Navigate to any thread
3. Find label manager component
4. Add label "manual-test"
5. Verify it appears on thread
6. Navigate to `/tags/manual-test`
7. Verify thread appears

### 2. Edit Thread with Label
1. On thread with label
2. Click edit button
3. Change content (add/remove hashtags)
4. Save changes
5. Verify label still present
6. Check `/tags/[label]` page
7. Thread should still be listed

### 3. Remove Label
1. On thread with label
2. Find label manager
3. Remove label
4. Verify it disappears
5. Check `/tags/[label]` page
6. Thread should not be listed

## Final Sign-Off

- [ ] All automated tests pass
- [ ] Manual verification complete (if performed)
- [ ] Documentation reviewed
- [ ] No blocking issues found
- [ ] Ready for production deployment

**Executed by:** _______________  
**Date:** _______________  
**Test Results:** PASS / FAIL  
**Notes:** _______________________________________________

---

## Quick Reference Commands

```bash
# Initialize test database
pnpm run init-test-db

# Run all thread label tests
pnpm run test:e2e -- thread-labels

# Run specific test file
pnpm run test:e2e -- thread-labels.spec.ts
pnpm run test:e2e -- thread-labels-race-condition.spec.ts

# Run with UI (interactive)
pnpm run test:e2e -- --ui thread-labels

# Run with debug mode
pnpm run test:e2e -- --debug thread-labels

# Run single test by name
pnpm run test:e2e -- -g "admin can add labels"
```

## Resources

- **Test Files**: `e2e/thread-labels*.spec.ts`
- **Test Documentation**: `e2e/README-thread-labels.md`
- **Implementation Summary**: `docs/pbi/041-042-e2e-tests-summary.md`
- **PBI Specifications**: 
  - `docs/pbi/041-admin-managed-thread-tags.md`
  - `docs/pbi/042-fix-label-cache-purging.md`

---

**Checklist Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Ready for use