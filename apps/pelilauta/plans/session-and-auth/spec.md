# Session Management and Authentication Specification

> **Status:** Live

## 0. Security Model Context

> **IMPORTANT:** Read this section before implementing any authentication or authorization logic.
> See also: `docs/architecture.md` and `AGENTS.md` Section 7.

### 0.1 Core Principle: Write Operations Are the Security Boundary

This specification covers session management and authentication, but it's critical to understand **where security is actually enforced** in the application:

| Layer | Operations | Security Enforcement |
|-------|------------|---------------------|
| **SSR Pages** | READ-ONLY | None required - inherently safe |
| **CSR (Client)** | READ + WRITE | Firebase Auth token required for writes |
| **API Routes** | READ + WRITE | Bearer token verification via `tokenToUid()` |

### 0.2 What This Means for Session/Cookie Management

- **Session cookies** enable cosmetic page gating (hiding pages from anonymous users)
- **Session cookies do NOT protect write operations** - Firebase tokens do that
- **Middleware blocking SSR pages is unnecessary** - SSR is read-only and safe
- **Cookie-gated pages are impotent without Firebase session** - even if exposed, users can't write

### 0.3 The Three Sub-Solutions

1. **SSR Read-Only Content:** Public, SEO-friendly, accesses Firestore via `firebase-admin` or API. No auth required.
2. **CSR Interactive Features:** Requires Firebase Auth token for writes. Direct Firestore or API access.
3. **Cookie-Gated Pages:** Cosmetic hiding only. Not a security control.

### 0.4 Security Anti-Pattern This Spec Previously Encouraged

The middleware implementation (now disabled) incorrectly treated SSR page access as a security concern. This broke the login cycle because:
- It blocked pages that were inherently safe (read-only)
- It conflated "hiding from anonymous users" with "security"
- The real security (Firebase tokens for writes) was already in place

## 1. Blueprint

### 1.1 Context
This specification documents the reverse-engineered session management and authentication mechanisms used in Pelilauta. The system uses a hybrid approach with Firebase Authentication for identity and Astro SSR with HTTP-only cookies for session persistence.

### 1.2 Architecture
The authentication system bridges the client-side Firebase Auth SDK with the server-side Astro environment.

#### 1.2.1 Components
- **Identity Provider:** Firebase Authentication (Google Identity Platform).
- **Client Store:** Nanostores (`@stores/session`) managing `sessionState`, `authUser`, and `uid`.
- **Server:** Astro API routes and middleware using `firebase-admin` via `@firebase/server`.
- **Storage:**
    - **Client:** `localStorage` for `session-state` and `session-uid` persistence (UX only).
    - **Server:** HTTP-only, Secure `session` cookie (Security).
    - **Database:** Firestore `account` and `profiles` collections.

#### 1.2.2 Authentication Flow
1.  **Client Login:** User signs in via Firebase UI/SDK.
2.  **State Change:** `onAuthStateChanged` triggers `handleFirebaseAuthChange` in `src/stores/session/index.ts`.
3.  **Token Exchange:**
    - Client retrieves ID Token: `user.getIdToken()`.
    - Client POSTs token to `/api/auth/session`.
4.  **Session Creation (For SSR Pages):**
    - Server verifies ID Token using `serverAuth.verifyIdToken`.
    - Server creates a Session Cookie using `serverAuth.createSessionCookie`.
    - Cookie properties: `httpOnly: true`, `secure: true`, `path: '/'`, `maxAge: 5 days`, `sameSite: 'Lax'`.
5.  **State Sync:** Client updates `sessionState` to `active` and initiates data subscriptions.

#### 1.2.3 Authorization Architecture
The application uses two distinct authentication mechanisms depending on the context:

- **SSR Pages & Middleware (`/`, `/library`, etc.):**
    - Rely on the **Session Cookie**.
    - Middleware verifies the cookie and enforces claims (`eula_accepted`, `account_created`).
    - Used for initial page load and server-side rendering.

- **API Routes (`/api/*`):**
    - Rely on the **Authorization Header** (`Bearer <firebase_id_token>`).
    - API endpoints verify the token signature directly via `serverAuth.verifyIdToken`.
    - The Status of the Session Cookie is **irrelevant** for API calls.

#### 1.2.3 Authorization & Gating

> **Note:** Server-side middleware enforcement is **TEMPORARILY DISABLED** (2025-12-21) due to login cycle issues.
> See `src/middleware.ts.disabled` and `docs/pbi/054-auth-middleware-gating.md` for details.

- **Role/Status Checks:** Custom Claims on the Firebase token are used for access control.
    - `eula_accepted`: User has accepted the EULA.
    - `account_created`: User has completed profile setup.
- **Client-Side Enforcement:** `src/components/svelte/AuthManager.svelte` checks claims on mount for UX.
    - If claims are missing, it attempts to fetch `/api/auth/status` to check for updates (handling stale tokens).
    - If checks fail, user is redirected to `/onboarding`.
- **Server-Side Enforcement (Middleware):** ~~Astro Middleware MUST inspect the session cookie for claims on protected routes.~~
    - ~~If a user attempts to access a protected route without valid claims (`eula_accepted`, `account_created`), the server must redirect to `/onboarding` *before* rendering.~~
    - **CURRENTLY DISABLED:** The middleware at `src/middleware.ts.disabled` was breaking the login cycle and has been temporarily disabled.

#### 1.2.5 Token Repair Strategy (API 401 Recovery)
- **Problem:** Client sends a request with an expired or invalid Firebase ID Token, causing the API to return `401 Unauthorized`.
- **Solution:**
    1.  Intercept `401 Unauthorized` responses in `authedFetch`.
    2.  Check if `auth.currentUser` is present.
    3.  **Attempt Repair:** Call `user.getIdToken(true)` to force a refresh with Firebase.
    4.  **Retry:** Retry the original request with the new token.
    5.  **Fail-safe:** If repair fails, trigger `logout()` to clean up the invalid state.
    5.  **Retry:** Retry the original failed request.
    6.  **Fail-safe:** If repair fails, trigger `logout()` to sync client state with server.

### 1.3 Anti-Patterns

#### Security Model Anti-Patterns (Critical)
- **No Middleware Blocking SSR:** SSR pages are read-only. Blocking them adds no security and breaks functionality. See Section 0.4.
- **No Conflating UX with Security:** Cookie gating hides pages cosmetically. It is NOT a security control. Real security is Firebase tokens on writes.
- **No Blocking "Incomplete" Users from Reading:** Users without `eula_accepted` can safely view read-only SSR content. Only write operations need claim enforcement.

#### Implementation Anti-Patterns
- **No Client-Side Cookie Access:** The `session` cookie must NEVER be accessible to client-side JS (enforced via `httpOnly`).
- **No Implicit Trust for Writes:** Write operations (API routes, CSR Firestore writes) must verify Firebase tokens, not rely on cookie presence.
- **No Redundant Logins:** `sessionState` logic prevents login loops by checking `initial` or `loading` states.
- **No Infinite Repair Loops:** The "Session Repair" logic must have a strict retry limit (e.g., 1 attempt) before giving up and logging out.

## 2. Contract

### 2.1 Definition of Done
- [x] Session cookie is correctly set with `Secure`, `HttpOnly`, and `SameSite` flags.
- [x] Session duration is exactly 5 days.
- [x] `AuthManager` correctly redirects users without `eula_accepted` or `account_created` claims (UX enforcement).
- [x] `sessionState` transitions correctly: `initial` -> `loading` -> `active`.
- [x] User logout clears both Client (Firebase) and Server (Cookie) sessions.
- [x] Session repair mechanism handles 401s by refreshing token and cookie, or logging out.
- [x] API routes verify Bearer tokens via `tokenToUid()` for write operations.
- [ ] ~~Astro Middleware enforces claim checks on protected routes.~~ **REMOVED:** Middleware was blocking safe read-only SSR pages. See Section 0.4.

### 2.2 Regression Guardrails
- **Cookie Security:** Ensure `httpOnly` and `secure` actributes are never removed from the session cookie configuration in `src/pages/api/auth/session.ts`.
- **Token Verification:** `verifySession` utility must always verify the cookie signature against the Firebase Admin SDK.
- **Race Guidelines:** `AuthManager` must handle the race condition where a server-side update to claims hasn't propagated to the client's cached ID token yet (implemented via `/api/auth/status` check).

## 3. Scenarios

### 3.1 Scenario: User Login
```gherkin
Given a user is on the login page
When they successfully authenticate with Firebase
Then the client retrieves a Firebase ID Token
And sends it to the "/api/auth/session" endpoint
And the server verifies the token
And the server sets a "session" cookie with 5-day expiry
And the client session state becomes "active"
```

### 3.2 Scenario: Missing Claims (Onboarding)
```gherkin
Given an authenticated user
And the user's ID token is missing the "eula_accepted" claim
When the AuthManager component mounts
Then it checks the "/api/auth/status" endpoint
And if the server status also shows EULA not accepted
Then the user is redirected to "/onboarding"
```

### 3.3 Scenario: Logout
```gherkin
Given a logged-in user
When they click logout
Then the client clears the local session stores
And signs out of Firebase Auth
And sends a DELETE request to "/api/auth/session"
And the server deletes the "session" cookie
```

### 3.4 Scenario: Token Repair (API)
```gherkin
Given the client believes the user is logged in
But the API returns a 401 Unauthorized for a request
When the client intercepts the 401 response
Then it attempts to force refresh the Firebase ID Token
And retries the original request with the new token
And if successful, returns the data
Or if unsuccessful, forces a client-side logout
```
