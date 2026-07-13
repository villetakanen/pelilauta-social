# Session Store Specification

## Overview

The Session Store is a client-side reactive data layer that manages the **session state information** to drive the UI. It serves as the single source of truth for the *application's view* of the current user.

> **Note:** This store manages the *visualization* and *client-side state* of the session. The actual session security, authentication mechanics, and server-side persistence involve a broader system of Firebase Auth tokens, HTTP-only cookies, and SSR validation. For the full security model and authentication architecture, please refer to `plans/session-and-auth/spec.md`.

It is built using `nanostores` for state management and bridges the gap between the authoritative `firebase/auth` SDK and the application's reactive UI components.

## Architecture

The session store is composed of several specialized stores:
-   **Core Session Store** (`src/stores/session/index.ts`): Manages the high-level session state (`initial`, `loading`, `active`, `error`) and the `uid`.
-   **Account Store** (`src/stores/session/account.ts`): Manages private user data (settings, last login).
-   **Profile Store** (`src/stores/session/profile.ts`): Manages public user data (nick, avatar).
-   **Subscriber Store** (`src/stores/session/subscriber.ts`): Manages content consumption state (read receipts).

### Key Dependencies
-   `nanostores`: Atomic state management.
-   `@nanostores/persistent`: LocalStorage persistence for session recovery.
-   `firebase/auth`: Identity provider.
-   `firebase/firestore`: Data storage for accounts, profiles, and subscriptions.

## State Management

### Session State Cycle
The `sessionState` atom tracks the lifecycle of the user's session:

1.  **`initial`**: App start, no active session.
2.  **`loading`**: Authentication or logout in progress.
3.  **`active`**: User is authenticated, data is subscribed.
4.  **`error`**: Authentication failed.

**Note**: To prevent infinite loading states, the store resets `loading` to `initial` on module execution if detected (e.g., after a page reload during a stuck process).

### Computed Helpers
-   **`active`**: `true` if `sessionState` is `'active'`.
-   **`anonymous`**: `true` if `active` is `false` or `uid` is missing (though in practice `active` implies `uid` presence for logged-in users).
-   **`requiresEula`**: Checks if the user needs to accept the EULA (based on `account` data).
-   **`showAdminTools`**: Checks if the user is an admin (based on `appMeta` store).

## persistence strategy

Critical session data is persisted to `localStorage` to provide a seamless experience across reloads:
-   `session-state` -> `sessionState`
-   `session-uid` -> `uid`
-   `session-account` -> `account`
-   `session-profile` -> `profile`
-   `subscriberStore` -> `subscriber`

## Authentication Flows

### Initialization (`onMount`)
The store listens to `firebase.auth().onAuthStateChanged`:

1.  **User Detected**:
    -   If valid user + matching `uid` + active session:
        -   Refreshes subscriptions (Account/Profile) to ensure data is fresh.
        -   Logs: "Refreshed subscriptions for active session".
    -   If new/changed user:
        -   Sets state to `loading`.
        -   Fetches new ID token.
        -   **Server Sync**: POSTs token to `/api/auth/session` to create a strict session cookie (HTTPOnly, Secure, 5 days).
        -   Subscribes to Firestore data (Account, Profile).
        -   Sets `uid` and initializes `subscriberStore`.
        -   Sets state to `active`.

2.  **User Logged Out**:
    -   If state was not `initial`:
        -   Triggers `logout()` cleanup.
    -   Else:
        -   Stays strictly `initial`.

### Logout
The `logout()` function performs a complete cleanup:
1.  Sets state to `loading`.
2.  Clears all local stores (`uid`, `account`, `profile`).
3.  Signs out from `firebase/auth`.
4.  **Server Sync**: DELETE request to `/api/auth/session` to remove the session cookie.
5.  Sets state to `initial`.

## Sub-Stores Detail

### Account Store
-   **Source**: `ACCOUNTS_COLLECTION_NAME` (Firestore).
-   **Logic**:
    -   Subscribes to the user's account document.
    -   Updates `lastLogin` timestamp if > 24 hours since last update.
    -   Parses data using `AccountSchema` (JSON safe).
    -   Handles EULA acceptance check (`eulaAccepted`).

### Profile Store
-   **Source**: `PROFILES_COLLECTION_NAME` (Firestore).
-   **Logic**:
    -   Subscribes to user's profile.
    -   **Migration**: Attempt to autos-migrate legacy profile structures if parsing fails.
    -   Tracks `profileMissing` state if no profile document exists.

### Subscriber Store
-   **Source**: `SUBSCRIPTIONS_FIRESTORE_PATH` (Firestore).
-   **Logic**:
    -   Tracks `seenEntities` map (entity ID -> timestamp).
    -   Provides `hasSeenEntry(key, timestamp)` check.
    -   Updates Firestore explicitly on read (via `markEntrySeen`).
    -   Auto-creates empty subscription doc if missing.

## Server-Side Integration
The client-side store syncs with Astro's server-side session via API routes:
-   **`POST /api/auth/session`**: Validates ID Token, sets `session` cookie.
-   **`DELETE /api/auth/session`**: Clears `session` cookie.

This enables Middleware (`src/middleware.ts`) to perform server-side checks (e.g. for protected routes) using the secure cookie.

## Consumers & Policy

While this store provides the *state*, it does not enforce navigation or access control policies. That is handled by consumers of this store.

### AuthManager (`src/components/svelte/AuthManager.svelte`)
*   **Role**: Policy Enforcer (Client-Side).
*   **Responsibility**:
    *   Listens to auth state changes in parallel.
    *   Checks for specific custom claims (`eula_accepted`, `account_created`).
    *   Performs **Client-Side Gating**: Redirects users to `/onboarding` if they are authenticated but missing required lifecycle steps.
    *   Handles **Token Repair**: Checks `/api/auth/status` and forces token refreshes if server-side claims have changed (e.g., after accepting EULA).

## UI Implementation Guidelines (The "Optimistic UID" Problem)

Because `uid` and `profile` are persisted in `localStorage` via `persistentAtom`, they are available **synchronously/immediately** on page load, *before* Firebase Auth has verified the session. This creates a potential divergence between "Persisted State" and "Verified State".

### The Problem
*   **Initial State**: `sessionState` is `'initial'`.
*   **Persisted State**: `uid` is `'user_123'` (from previous session).
*   **Result**: Naive components checking `if ($uid)` will render as if logged in immediately.

### Best Practices

#### 1. Using the Session State Helpers
Components should use the standardized session state helpers from `src/stores/session/computed.ts` instead of ad-hoc checks:

**IMPORTANT**: Import the computed helpers directly from `computed.ts` to avoid circular dependencies. Do NOT import them from `stores/session/index.ts`.

```typescript
// ✅ Correct: Import from computed.ts directly
import { isActive, isRehydrating, isAnonymous } from 'src/stores/session/computed';

// ✅ Good: Use the standardized helper
{#if $isActive}
  <AuthenticatedContent />
{/if}

// ❌ Bad: Ad-hoc logic that may be incorrect
{#if $uid && $sessionState === 'active'}
  <AuthenticatedContent />
{/if}
```

**Available Helpers:**
- `isAnonymous`: Returns `true` when no session exists (no UID, state is `initial`)
- `isRehydrating`: Returns `true` when UID exists but state is `initial` or `loading` (persisted state pending verification)
- `isActive`: Returns `true` when UID exists AND state is `active` (token verified)

#### 2. Handling the "Loading/Rehydrating" State
Components should show a loading state during rehydration using the `isRehydrating` helper:

```typescript
import { isRehydrating, isActive } from 'src/stores/session/computed';

{#if $isRehydrating}
  <Loader />
{:else if $isActive}
  <AuthenticatedContent />
{:else}
  <AnonymousContent />
{/if}
```

*   **Recommendation**: Show a loader or a skeleton state during `$isRehydrating`.
*   **Alternative (Optimistic)**: You *may* show the user's avatar/nick based on `$profile` (persisted) during this phase to reduce layout shift, but ensure interactions are disabled or queued until `$isActive` is `true`.

## 7. Technical Debt & Future Improvements

### ~~Missing Standardized Helper~~ ✅ RESOLVED (PBI-059)
**Status**: ✅ **RESOLVED** - Implemented in PBI-059

**Original Issue**: Components implemented ad-hoc logic to check for authentication, often conflating "Persisted UID" with "Active Session". There was no single, robust primitive to cleanly switch UI based on the *actual* state.

**Solution Implemented**:
- Created `src/stores/session/computed.ts` with three standardized helpers:
  - `isAnonymous`: Returns `true` when no session exists (no UID, state is `initial`)
  - `isRehydrating`: Returns `true` when UID exists but state is `initial` or `loading` (persisted state pending verification)
  - `isActive`: Returns `true` when UID exists AND state is `active` (token verified)
- Comprehensive unit tests in `test/stores/session-helper.test.ts` covering all state transitions and edge cases
- Refactored navigation components to use the new helpers:
  - `SettingNavigationButton`: Now uses `isRehydrating` and `isActive`
  - `InboxNavigationButton`: Now uses `isActive` instead of direct `$uid` checks
  - `AdminNavigationButton`: Already using `showAdminTools` (no changes needed)

**Documentation**: See "UI Implementation Guidelines" section above for usage examples.
