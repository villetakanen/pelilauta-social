# PBI-059: Implement Standardized Session State Helper

## Goal
Implement a standardized helper to expose clean session state primitives and eliminate ad-hoc authentication logic across components, as identified in `plans/session-store/spec.md` Section 7 (Technical Debt & Future Improvements).

## Context
Components currently implement ad-hoc logic to check for authentication, often conflating "Persisted UID" (from localStorage) with "Active Session" (verified by Firebase Auth). This creates the "Optimistic UID" problem where components may incorrectly render as authenticated before session verification completes.

## Requirements

### 1. Session Helper Implementation
- **File**: `src/stores/session/computed.ts`
- **Helper Name**: `useSession` or similar computed store
- **Exported Primitives**:
  1. `isAnonymous`: `true` when no session exists (no UID, state is `initial`)
  2. `isRehydrating`: `true` when UID exists but state is `initial` or `loading` (persisted state pending verification)
  3. `isActive`: `true` when UID exists AND state is `active` (token verified)

### 2. Unit Tests
- **File**: `test/stores/session-helper.test.ts`
- **Test Coverage**:
  - `isAnonymous` returns `true` when no UID and state is `initial`
  - `isAnonymous` returns `false` when UID exists
  - `isRehydrating` returns `true` when UID exists and state is `initial`
  - `isRehydrating` returns `true` when UID exists and state is `loading`
  - `isRehydrating` returns `false` when UID exists and state is `active`
  - `isRehydrating` returns `false` when no UID exists
  - `isActive` returns `true` only when UID exists AND state is `active`
  - `isActive` returns `false` when state is `loading` even with UID
  - `isActive` returns `false` when state is `error` even with UID
  - Edge cases: empty string UID, state transitions

### 3. Component Refactoring
Refactor navigation components to use the new helper instead of ad-hoc authentication checks:
- `src/components/svelte/app/SettingNavigationButton.svelte` - Replace `isLoading` and `isAuthenticated` logic with new helpers
- `src/components/svelte/inbox/InboxNavigationButton.svelte` - Replace direct `$uid` check with `isActive`
- `src/components/svelte/admin/AdminNavigationButton.svelte` - Verify it already uses `showAdminTools` (no change needed)

### 4. Documentation Updates
- **Update**: `plans/session-store/spec.md` Section 7
  - Mark the technical debt as resolved
  - Document the implemented helper and its usage
  - Update the "UI Implementation Guidelines" section to reference the new helper

## Acceptance Criteria
- [ ] `useSession` helper (or equivalent) is implemented in `src/stores/session/computed.ts`
- [ ] Helper exports `isAnonymous`, `isRehydrating`, and `isActive` primitives
- [ ] Unit tests in `test/stores/session-helper.test.ts` cover all critical scenarios
- [ ] All unit tests pass
- [ ] `SettingNavigationButton` uses `isRehydrating` and `isActive` instead of ad-hoc logic
- [ ] `InboxNavigationButton` uses `isActive` instead of direct `$uid` check
- [ ] No regressions in authentication-dependent UI behavior
- [ ] `plans/session-store/spec.md` is updated to reflect the implementation
- [ ] Technical debt section in spec is marked as resolved

## Technical Notes
**The "Optimistic UID" Problem**:
- `uid` and `profile` persist to localStorage via `persistentAtom`
- They are available synchronously on page load, before Firebase Auth verification
- Components checking `if ($uid)` will render as authenticated immediately
- The new helper ensures components wait for actual session verification (`isActive`)

**Circular Dependency Avoidance**:
- The computed helpers are in `src/stores/session/computed.ts`
- They are NOT exported from `src/stores/session/index.ts` to avoid circular dependencies
- Components MUST import directly: `import { isActive } from 'src/stores/session/computed'`
- Do NOT import from the index: `import { isActive } from '@stores/session'` (will cause runtime errors)

## Related Specifications
- **Primary**: `plans/session-store/spec.md` (Section 7: Technical Debt & Future Improvements)
- **Context**: `plans/session-and-auth/spec.md` (Full security model and authentication architecture)
