# PBI: Login Button State Desynchronization

## Priority
**Medium** - UX issue that can confuse users but doesn't break core functionality

## Problem Description
The login button in the navigation sometimes displays incorrect state, showing the user as logged in when the session is not properly established, or vice versa. This creates a confusing user experience where the UI state doesn't match the actual authentication state.

## Root Cause Analysis

### Race Condition Between Stores
The issue stems from a race condition between three different state stores:

1. **`uid`** (`persistentAtom`) - Restores immediately from localStorage on page load
2. **`sessionState`** (`persistentAtom`) - Restores immediately from localStorage on page load  
3. **`authUser`** (`atom`) - Set asynchronously when Firebase auth initializes

### Component Implementation
The login button component ([SettingNavigationButton.svelte](file:///Users/ville.takanen/dev/pelilauta-17/src/components/svelte/app/SettingNavigationButton.svelte)) uses `authUser` to determine whether to show the login or settings button:

```svelte
{#if $authUser}
  <!-- Show settings/avatar button -->
{:else}
  <!-- Show login button -->
{/if}
```

The component includes a revealing comment (lines 8-10):
> "We are now using authUser, which points to firebase auth user login state. This is a bit faster than using uid, which requires an additional lookup. Using authUser enables the ux to look cleaner, even if there is a slight possibility for $profile to be loading while already logged in"

### The Race Condition Timeline

**On App Initialization:**
1. `uid` and `sessionState` restore from localStorage **immediately** (synchronous)
2. Firebase auth initialization starts (async)
3. UI renders based on `authUser` which is still `null`
4. Firebase auth completes and sets `authUser`
5. UI updates to reflect actual auth state

**During this window (steps 3-4):**
- If user was previously logged in: `uid` and `sessionState` show "active" but `authUser` is null → button shows "login" incorrectly
- If session expired: `uid` and `sessionState` might still show "active" from stale localStorage → button shows "settings" incorrectly

### Session Store Logic
The session store ([index.ts:85-183](file:///Users/ville.takanen/dev/pelilauta-17/src/stores/session/index.ts#L85-L183)) handles Firebase auth changes in `handleFirebaseAuthChange()`:

- Sets `authUser` immediately (line 91)
- Checks if session is already active (line 116)
- If active, refreshes subscriptions (lines 127-128)
- If not active, goes through full login flow (lines 140-182)

The issue is that UI components relying on `authUser` alone don't account for the initialization delay.

## Reproduction Steps

> [!NOTE]
> This is a timing-dependent race condition, so reproduction may be inconsistent

1. Log in to the application
2. Close the browser tab (don't log out)
3. Reopen the application
4. **Expected:** Login button should show correct state immediately
5. **Actual:** Login button may briefly show incorrect state before correcting itself

**Alternative scenario:**
1. Have an expired session in localStorage
2. Refresh the page
3. **Actual:** Button may show "settings" briefly before switching to "login"

## Technical Details

### Affected Files
- [src/components/svelte/app/SettingNavigationButton.svelte](file:///Users/ville.takanen/dev/pelilauta-17/src/components/svelte/app/SettingNavigationButton.svelte) - Login button component
- [src/stores/session/index.ts](file:///Users/ville.takanen/dev/pelilauta-17/src/stores/session/index.ts) - Session state management

### Current Store Architecture
```typescript
// Persistent stores - restore immediately from localStorage
export const uid = persistentAtom<string>('session-uid', '');
export const sessionState = persistentAtom<SessionState>('session-state', 'initial');

// Regular atom - set async by Firebase auth
export const authUser = atom<User | null>(null);

// Computed store
export const active = computed(sessionState, (state) => state === 'active');
```

## Proposed Solution

### Option 1: Use Computed Store (Recommended)
Change `SettingNavigationButton.svelte` to use a computed store that combines `authUser` AND `sessionState`:

```svelte
<script lang="ts">
import { authUser, sessionState } from '@stores/session';

// Only show logged in state when BOTH conditions are true
const isAuthenticated = $derived($authUser && $sessionState === 'active');
</script>

{#if isAuthenticated}
  <!-- Show settings/avatar button -->
{:else}
  <!-- Show login button -->
{/if}
```

**Pros:**
- Simple, minimal change
- Ensures UI only shows logged-in state when both Firebase auth AND session are ready
- Prevents stale localStorage state from showing incorrect UI

**Cons:**
- Might show login button slightly longer during initialization

### Option 2: Add Loading State
Show a loading indicator while auth is initializing:

```svelte
{#if $sessionState === 'loading'}
  <cn-loader icon="avatar"></cn-loader>
{:else if $authUser && $sessionState === 'active'}
  <!-- Show settings/avatar button -->
{:else}
  <!-- Show login button -->
{/if}
```

**Pros:**
- More explicit about loading state
- Better UX communication

**Cons:**
- More complex
- Adds visual loading state that might be distracting

### Option 3: Initialize sessionState to 'loading'
Change the default `sessionState` from 'initial' to 'loading' when there's a stored uid:

**Pros:**
- Prevents showing incorrect state during initialization
- More accurate representation of actual state

**Cons:**
- Requires changes to session store logic
- More invasive change

## Acceptance Criteria
- [ ] Login button shows correct state immediately on page load
- [ ] No flickering between login/settings states during initialization
- [ ] Expired sessions correctly show login button
- [ ] Active sessions correctly show settings button
- [ ] No regression in login/logout functionality

## Related Code Patterns

> [!IMPORTANT]
> The GEMINI.md file documents a pattern for preventing this exact race condition in stores that make authenticated API calls:

```typescript
// From GEMINI.md - Firebase Auth Race Condition Prevention
effect([uid, authUser], ([currentUid, currentAuthUser]) => {
  if (currentUid && currentAuthUser) {
    // Safe to make API calls - Firebase auth is fully initialized
    fetchDataFromAPI(currentUid);
  } else if (!currentUid) {
    // User logged out, clear data
    clearData();
  }
  // For other states (uid but no authUser), wait - don't make API calls
});
```

This same pattern should be applied to UI components that need to wait for both localStorage restoration AND Firebase auth initialization.

## Estimated Effort
**1-2 hours** - Small change with testing

## Testing Strategy
1. Manual testing of login/logout flows
2. Test with expired sessions
3. Test with page refresh while logged in
4. Test with browser close/reopen
5. Verify no console errors during state transitions
