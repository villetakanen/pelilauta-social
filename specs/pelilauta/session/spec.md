---
status: live
---

# Session

## Blueprint

### Context

Readers need browser interactions and server requests to use the same account.
On shared devices, completed logout stops displaying reader data and acting as
that reader.

### Architecture

Firebase browser authentication supplies credentials for client Firestore access.
The server verifies a Firebase session cookie. The [session store][store] reconciles
these identities through the [session endpoint][endpoint]. Agreement confirms matching
accounts. Agreement establishes neither client data readiness nor resource permissions.
[Browser cookie synchronization][synchronization] coordinates explicit sign-in,
reconciliation, and logout within one document.

[Login](../login/spec.md) governs sign-in presentation and return destinations.
[Settings](../library/settings/spec.md) governs account controls.

#### Server-rendering boundary

Server rendering derives identity from cookie verification. Request-scoped identity
never enters module-level stores. Request-scoped identity supplies islands with
required identity data only. Server identity does not authenticate browser
Firestore reads. Shared and offline caches exclude personalized responses.

### Constraints

Session handling preserves cookie lifetimes, browser persistence, renewal triggers,
and protected-page authorization. The [session endpoint][endpoint] defines cookie
lifetime and attributes. Persistent Firebase authentication can recreate the cookie
without recent interactive sign-in. Cookie expiry imposes no maximum login duration.
Returning `expiresAt` introduces no renewal timer or threshold.

Scope excludes further SSR identity initialization, new protected-page recovery,
Astro sessions, migration of browser Firestore access to server APIs, and cross-device
revocation.

## Contract

### Required behavior

#### Cookie lifecycle

A successful `POST /api/auth/session` verifies the ID token and sets the `session`
cookie. A failed POST sets no cookie. `DELETE /api/auth/session` deletes the
`session` cookie. The endpoint creates no separate UID cookie.

#### Status protocol

`GET /api/auth/session` checks cookie revocation and mutates no cookies. Every GET
response carries `Cache-Control: no-store` and omits credentials, additional claims,
and verifier error details.

| Verification result | HTTP | Body |
| :--- | :--- | :--- |
| The request carries a valid session cookie. | 200 | The JSON response contains only `uid` and `expiresAt` derived from verified `uid` and `exp`. Expiry uses Unix seconds. |
| The cookie is absent, expired, invalid, or revoked, or the account is disabled or deleted. | 401 | The response contains no identity data. |
| A recognized dependency transport failure, timeout, or service unavailability occurs. | 503 | The response contains no identity data. |
| An unclassified server error occurs. | 500 | The response contains no identity data. |

Only recognized credential failures produce HTTP 401 for GET requests.

#### Reconciliation

Every resolved Firebase user requires a status check. A valid success body contains
a non-empty string `uid` and a finite integer `expiresAt`.

| Status result | Browser action |
| :--- | :--- |
| A valid HTTP 200 response matches the Firebase UID. | Accept server agreement without sending a POST request. |
| Status returns HTTP 401 or a valid HTTP 200 response with another UID. | POST the ID token of the resolved user to repair the cookie. |
| Status encounters a network failure, server error, or malformed HTTP 200 body. | Leave agreement unconfirmed, retain Firebase authentication for a later check, and send no POST request. |

Repair verifies the ID token before creating the cookie. HTTP 200 acknowledges creation
and establishes agreement without another GET. A failed repair leaves agreement
unconfirmed and establishes no active session. The endpoint maps failures during
ID-token verification or cookie creation to HTTP 401, including dependency failures.
Reconciliation reports sign-in failure and calls logout on that response. Network
failures and HTTP 5xx responses preserve Firebase authentication for retry.

#### Logout

Logout runs from `initial`, `loading`, `active`, and `error`. Logout blocks new cookie
creation and supersedes reconciliation and sign-in completion. Before deleting the
cookie, logout waits for dispatched creation to settle, including failed creation.
Logout then runs these steps in sequence:

1. Send DELETE to the [session endpoint][endpoint], requiring a 2xx response.
2. Clear persisted UID and subscriber data, and account and profile subscriptions.
3. Sign out of Firebase, setting session state to `initial` upon completion.

A failed step halts subsequent steps, sets state to `error`, and notifies the reader that
logout did not complete. The notice survives redirects. A retry repeats every step.
Concurrent callers await one logout operation and receive the same outcome.

When Firebase resolves no user, the [session store][store] calls logout unless state is `initial`.
If incomplete logout leaves Firebase signed in, the next page load reconciles again.
Successful reconciliation restores the active session and local user data.

#### Concurrent synchronization

Concurrent cookie-creation requests from explicit sign-in and reconciliation for the
same Firebase identity send one POST and receive the same response.
An identity change supersedes earlier work. Superseded work dispatches no further
requests and changes no session state, local user data, subscriptions, or sign-in
destination. When cookie creation remains in flight for a previous identity, the
browser dispatches no status check or creation POST for the new identity until the
in-flight POST settles, including failure.

Failed logout permits a new reconciliation or retry. Earlier work remains superseded
regardless of the logout outcome.

### Regression Guardrails

- Persisted UID and state never substitute for verified server status.
- A cookie never restores Firebase authentication or supplies the UID resolved by
  Firebase Auth.
- The [service worker][worker] neither reads nor writes session-endpoint caches,
  including previously cached responses, and never queues or replays its mutations.
- [Protected-page verification][verifier] returns `null` on every verifier error.
  [requireSession][guard] redirects to login on `null`, including during outages.
  Other guards retain redirects and denials. Pathname-prefix middleware
  does not replace route authorization.

### Scenarios

| Starting conditions | Action or event | Expected outcome |
| :--- | :--- | :--- |
| Firebase resolves user A while the session cookie belongs to user B. | Status returns user B, and repair returns HTTP 200. | Agreement remains unconfirmed until repair succeeds, with no subsequent GET request. |
| Firebase resolves user A and the cookie requires repair. | Cookie creation fails and POST returns HTTP 401. | The browser reports sign-in failure and calls logout. |
| A status check or repair fails temporarily while Firebase retains user A. | A later check verifies user A or repair returns HTTP 200. | The browser establishes agreement without interactive sign-in. |
| A service worker holds a cached successful status response. | The browser requests status while offline. | Cached identity does not establish agreement. |
| A session POST fails offline before the reader signs out. | Connectivity returns. | The service worker does not replay the POST request. |
| Explicit sign-in and reconciliation request cookie creation concurrently for user A. | POST returns HTTP 200. | Both operations receive the same success response from one POST. |
| Cookie creation for user A remains in flight. | The reader starts logout. | Creation settles before deletion, and its completion restores no local user data or sign-in destination. |
| Cookie creation for user A remains in flight. | Firebase resolves user B. | Creation for A settles before creation for B, and A restores no local user data or subscriptions. |
| User A is signed in. | Cookie deletion fails during logout. | Local data and Firebase authentication remain, state becomes `error`, and the notice survives redirects. |
| Cookie deletion and local cleanup succeed. | Firebase sign-out fails. | Logout remains incomplete, state becomes `error`, and the reader receives a notice. |

[synchronization]: ../../../apps/pelilauta/src/utils/client/sessionCookie.ts
[store]: ../../../apps/pelilauta/src/stores/session/index.ts
[endpoint]: ../../../apps/pelilauta/src/pages/api/auth/session.ts
[verifier]: ../../../apps/pelilauta/src/utils/server/auth/verifySession.ts
[guard]: ../../../apps/pelilauta/src/base/utils/requireSession.ts
[worker]: ../../../apps/pelilauta/public/service-worker.js
