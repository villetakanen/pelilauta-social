---
status: live
---

# Session

## Blueprint

### Context

Readers need browser interactions and server requests to use the same account.
On shared devices, completed logout must stop displaying the reader's data and
acting as that reader.

### Architecture

Firebase browser authentication supplies credentials for client Firestore access.
The server verifies a Firebase session cookie. The [session store][store] reconciles
these identities through the [session endpoint][endpoint]. Agreement confirms matching
accounts. Agreement establishes neither client data readiness nor resource permissions.

[Login](../login/spec.md) governs sign-in presentation and return destinations.
[Settings](../library/settings/spec.md) governs account controls.

#### Server-rendering boundary

Server rendering derives identity from cookie verification. Request-scoped identity
never enters module-level stores and supplies islands with required identity data only.
Server identity does not authenticate browser Firestore reads. Shared and offline
caches exclude personalized responses.

### Constraints

Session handling preserves cookie lifetimes, browser persistence, renewal triggers,
and protected-page authorization. The [session endpoint][endpoint] defines cookie
lifetime and attributes. Persistent Firebase authentication can recreate the cookie
without recent interactive sign-in. Cookie expiry imposes no maximum login duration.
Returning `expiresAt` introduces no renewal timer or threshold.

Scope excludes further SSR identity initialization, new protected-page recovery,
Astro sessions, migration of browser Firestore access to server APIs, cross-device
revocation, and ordering logout against in-flight cookie creation.

## Contract

### Required behavior

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
| Status returns HTTP 401 or a valid HTTP 200 response with another UID. | POST the resolved user's ID token to repair the cookie. |
| Status encounters a network failure, server error, or malformed HTTP 200 body. | Leave agreement unconfirmed, retain Firebase authentication for a later check, and send no POST request. |

Repair verifies the ID token before creating the cookie. HTTP 200 acknowledges creation
and establishes agreement without another GET. A failed repair leaves agreement
unconfirmed and establishes no active session. The endpoint maps failures during
ID-token verification or cookie creation to HTTP 401, including dependency failures.
The browser reports sign-in failure and calls logout on that response. Network
failures and HTTP 5xx responses preserve Firebase authentication for retry.

#### Logout

Logout works from `initial`, `loading`, `active`, and `error`, in this order:

1. Delete the session cookie through the [session endpoint][endpoint], requiring a 2xx response.
2. Clear persisted UID and subscriber data, and account and profile subscriptions.
3. Sign out of Firebase, setting session state to `initial` upon completion.

A failed step halts subsequent steps, sets state to `error`, and notifies the reader that
logout did not complete. The notice survives redirects. A retry repeats every step.
Concurrent callers await one logout operation and receive the same outcome.

When Firebase resolves no user, the [session store][store] calls logout unless state is `initial`.
If incomplete logout leaves Firebase signed in, the next page load reconciles again.
Successful reconciliation restores the active session and local user data.

### Regression Guardrails

- Persisted UID and state never substitute for verified server status.
- A cookie never restores Firebase authentication or supplies its UID.
- The [service worker][worker] neither reads nor writes session-endpoint caches,
  including previously cached responses, and never queues or replays its mutations.
- [Protected-page verification][verifier] returns `null` on every verifier error.
  [requireSession][guard] redirects to login on `null`, including during outages.
  Other guards retain their redirects and denials. Pathname-prefix middleware
  does not replace route authorization.

### Scenarios

| Starting conditions | Action or event | Expected outcome |
| :--- | :--- | :--- |
| Firebase resolves user A while the session cookie belongs to user B. | Status returns user B, and repair returns HTTP 200. | Agreement remains unconfirmed until repair succeeds, with no subsequent GET request. |
| Firebase resolves user A and the cookie requires repair. | Cookie creation fails and POST returns HTTP 401. | The browser reports sign-in failure and calls logout. |
| A status check or repair failed temporarily while Firebase retains user A. | A later check verifies user A or repair returns HTTP 200. | The browser establishes agreement without interactive sign-in. |
| A service worker holds a cached successful status response. | The browser requests status while offline. | Cached identity does not establish agreement. |
| A session POST failed offline before the reader signed out. | Connectivity returns. | The service worker does not replay the POST request. |
| User A is signed in. | Cookie deletion fails during logout. | Local data and Firebase authentication remain, state becomes `error`, and the notice survives redirects. |
| Cookie deletion and local cleanup succeed. | Firebase sign-out fails. | Logout remains incomplete, state becomes `error`, and the reader receives a notice. |

[store]: ../../../apps/pelilauta/src/stores/session/index.ts
[endpoint]: ../../../apps/pelilauta/src/pages/api/auth/session.ts
[verifier]: ../../../apps/pelilauta/src/utils/server/auth/verifySession.ts
[guard]: ../../../apps/pelilauta/src/base/utils/requireSession.ts
[worker]: ../../../apps/pelilauta/public/service-worker.js
