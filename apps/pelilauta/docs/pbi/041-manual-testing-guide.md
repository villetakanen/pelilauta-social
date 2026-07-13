# PBI-041 Manual Testing Guide
## Admin-Managed Thread Labels

**Feature:** Admin users can assign persistent labels to threads that remain unchanged when users edit thread content.

**Related Documents:**
- `docs/pbi/041-admin-managed-thread-labels.md` - Feature specification
- `docs/pbi/041-implementation-checklist.md` - Implementation checklist
- `src/docs/76-01-entry-labels-and-tags.md` - Technical documentation

---

## Prerequisites

### Test Environment Setup
- [ ] Application deployed to test environment
- [ ] Test admin account available (credentials: `__________`)
- [ ] Test regular user account available (credentials: `__________`)
- [ ] Browser developer tools open (for monitoring network/console)
- [ ] Test thread created and accessible

### Test Data Preparation
- [ ] Create a test thread with title "Manual Test Thread for PBI-041"
- [ ] Add some hashtags to the thread content (e.g., "#dnd #fantasy #rulebook")
- [ ] Note the thread URL: `__________`
- [ ] Note the thread key: `__________`

---

## Test Suite 1: Admin Label Addition

### Test 1.1: Add Single Label
**Objective:** Verify admin can add a label to a thread

**Steps:**
1. Log in as admin user
2. Navigate to test thread
3. Scroll to thread info sidebar
4. Locate "ADMIN" accordion section
5. Expand the accordion if collapsed
6. Locate "Admin Labels" section at bottom
7. Type "featured" in the input field
8. Click "Add Label" button

**Expected Results:**
- [ ] Label "featured" appears immediately in the label list
- [ ] Label has border styling (`.border` class)
- [ ] Label has admin icon (shield/admin icon) before text
- [ ] Label appears below the input field
- [ ] Input field clears automatically
- [ ] No error messages displayed
- [ ] Network tab shows successful POST request to `/api/threads/{threadKey}/labels`
- [ ] Response status: 200 OK
- [ ] No console errors

**Actual Results:**
```
[Record observations here]
```

---

### Test 1.2: Add Multiple Labels
**Objective:** Verify admin can add multiple labels

**Steps:**
1. In the same thread from Test 1.1
2. Add label "important"
3. Add label "needs-review"
4. Add label "showcase"

**Expected Results:**
- [ ] All labels appear in the list
- [ ] Labels displayed in order added (or alphabetically if sorted)
- [ ] Each label has border and admin icon
- [ ] Each label has individual remove button (X icon)
- [ ] Input field clears after each addition
- [ ] No duplicate entries in UI

**Actual Results:**
```
[Record observations here]
```

---

### Test 1.3: Add Label with Enter Key
**Objective:** Verify keyboard accessibility

**Steps:**
1. Type "keyboard-test" in the input field
2. Press Enter key (do not click button)

**Expected Results:**
- [ ] Label added successfully
- [ ] Same behavior as clicking "Add Label" button
- [ ] Input clears
- [ ] Label appears in list

**Actual Results:**
```
[Record observations here]
```

---

### Test 1.4: Add Duplicate Label
**Objective:** Verify duplicate prevention

**Steps:**
1. Add label "duplicate-test"
2. Verify it appears in list
3. Try to add "duplicate-test" again
4. Try to add "DUPLICATE-TEST" (uppercase)
5. Try to add "  duplicate-test  " (with spaces)

**Expected Results:**
- [ ] First addition succeeds
- [ ] Second addition shows error: 'Label "duplicate-test" already exists'
- [ ] Uppercase attempt shows same error (normalization works)
- [ ] Spaces-padded attempt shows same error (trimming works)
- [ ] No duplicate labels appear in the list
- [ ] Error message disappears when typing new label

**Actual Results:**
```
[Record observations here]
```

---

### Test 1.5: Add Empty Label
**Objective:** Verify empty input validation

**Steps:**
1. Leave input field empty
2. Click "Add Label" button
3. Type only spaces "   "
4. Click "Add Label" button

**Expected Results:**
- [ ] Error message appears: "Label cannot be empty"
- [ ] No label added to list
- [ ] No API call made (check network tab)
- [ ] Error message clears when typing valid text

**Actual Results:**
```
[Record observations here]
```

---

### Test 1.6: Add Label with Special Characters
**Objective:** Verify tag normalization

**Steps:**
1. Add label "Call  of   Cthulhu" (multiple spaces)
2. Add label "D&D 5e"
3. Add label "Dungeon   &   Dragons"

**Expected Results:**
- [ ] "Call  of   Cthulhu" normalized to "call of cthulhu"
- [ ] "D&D 5e" normalized to "d&d 5e"
- [ ] "Dungeon   &   Dragons" normalized to "dungeon & dragons"
- [ ] Labels stored and displayed in lowercase
- [ ] Multiple spaces collapsed to single space
- [ ] Special characters (&) preserved

**Actual Results:**
```
[Record observations here]
```

---

### Test 1.7: Loading States During Addition
**Objective:** Verify UI feedback during async operations

**Steps:**
1. Throttle network to "Slow 3G" in dev tools
2. Add label "slow-network-test"
3. Observe UI during API call

**Expected Results:**
- [ ] "Add Label" button shows loading state (spinner icon)
- [ ] Button becomes disabled during operation
- [ ] Input field disabled during operation
- [ ] Loading state clears when operation completes
- [ ] Success or error feedback appears

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 2: Admin Label Removal

### Test 2.1: Remove Single Label
**Objective:** Verify admin can remove a label

**Steps:**
1. On thread with multiple labels from Test Suite 1
2. Locate "featured" label in the list
3. Click the X button next to "featured"

**Expected Results:**
- [ ] Label "featured" disappears immediately from list
- [ ] Other labels remain unchanged
- [ ] No error messages
- [ ] Network tab shows DELETE request to `/api/threads/{threadKey}/labels?labels=featured`
- [ ] Response status: 200 OK
- [ ] No console errors

**Actual Results:**
```
[Record observations here]
```

---

### Test 2.2: Remove All Labels
**Objective:** Verify behavior when removing all labels

**Steps:**
1. Remove all labels one by one
2. Observe the UI after last label removed

**Expected Results:**
- [ ] All labels removed successfully
- [ ] UI shows "No admin labels assigned" message
- [ ] Input and "Add Label" button still functional
- [ ] No errors in console

**Actual Results:**
```
[Record observations here]
```

---

### Test 2.3: Loading States During Removal
**Objective:** Verify UI feedback during delete operations

**Steps:**
1. Add several labels
2. Throttle network to "Slow 3G"
3. Click X button on a label
4. Observe UI during deletion

**Expected Results:**
- [ ] X button for that specific label shows loading spinner
- [ ] Other labels' X buttons remain functional
- [ ] Label remains visible until operation completes
- [ ] Label disappears after successful deletion
- [ ] Loading spinner clears

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 3: Label Persistence

### Test 3.1: Labels Persist Through User Content Edits
**Objective:** Verify labels are not affected by user edits (critical requirement!)

**Setup:**
1. Log in as admin
2. Navigate to test thread
3. Add labels: "persistent-test", "admin-label"
4. Note existing user tags (hashtags): `__________`

**Steps:**
1. Log out from admin account
2. Log in as thread owner (regular user)
3. Navigate to the same thread
4. Click "Edit" button
5. Modify thread content:
   - Remove existing hashtags (e.g., remove "#dnd")
   - Add new hashtags (e.g., add "#cyberpunk #scifi")
6. Save changes
7. Log out
8. Log in as admin again
9. Navigate to thread

**Expected Results:**
- [ ] Admin labels "persistent-test" and "admin-label" still present
- [ ] User tags updated to match new hashtags (#cyberpunk, #scifi)
- [ ] Old user tags (#dnd) removed
- [ ] Admin labels unchanged by user edit
- [ ] Both label types visible in tag section
- [ ] Admin labels still have border + icon styling
- [ ] User tags have standard styling (no border/icon)

**Actual Results:**
```
[Record observations here]
```

---

### Test 3.2: Labels Persist Across Page Reloads
**Objective:** Verify data persistence

**Steps:**
1. Add label "reload-test" to thread
2. Refresh the page (F5)
3. Navigate away to another page
4. Navigate back to thread

**Expected Results:**
- [ ] Label "reload-test" visible after refresh
- [ ] All labels visible after navigation away and back
- [ ] Labels load from database, not just client state

**Actual Results:**
```
[Record observations here]
```

---

### Test 3.3: Labels Persist When User Deletes All Hashtags
**Objective:** Edge case - thread with only admin labels

**Setup:**
1. Admin adds labels: "admin-only-test"
2. Log in as thread owner

**Steps:**
1. Edit thread to remove all hashtags from content
2. Save with no hashtags
3. View thread

**Expected Results:**
- [ ] Admin labels still visible
- [ ] Thread has only admin labels, no user tags
- [ ] Tag section displays only admin labels
- [ ] No errors or empty state issues

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 4: Visual Display

### Test 4.1: Label Visual Distinction
**Objective:** Verify admin labels are visually distinct from user tags

**Steps:**
1. Navigate to thread with both admin labels and user hashtags
2. Locate tag/label display section below thread title

**Expected Results:**
- [ ] All tags displayed together (combined view)
- [ ] Admin labels have:
  - [ ] Border styling (visible border)
  - [ ] Admin icon (shield/lock icon) before label text
  - [ ] Title attribute "Admin label" (hover to verify)
  - [ ] `.cn-chip .border` classes applied
- [ ] User tags have:
  - [ ] Standard chip styling
  - [ ] No border
  - [ ] No icon prefix
  - [ ] `.cn-chip` class only
- [ ] Both tag types are clickable links
- [ ] Both tag types use same font/size (except for styling differences noted)

**Actual Results:**
```
[Record observations here]
```

---

### Test 4.2: Responsive Layout - Desktop
**Objective:** Verify layout on large screens

**Steps:**
1. View thread on desktop (1920x1080 or larger)
2. Observe tag section layout
3. Observe admin tools accordion layout

**Expected Results:**
- [ ] Tags wrap properly if many tags present
- [ ] No horizontal overflow
- [ ] Admin tools sidebar visible on right
- [ ] LabelManager section readable and usable
- [ ] Input and button on same row (if space allows)
- [ ] Tags maintain consistent spacing

**Actual Results:**
```
[Record observations here]
```

---

### Test 4.3: Responsive Layout - Mobile
**Objective:** Verify layout on small screens

**Steps:**
1. Open browser dev tools
2. Switch to responsive design mode
3. Set viewport to iPhone SE (375x667) or similar
4. Navigate to test thread

**Expected Results:**
- [ ] Admin accordion visible and expandable
- [ ] LabelManager section usable on small screen
- [ ] Input field and button stack if needed
- [ ] Tag chips wrap to multiple lines
- [ ] No horizontal scrolling required
- [ ] Touch targets adequate size (44x44px minimum)
- [ ] Text remains readable

**Actual Results:**
```
[Record observations here]
```

---

### Test 4.4: Tablet Layout
**Objective:** Verify layout on medium screens

**Steps:**
1. Set viewport to iPad (768x1024)
2. Navigate to test thread

**Expected Results:**
- [ ] Layout adapts appropriately
- [ ] All UI elements accessible
- [ ] No layout breaking issues

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 5: Tag Index Integration

### Test 5.1: Thread Appears on Label Tag Page
**Objective:** Verify tag index updated with admin labels

**Steps:**
1. Add admin label "tag-index-test" to thread
2. Navigate to `/tags/tag-index-test`

**Expected Results:**
- [ ] Tag page exists (not 404)
- [ ] Test thread appears in list
- [ ] Thread title and metadata visible
- [ ] Click thread link navigates correctly

**Actual Results:**
```
[Record observations here]
```

---

### Test 5.2: Thread Appears on User Tag Page
**Objective:** Verify user tags still indexed

**Steps:**
1. Ensure thread has user tag "#fantasy" in content
2. Navigate to `/tags/fantasy`

**Expected Results:**
- [ ] Tag page exists
- [ ] Test thread appears in list
- [ ] Both admin labels and user tags functional in index

**Actual Results:**
```
[Record observations here]
```

---

### Test 5.3: Thread Removed from Tag Index When Label Deleted
**Objective:** Verify tag index cleanup

**Setup:**
1. Create thread with only one admin label "cleanup-test"
2. No user tags (no hashtags in content)
3. Verify thread appears at `/tags/cleanup-test`

**Steps:**
1. Remove the label "cleanup-test"
2. Navigate to `/tags/cleanup-test`

**Expected Results:**
- [ ] Thread no longer appears on tag page
- [ ] Or tag page shows no threads
- [ ] Tag index document updated/removed in Firestore

**Actual Results:**
```
[Record observations here]
```

---

### Test 5.4: Combined Tags in Tag Index
**Objective:** Verify thread indexed under both admin labels and user tags

**Setup:**
1. Thread has user tags: #dnd, #fantasy
2. Thread has admin labels: featured, important

**Steps:**
1. Check `/tags/dnd` - thread should be listed
2. Check `/tags/fantasy` - thread should be listed
3. Check `/tags/featured` - thread should be listed
4. Check `/tags/important` - thread should be listed

**Expected Results:**
- [ ] Thread appears on all four tag pages
- [ ] Tag index includes combined tags from both sources
- [ ] No duplicates in index

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 6: Authorization and Security

### Test 6.1: Non-Admin Cannot See Label Manager
**Objective:** Verify admin tools hidden from regular users

**Steps:**
1. Log in as regular user (non-admin)
2. Navigate to any thread (even own thread)
3. Look for admin accordion section

**Expected Results:**
- [ ] ADMIN accordion not visible
- [ ] LabelManager component not rendered
- [ ] Cannot add/remove labels via UI
- [ ] Thread info section still visible (just not admin tools)

**Actual Results:**
```
[Record observations here]
```

---

### Test 6.2: Non-Admin Cannot Call API Directly
**Objective:** Verify API authorization

**Steps:**
1. Log in as regular user
2. Open browser dev tools console
3. Get auth token: `const auth = await import('@firebase/client'); const token = await auth.auth.currentUser.getIdToken();`
4. Attempt to add label via API:
```javascript
fetch('/api/threads/{threadKey}/labels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ labels: ['unauthorized'] })
})
```

**Expected Results:**
- [ ] Response status: 403 Forbidden
- [ ] Error message: "Forbidden: Admin access required"
- [ ] Label not added to thread
- [ ] Security check working correctly

**Actual Results:**
```
[Record observations here]
```

---

### Test 6.3: Unauthenticated User Cannot Call API
**Objective:** Verify authentication required

**Steps:**
1. Log out completely
2. In console, attempt API call without token:
```javascript
fetch('/api/threads/{threadKey}/labels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ labels: ['test'] })
})
```

**Expected Results:**
- [ ] Response status: 401 Unauthorized
- [ ] Error message about authentication
- [ ] Label not added

**Actual Results:**
```
[Record observations here]
```

---

### Test 6.4: Users Cannot Modify Labels via Thread Update
**Objective:** Verify `labels` field excluded from user updates

**Steps:**
1. Log in as regular user (thread owner)
2. Check thread has admin labels
3. In console, attempt to update thread with labels field:
```javascript
const { updateThreadApi } = await import('@firebase/client/threads/updateThreadApi');
await updateThreadApi({
  key: '{threadKey}',
  labels: ['hacked']
});
```

**Expected Results:**
- [ ] Update fails or ignores `labels` field
- [ ] Admin labels remain unchanged
- [ ] `labels` field not in `allowedFields` array in API

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 7: Performance and Edge Cases

### Test 7.1: Many Labels
**Objective:** Verify handling of large number of labels

**Steps:**
1. Add 20 labels to a thread:
   - "label-1" through "label-20"
2. Observe UI performance
3. Try to add more labels

**Expected Results:**
- [ ] All labels added successfully
- [ ] UI remains responsive
- [ ] Labels wrap properly in display
- [ ] Remove functionality works for all labels
- [ ] No slowdown in rendering
- [ ] Consider if there should be a limit (document if so)

**Actual Results:**
```
[Record observations here]
```

---

### Test 7.2: Very Long Label Names
**Objective:** Verify handling of long strings

**Steps:**
1. Add label: "this-is-a-very-long-label-name-that-might-cause-layout-issues-in-the-user-interface"
2. Observe display

**Expected Results:**
- [ ] Label added successfully
- [ ] UI doesn't break
- [ ] Label wraps or truncates appropriately
- [ ] Remove button still accessible
- [ ] Consider if there should be a length limit

**Actual Results:**
```
[Record observations here]
```

---

### Test 7.3: Rapid Successive Operations
**Objective:** Verify race condition handling

**Steps:**
1. Quickly add 5 labels in rapid succession
2. Quickly remove 3 labels in rapid succession
3. Add and remove same label rapidly

**Expected Results:**
- [ ] All operations complete successfully
- [ ] No duplicate labels created
- [ ] No labels stuck in loading state
- [ ] Final state matches expected outcome
- [ ] No console errors

**Actual Results:**
```
[Record observations here]
```

---

### Test 7.4: Slow Network Conditions
**Objective:** Verify behavior on slow connections

**Steps:**
1. Throttle network to "Slow 3G"
2. Add a label
3. During loading, try to add another label
4. During loading, try to navigate away

**Expected Results:**
- [ ] UI shows loading states
- [ ] Buttons disabled during operations
- [ ] Operations queue or block correctly
- [ ] No duplicate requests
- [ ] User cannot trigger conflicting operations

**Actual Results:**
```
[Record observations here]
```

---

### Test 7.5: Network Error Handling
**Objective:** Verify graceful error handling

**Steps:**
1. Throttle network to "Offline"
2. Try to add a label
3. Restore network
4. Try again

**Expected Results:**
- [ ] Error message displayed: "Failed to add label"
- [ ] Label not added to UI
- [ ] Operation can be retried after network restored
- [ ] No data corruption
- [ ] Console shows appropriate error logs

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 8: Cache and Data Consistency

### Test 8.1: Cache Purging After Label Changes
**Objective:** Verify Netlify cache purged correctly

**Steps:**
1. Note thread URL
2. Add a label
3. Check server logs for cache purge request
4. Visit thread URL in incognito/private window

**Expected Results:**
- [ ] Cache purge API called in background
- [ ] New label visible in fresh browser session
- [ ] No stale cached version served
- [ ] Log entry shows successful cache purge

**Actual Results:**
```
[Record observations here]
```

---

### Test 8.2: Multiple Admin Users
**Objective:** Verify concurrent admin operations

**Setup:**
- Two admin users logged in on different browsers/devices

**Steps:**
1. Admin A adds label "concurrent-test-a"
2. Admin B adds label "concurrent-test-b"
3. Both refresh page
4. Admin A removes "concurrent-test-b"
5. Admin B tries to remove "concurrent-test-b"

**Expected Results:**
- [ ] Both labels added successfully
- [ ] Both admins see both labels after refresh
- [ ] First removal succeeds
- [ ] Second removal handles gracefully (label already gone)
- [ ] Final state consistent across both sessions

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 9: Accessibility

### Test 9.1: Keyboard Navigation
**Objective:** Verify keyboard-only interaction

**Steps:**
1. Use Tab key to navigate through admin section
2. Tab to input field
3. Type label name
4. Press Enter to add
5. Tab to remove button on a label
6. Press Space or Enter to remove

**Expected Results:**
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible
- [ ] Enter key works in input field
- [ ] Remove buttons keyboard-accessible
- [ ] Tab order logical

**Actual Results:**
```
[Record observations here]
```

---

### Test 9.2: Screen Reader Compatibility (Basic)
**Objective:** Verify screen reader usability

**Steps:**
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to admin section
3. Listen to announcements

**Expected Results:**
- [ ] Section announced as "Admin Labels"
- [ ] Legend text read aloud
- [ ] Input field has accessible label
- [ ] Labels announced with "Remove label" button
- [ ] Loading states announced
- [ ] Error messages announced

**Actual Results:**
```
[Record observations here]
```

---

### Test 9.3: Color Contrast
**Objective:** Verify visual accessibility

**Steps:**
1. Use browser dev tools to check color contrast
2. Check label text against background
3. Check border visibility

**Expected Results:**
- [ ] Text contrast ratio ≥ 4.5:1 for normal text
- [ ] Border visible for users with color blindness
- [ ] Admin icon provides additional non-color distinction
- [ ] Error messages have sufficient contrast

**Actual Results:**
```
[Record observations here]
```

---

## Test Suite 10: i18n (Internationalization)

### Test 10.1: English Locale
**Objective:** Verify English translations

**Steps:**
1. Set browser/app language to English
2. Navigate to admin section

**Expected Results:**
- [ ] All text in English
- [ ] "Admin Labels" title
- [ ] "Add Label" button
- [ ] "Enter label name" placeholder
- [ ] Error messages in English
- [ ] "No admin labels assigned" empty state

**Actual Results:**
```
[Record observations here]
```

---

### Test 10.2: Finnish Locale
**Objective:** Verify Finnish translations

**Steps:**
1. Set browser/app language to Finnish
2. Navigate to admin section

**Expected Results:**
- [ ] All text in Finnish
- [ ] "Ylläpidon tunnisteet" title
- [ ] "Lisää tunniste" button
- [ ] "Syötä tunnisteen nimi" placeholder
- [ ] Error messages in Finnish
- [ ] Empty state in Finnish

**Actual Results:**
```
[Record observations here]
```

---

## Summary and Sign-Off

### Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Blocked | Notes |
|------------|-------------|--------|--------|---------|-------|
| 1. Label Addition | 7 | | | | |
| 2. Label Removal | 3 | | | | |
| 3. Persistence | 3 | | | | |
| 4. Visual Display | 4 | | | | |
| 5. Tag Index | 4 | | | | |
| 6. Authorization | 4 | | | | |
| 7. Performance | 5 | | | | |
| 8. Cache/Data | 2 | | | | |
| 9. Accessibility | 3 | | | | |
| 10. i18n | 2 | | | | |
| **TOTAL** | **37** | | | | |

### Critical Issues Found
```
[List any critical/blocking issues here]
```

### Non-Critical Issues Found
```
[List any minor issues or improvements here]
```

### Performance Notes
```
[Document any performance observations]
```

### Browser Compatibility
- [ ] Chrome/Edge (Chromium) - Version: __________
- [ ] Firefox - Version: __________
- [ ] Safari - Version: __________
- [ ] Mobile Safari (iOS) - Version: __________
- [ ] Chrome Mobile (Android) - Version: __________

### Sign-Off

**Tested By:** ___________________________

**Date:** ___________________________

**Environment:** [ ] Dev [ ] Staging [ ] Production

**Build Version/Commit:** ___________________________

**Overall Assessment:**
- [ ] ✅ Ready for production
- [ ] ⚠️ Minor issues - can deploy with known issues
- [ ] ❌ Blocking issues - requires fixes before deployment

**Additional Comments:**
```
[Any additional observations or recommendations]
```

---

## Quick Reference: Test URLs

- Test thread: ___________________________
- User tag page: `/tags/fantasy`
- Admin label page: `/tags/featured`
- Admin panel: `/admin/channels`

## Quick Reference: Test Accounts

- Admin user: ___________________________
- Regular user: ___________________________
- Thread owner: ___________________________

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-XX  
**Related PBI:** PBI-041