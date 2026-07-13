# PBI-056: Implement Session Repair Strategy

## Background
A "Split-Brain" state can occur where the Client (Firebase SDK) believes the user is logged in, but the Server (Session Cookie) has expired or is invalid. This results in 401 errors on API calls. We need a "Session Repair" mechanism to automatically recover from this state.

## Requirements
1.  **Intercept 401s:** Update `src/firebase/client/apiClient.ts` (or the relevant global fetch wrapper).
2.  **Handle Unauthorized:** When a 401 response is received:
    *   Check if `auth.currentUser` exists on the client.
    *   If yes, attempt to force-refresh the ID token: `await user.getIdToken(true)`.
    *   POST the new token to `/api/auth/session` to re-establish the cookie.
    *   **Retry** the original failed request with the new session.
3.  **Fail-Safe:**
    *   If the token refresh fails, OR the re-session fails, OR the retry fails:
    *   Trigger a full `logout()` to sync the client state (sign out of Firebase) with the server.
4.  **Loop Prevention:** Ensure this logic tries only ONCE per original request to avoid infinite loops.

## Context
Refers to "1.2.4 Session Repair Strategy" and "3.4 Scenario: Split-Brain Recovery" in `docs/specs/session-and-auth.md`.

## Definition of Done
- [ ] `authedFetch` (or equivalent) intercepts 401 errors.
- [ ] Session is successfully repaired transparently to the user when a cookie expires but Firebase session is valid.
- [ ] User is logged out if repair fails.
