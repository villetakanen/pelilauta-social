# PBI-014: Frequent DELETE /api/auth/session Calls

## Problem Statement

The application is making excessive DELETE calls to `/api/auth/session`, as evidenced in server logs showing multiple deletion requests within seconds:

```
12:38:46 [200] DELETE /api/auth/session 0ms
12:38:47 [200] DELETE /api/auth/session 0ms
```

This indicates potential race conditions, infinite loops, or redundant logout calls in the authentication system.

## Current State Analysis

### Multiple Auth State Listeners

Currently, there are at least 3 different places setting up Firebase Auth state listeners:

1. **Session Store** (`src/stores/session/index.ts`): Main authentication logic
2. **AuthManager Component** (`src/components/svelte/AuthManager.svelte`): Claims validation and onboarding flow
3. **AuthnSection Component** (`src/components/svelte/settings/AuthnSection.svelte`): User profile display

### Problematic Logic Patterns

#### Race Condition in handleFirebaseAuthChange

The `handleFirebaseAuthChange` function in the session store has problematic conditional logic:

```typescript
async function handleFirebaseAuthChange(user: User | null) {
  if (user) {
    try {
      // Subscribe to account/profile data
      await subscribeToAccount(user.uid);
      subscribeToProfile(user.uid);
      sessionState.set('active');
    } catch (error) {
      // If subscription fails, logout - this could cause loops
      await logout();
      return;
    }
    
    // This logic could cause redundant operations
    if ($loadingState.get() === 'active' && user.uid === uid.get()) {
      // no-op
    } else {
      await login(user.uid); // Could be called unnecessarily
    }
  } else {
    // User logged out - always calls logout()
    await logout(); // This triggers DELETE /api/auth/session
  }
}
```

#### Layout Auth Coverage Analysis

Authentication handling varies by page layout purpose:
- ✅ `Page.astro` - includes AuthManager (public pages, needs client-side auth detection)
- ✅ `PageWithTray.astro` - includes AuthManager (interactive pages, needs client-side auth detection)  
- ✅ `ModalPage.astro` - **correctly excludes AuthManager** (server-side authenticated only)
- ✅ `EditorPage.astro` - **correctly excludes AuthManager** (server-side authenticated only)

Note: Modal and Editor page layouts are only used for server-side authenticated sessions, so they intentionally don't include client-side auth listeners. This is actually correct behavior.

#### Redundant Auth State Subscriptions

The `AuthnSection` component unnecessarily subscribes to auth state changes just to display user info, when this data is already available through the session store.

## Root Causes

1. **Multiple Competing Auth Listeners**: Different components independently listening to Firebase auth changes can cause conflicting state updates

2. **Logout Cascade**: When one auth listener detects a logout state and calls `logout()`, it triggers Firebase `signOut()`, which then triggers other auth listeners to also call `logout()`

3. **Error Recovery Loops**: If account/profile subscription fails, the error handler calls `logout()`, which could immediately retrigger the auth flow

4. **Redundant State Management**: Multiple components managing overlapping authentication concerns

## Acceptance Criteria

### Must Have
- [ ] Eliminate excessive DELETE /api/auth/session calls (max 1 per actual user logout action)
- [ ] Consolidate auth state management to prevent race conditions
- [ ] Ensure consistent authentication handling across all page layouts
- [ ] Maintain existing functionality for user login/logout flows

### Should Have  
- [ ] Add logging/metrics to track auth state transitions for debugging
- [ ] Implement auth state debouncing to prevent rapid successive calls
- [ ] Clear separation of concerns between authentication and authorization components

### Could Have
- [ ] Performance monitoring for auth-related API calls
- [ ] Unit tests for auth state transition scenarios

## Proposed Solution

### 1. Consolidate Auth State Management
- Keep the main auth listener only in `src/stores/session/index.ts`
- Remove redundant auth state subscriptions from individual components
- Use the centralized session stores (`uid`, `sessionState`, etc.) for auth status

### 2. Document Layout Auth Patterns
- Document that `ModalPage.astro` and `EditorPage.astro` intentionally exclude `AuthManager`
- These layouts are only used for server-side authenticated sessions
- Add comments to layout files explaining the auth handling approach

### 3. Improve handleFirebaseAuthChange Logic
- Add guards to prevent redundant operations when user state hasn't actually changed
- Implement proper error handling that doesn't cascade logout calls
- Add debouncing mechanism for rapid auth state changes

### 4. Refactor Component Dependencies
- Modify `AuthnSection` to use session stores instead of direct Firebase auth subscription
- Ensure components consume auth state rather than managing it independently

## Technical Tasks

1. **Audit and consolidate auth listeners** - Remove duplicate `onAuthStateChanged` subscriptions
2. **Fix race conditions in session store** - Improve logic in `handleFirebaseAuthChange` 
3. **Document layout auth patterns** - Add documentation explaining why Modal/Editor layouts exclude AuthManager
4. **Add auth state debugging** - Implement logging to track auth transitions
5. **Test auth flows** - Verify login/logout works correctly without excessive API calls

## Definition of Done

- [ ] Server logs show maximum 1 DELETE `/api/auth/session` call per user logout action
- [ ] All page layouts have consistent authentication behavior  
- [ ] No race conditions or infinite loops in auth state management
- [ ] Existing auth functionality (login, logout, session persistence) works correctly
- [ ] E2E tests for authentication flows pass
- [ ] Code review completed and approved

## Estimated Effort

**Story Points**: 8 (Large)

**Reasoning**: This requires careful refactoring of core authentication logic across multiple components and layouts, with potential for introducing regressions if not handled properly. The cross-cutting nature of authentication makes this a complex change.
