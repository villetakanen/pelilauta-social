# PBI-041 Implementation Checklist

## Pre-Implementation

- [x] Team review of PBI-041 document completed
- [x] Acceptance criteria agreed upon
- [x] i18n translations reviewed (English and Finnish)

---

## Phase 1: Schema and Helpers (2 hours) ✅ COMPLETED

### Schema Changes
- [x] Update `src/schemas/ThreadSchema.ts`
  - [x] Add `labels: z.array(z.string()).optional()` field
  - [x] Verify build passes
  - [x] Verify existing threads still parse correctly

### Helper Functions
- [x] Create `src/utils/shared/threadTagHelpers.ts`
  - [x] Implement `getAllThreadTags(thread)` function
  - [x] Implement `isLabel(thread, tag)` function (renamed from `isAdminTag`)
  - [x] Implement `normalizeTag(tag)` function
  - [x] Add JSDoc comments for all functions
  - [x] Export all functions

### Unit Tests
- [x] Create `test/utils/threadTagHelpers.test.ts`
  - [x] Test `getAllThreadTags()` with no tags
  - [x] Test `getAllThreadTags()` with only user tags
  - [x] Test `getAllThreadTags()` with only labels
  - [x] Test `getAllThreadTags()` with both tag types
  - [x] Test `getAllThreadTags()` deduplication
  - [x] Test `isLabel()` returns false when no labels
  - [x] Test `isLabel()` returns true for labels
  - [x] Test `isLabel()` returns false for user tags
  - [x] Test `normalizeTag()` lowercases
  - [x] Test `normalizeTag()` trims whitespace
  - [x] All tests pass (24 tests total)

### Documentation
- [x] Create `src/docs/76-01-entry-labels-and-tags.md` with comprehensive documentation

### Verification
- [x] Run `npm run build` - success
- [x] Run `npm run test` - all tests pass (321 tests total)
- [x] No TypeScript errors
- [x] Commit Phase 1 changes

---

## Phase 2: API Endpoints (3-4 hours) ✅ COMPLETED

### Admin Labels API Endpoint
- [x] Create `src/pages/api/threads/[threadKey]/labels.ts`
  - [x] Import required modules (serverDB, isAdmin, schemas, etc.)
  - [x] Use `tokenToUid()` and `isAdmin()` for auth (no wrapper function)
  - [x] Implement `POST` handler for adding labels
    - [x] Verify admin authentication using `tokenToUid()` and `isAdmin()`
    - [x] Parse and validate request body
    - [x] Normalize labels using `normalizeTag()`
    - [x] Get existing thread
    - [x] Add labels to labels array (deduplicate)
    - [x] Update thread document
    - [x] Update tag index with combined tags using `getAllThreadTags()`
    - [x] Purge cache in background task
    - [x] Return success response with updated labels
  - [x] Implement `DELETE` handler for removing labels
    - [x] Verify admin authentication using `tokenToUid()` and `isAdmin()`
    - [x] Parse and validate request body
    - [x] Normalize labels using `normalizeTag()`
    - [x] Get existing thread
    - [x] Remove labels from labels array
    - [x] Update thread document
    - [x] Update tag index with combined tags using `getAllThreadTags()`
    - [x] Purge cache in background task (or remove from index if no tags left)
    - [x] Return success response
  - [x] Add error handling for all operations
  - [x] Add logging with `logDebug`, `logError`, `logWarn`

### Update Thread Endpoint
- [x] Modify `src/pages/api/threads/[threadKey].ts`
  - [x] Import `getAllThreadTags` from helper
  - [x] Verify `labels` is NOT in `allowedFields` array (with comment explaining why)
  - [x] Update tag index logic to use `getAllThreadTags()` in background tasks
  - [x] Ensure labels persist through user updates

### API Unit Tests
- [ ] ~~API unit tests deferred in favor of E2E tests (per user request)~~

### Verification
- [ ] Test POST endpoint manually (after UI implemented)
- [ ] Test DELETE endpoint manually (after UI implemented)
- [ ] Verify tag index updated correctly
- [ ] Verify cache purging works
- [x] Run `npm run build` - success
- [x] Run `npm run test` - all tests pass
- [x] Commit Phase 2 changes

---

## Phase 3: UI Components (3-4 hours) ✅ COMPLETED

### Label Manager Component
- [x] Create `src/components/svelte/threads/LabelManager.svelte`
  - [x] Add TypeScript script with Props interface
  - [x] Import required utilities (authedPost, authedDelete, logDebug, etc.)
  - [x] Create reactive state variables
    - [x] `newLabel = $state('')`
    - [x] `isAdding = $state(false)`
    - [x] `isRemoving = $state<string | null>(null)`
    - [x] `errorMessage = $state('')`
  - [x] Implement `addLabel()` function
    - [x] Validate input (check for empty)
    - [x] Check for duplicates using `normalizeTag()`
    - [x] Call POST API at `/api/threads/${threadKey}/labels`
    - [x] Update local thread object
    - [x] Clear input on success
    - [x] Show error messages
  - [x] Implement `removeLabel(label)` function
    - [x] Call DELETE API with query parameter
    - [x] Update local thread object
    - [x] Show error messages
  - [x] Implement `handleKeydown()` for Enter key
  - [x] Create template with:
    - [x] Title/heading using i18n
    - [x] Legend explaining difference
    - [x] Input field for new label with placeholder
    - [x] Add button with loading state
    - [x] Label list display with `.cn-chip` styling
    - [x] Visual distinction for labels (`.border` class)
    - [x] Remove button for each label with loading state
    - [x] Error message display
  - [x] **Use Cyan DS classes - NO component-level `<style>` tags**
    - [x] Use `.cn-chip` for label styling
    - [x] Use `.border` class for label distinction
    - [x] Use spacing atomics (`.mb-1`, `.mb-2`, `.ml-1`, `.mr-1`, `.mt-1`, `.mt-3`, `.pt-3`)
    - [x] Use layout utilities (`.flex`, `.flex-col`, `.flex-wrap`, `.items-center`, `.grow`)
    - [x] Use typography classes (`.text-caption`, `.text-high`, `.text-small`, `.text-low`, `.text-error`)

### Update ThreadAdminActions
- [x] Modify `src/components/svelte/threads/ThreadAdminActions.svelte`
  - [x] Import `LabelManager` component
  - [x] Add `<LabelManager {thread} />` in accordion with border separator
  - [x] Verify placement and layout

### Update Thread Info Display
- [x] Create `src/components/server/app/EntryTagsWithLabelsSection.astro`
  - [x] Import `getAllThreadTags` and `isLabel`
  - [x] Use `getAllThreadTags(thread)` to get all tags
  - [x] Use `isLabel()` to check if tag is admin label
  - [x] Add conditional class `.border` for labels
  - [x] Add admin icon (`<cn-icon noun="admin" small>`) for labels
  - [x] Use `.cn-chip` for all tags
  - [x] **NO component-level styles** - use Cyan DS classes only
- [x] Modify `src/components/server/ThreadsApp/ThreadInfoSection.astro`
  - [x] Import `EntryTagsWithLabelsSection` instead of `EntryTagsSection`
  - [x] Pass thread object instead of just tags array
  - [x] Replace `<EntryTagsSection tags={thread.tags} />` with `<EntryTagsWithLabelsSection thread={thread} />`

### i18n Translations
- [x] Update `src/locales/en/admin.ts`
  - [x] Add `labels.title` - "Admin Labels"
  - [x] Add `labels.addLabel` - "Add Label"
  - [x] Add `labels.addPlaceholder` - "Enter label name"
  - [x] Add `labels.noLabels` - "No admin labels assigned"
  - [x] Add `labels.removeLabel` - "Remove label"
  - [x] Add `labels.legend` - "Labels are admin-assigned tags that persist through edits"
  - [x] Add `labels.success.added` - 'Label "{label}" added'
  - [x] Add `labels.success.removed` - 'Label "{label}" removed'
  - [x] Add `labels.errors.addFailed` - "Failed to add label"
  - [x] Add `labels.errors.removeFailed` - "Failed to remove label"
  - [x] Add `labels.errors.emptyLabel` - "Label cannot be empty"
  - [x] Add `labels.errors.alreadyExists` - 'Label "{label}" already exists'

- [x] Update `src/locales/fi/admin.ts`
  - [x] Add all Finnish translations (complete with proper Finnish terminology)

### E2E Tests
- [ ] ~~E2E tests deferred in favor of manual testing (per discussion)~~

### Verification
- [ ] Run dev server and test UI manually (deferred until deployment)
- [ ] Follow comprehensive testing guide: `docs/pbi/041-manual-testing-guide.md`
  - [ ] Add admin label via UI - verify it appears
  - [ ] Remove admin label via UI - verify it disappears
  - [ ] Edit thread as owner - verify labels persist
  - [ ] Check visual styling (admin labels with border and icon)
  - [ ] Test on mobile/tablet viewport
  - [ ] Test keyboard navigation (Enter key support implemented)
  - [ ] Test with screen reader (basic check)
  - [ ] Complete all 37 test cases in manual testing guide
- [x] Run `npm run build` - success
- [x] Run unit tests - all 321 tests pass
- [x] Commit Phase 3 changes

---

## Phase 4: Testing and Refinement (2 hours)

### Full Test Suite
- [ ] Run all unit tests: `npm run test`
- [ ] Run all E2E tests: `npm run test:e2e`
- [ ] Check code coverage (aim for >80% on new code)
- [ ] Fix any failing tests

### Manual Testing Checklist

**📋 Complete Manual Testing Guide:** `docs/pbi/041-manual-testing-guide.md`

The comprehensive manual testing guide includes 37 detailed test cases covering:
- [ ] Test Suite 1: Admin Label Addition (7 tests)
- [ ] Test Suite 2: Admin Label Removal (3 tests)
- [ ] Test Suite 3: Label Persistence (3 tests)
- [ ] Test Suite 4: Visual Display (4 tests)
- [ ] Test Suite 5: Tag Index Integration (4 tests)
- [ ] Test Suite 6: Authorization and Security (4 tests)
- [ ] Test Suite 7: Performance and Edge Cases (5 tests)
- [ ] Test Suite 8: Cache and Data Consistency (2 tests)
- [ ] Test Suite 9: Accessibility (3 tests)
- [ ] Test Suite 10: i18n (Internationalization) (2 tests)

**Key test scenarios:**
- [ ] Can add/remove labels via UI
- [ ] Labels normalized (lowercase, trimmed)
- [ ] Cannot add duplicate tags
- [ ] Labels persist through user edits (critical!)
- [ ] Admin labels visually distinct (border + icon)
- [ ] Tag index updated correctly
- [ ] Cache purged after changes
- [ ] Non-admin users cannot access
- [ ] API authorization enforced (401/403)
- [ ] Keyboard navigation works
- [ ] Responsive on mobile/tablet
- [ ] i18n works in English and Finnish

### Performance Testing
- [ ] Tag operations complete in < 2 seconds
- [ ] No performance regression on thread listing
- [ ] No performance regression on thread page load
- [ ] No N+1 queries in Firestore
- [ ] Cache purging completes successfully

### Bug Fixes and Refinements
- [ ] Document any bugs found
- [ ] Fix all critical bugs
- [ ] Fix all high-priority bugs
- [ ] Consider deferring low-priority issues to future PBI
- [ ] Update tests to cover bug scenarios

### Code Quality
- [ ] Run Biome linter: `npm run lint`
- [ ] Fix all linting errors
- [ ] Fix all linting warnings (or document why they're ok)
- [ ] Code review checklist:
  - [ ] No console.log statements
  - [ ] Proper error handling
  - [ ] Meaningful variable names
  - [ ] JSDoc comments on public functions
  - [ ] No hardcoded strings (use i18n)
  - [ ] No magic numbers
  - [ ] Consistent code style
  - [ ] **No component-level `<style>` tags** - Cyan DS classes only
  - [ ] Inline styles only for design tokens (CSS variables)

### Documentation
- [ ] Update inline code comments
- [ ] Update JSDoc where needed
- [ ] Verify PBI-041 document is accurate
- [ ] Update quick reference if needed
- [ ] Add any lessons learned to PBI notes

### Final Verification
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Build succeeds without warnings
- [ ] Ready for deployment

---

## Deployment

### Pre-Deployment
- [ ] Create pull request
- [ ] Code review completed
- [ ] All CI checks pass
- [ ] Staging deployment tested
- [ ] Team approval obtained

### Deployment Steps
- [ ] Merge to main branch
- [ ] Monitor Netlify build
- [ ] Verify deployment success
- [ ] Test on production environment
  - [ ] Add admin tag to real thread
  - [ ] Verify it appears on tag page
  - [ ] Edit thread as owner
  - [ ] Verify admin tag persists

### Post-Deployment Monitoring (First 24 hours)
- [ ] Monitor error logs in Sentry
- [ ] Check Firestore write counts (ensure no spikes)
- [ ] Monitor API response times
- [ ] Check cache purge success rate in Netlify logs
- [ ] Verify no increase in 500 errors
- [ ] Gather feedback from admin users

### Success Metrics (After 2 weeks)
- [ ] At least 5 threads have labels
- [ ] Zero labels lost during user edits
- [ ] < 0.5% error rate on admin tag operations
- [ ] No performance degradation
- [ ] Positive admin user feedback

---

## Rollback Plan (If Needed)

### Trigger Conditions
Rollback if:
- Critical bug causing data loss
- Performance degradation > 20%
- Error rate > 5% on tag operations
- Security vulnerability discovered

### Rollback Steps

#### UI Rollback (5 minutes)
- [ ] Revert UI component commits
- [ ] Deploy to Netlify
- [ ] Verify admin tools hidden
- [ ] API still works but no UI to use it

#### API Rollback (15 minutes)
- [ ] Revert API endpoint commits
- [ ] Revert thread update endpoint changes
- [ ] Deploy to Netlify
- [ ] Verify regular thread updates work
- [ ] AdminTags in database remain but unused

#### Full Rollback (30 minutes)
- [ ] Revert all PBI-041 commits
- [ ] Deploy to Netlify
- [ ] Verify everything back to normal
- [ ] No data loss (labels field ignored)

### Post-Rollback
- [ ] Document reason for rollback
- [ ] Create bug ticket for issues
- [ ] Plan fix and re-deployment
- [ ] Communicate with team

---

## Post-Implementation

### Documentation Updates
- [ ] Update release notes
- [ ] Update admin user documentation
- [ ] Add feature to changelog
- [ ] Update API documentation if public

### Team Communication
- [ ] Notify team of successful deployment
- [ ] Share quick reference card
- [ ] Demo feature to admin users
- [ ] Gather feedback

### Future Enhancements (Consider for future PBIs)
- [ ] Tag templates for common categories
- [ ] Bulk tag operations
- [ ] Tag suggestions based on content
- [ ] Tag analytics/trending
- [ ] Fine-grained tag permissions
- [ ] Tag audit log
- [ ] Tag aliases/synonyms
- [ ] Tag categories

---

## Sign-Off

- [ ] Developer sign-off: _______________
- [ ] Code reviewer sign-off: _______________
- [ ] QA sign-off: _______________
- [ ] Product owner sign-off: _______________
- [ ] Deployment date: _______________

---

## Notes

Use this space for implementation notes, issues encountered, or lessons learned:
