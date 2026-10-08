---
status: live
---

# Session

## Blueprint

### Context

Readers require a signed-in interface backed by the same account on the server.
Temporary verification failures do not force readers to sign in again.

### Architecture

Firebase client authentication supplies credentials for browser Firestore access.
The Firebase Admin SDK verifies the `session` cookie for server requests.
`@pelilauta/stores/session` reconciles these identities through
`/api/auth/session`. Server agreement follows either verification of a cookie for
the resolved Firebase user or acknowledged cookie creation from that user's
verified ID token. Agreement establishes neither client data readiness nor
resource access permissions.

`@pelilauta/utils/server/auth/verifySession` carries shared cookie verification.
Status checks distinguish rejected credentials from unavailable verification.
Protected routes retain existing guards, including
`@pelilauta/base/utils/requireSession`.

The optional [service worker](../../../apps/pelilauta/public/service-worker.js)
intercepts API traffic and participates in the session endpoint's cache and
replay exclusions.

[Login](../login/spec.md) governs sign-in presentation and return destinations.
[Settings](../library/settings/spec.md) governs account controls.

#### Server-rendering boundary

Server-rendered identity derives from cookie verification and passes only identity
data required by an island. Identity remains scoped to the request and never
populates module-level stores. Server identity establishes neither a
Firebase user nor authenticated client reads. Personalized responses remain
outside shared and offline caches.

Route guards retain authorization decisions; pathname-prefix middleware does not
replace them. The architecture retains Firebase
cookies and browser authentication. The contract excludes migration to
[Astro sessions](https://docs.astro.build/en/guides/sessions/) and moving browser
Firestore access to server APIs.

### Constraints

The contract governs verified session status and reconciliation between server
and browser identities. Extending SSR identity initialization requires a separate
decision. The specification preserves cookie lifetimes, client persistence,
renewal triggers, and protected-page authorization semantics.

The [session endpoint](../../../apps/pelilauta/src/pages/api/auth/session.ts)
defines cookie lifetime and attributes. The [session store](../../../apps/pelilauta/src/stores/session/index.ts)
recreates the cookie from persistent Firebase authentication without recent
interactive sign-in. Cookie expiry does not define a maximum
login duration. Returning `expiresAt` introduces no renewal timer or threshold.

This specification introduces no new protected-page recovery flow.

### Status protocol

`GET /api/auth/session` verifies the cookie with revocation checking before
returning identity. The endpoint performs no cookie creation, renewal, or deletion.

| Verification result | Response |
| :--- | :--- |
| The cookie verifies successfully. | The endpoint returns HTTP 200 with JSON containing only `uid` and `expiresAt`. `uid` carries the verified UID, and `expiresAt` carries the verified `exp` claim in Unix seconds. |
| The cookie is absent, expired, invalid, or revoked, or the account is disabled or deleted. | The endpoint returns HTTP 401 without identity data. |
| A verification dependency is unavailable. | The endpoint returns HTTP 503 without identity data. |
| Verification encounters an unclassified server error. | The endpoint returns HTTP 500 without identity data. |

Every GET response carries `Cache-Control: no-store`. Only recognized credential
failures map to HTTP 401. Unknown exceptions do not indicate invalid credentials.
Recognized dependency transport failures, timeouts, and service-unavailability
errors map to HTTP 503; other unclassified server errors map to HTTP 500.
Responses expose no tokens, cookie values, additional claims, or verifier
error details.

### Reconciliation

When checking server session status, the browser compares the returned UID
with the resolved Firebase user UID. A matching response accepts server
agreement without a POST request. A mismatched UID or an HTTP 401 response
requires exchanging the resolved user ID token through POST `/api/auth/session`
before confirming agreement. An HTTP 200 response to that POST acknowledges
cookie creation and establishes agreement without a second GET.

A failed repair POST leaves agreement unconfirmed and cannot produce a confirmed
active session. A transport failure or HTTP 5xx response preserves Firebase
authentication and permits a later repair attempt. An HTTP 401 response denotes
credential rejection and does not confirm a session.

A GET network failure, a server error, or a malformed success body leaves agreement
unconfirmed and permits a later check. Inconclusive checks trigger neither
speculative cookie creation nor Firebase sign-out. A valid success body
requires a non-empty string `uid` and a finite integer `expiresAt`. HTTP
status 200 from GET alone carries no identity evidence.

## Contract

### Definition of Done

- A status check identifies the verified cookie user and expiry without exposing
  credentials.
- Reconciliation distinguishes matching identities, credentials requiring repair,
  and incomplete verification.
- Reconciliation preserves a matching cookie without a replacement POST.
- Missing or mismatched credentials require successful repair before the browser
  accepts server agreement.
- A temporary repair failure preserves Firebase authentication for a later attempt.

### Regression Guardrails

- Persisted UID and session-state values do not substitute for status responses
  during reconciliation.
- A cookie response never supplies the UID for browser Firebase authentication.
- Session status never comes from a service-worker cache, including an entry saved
  before the status protocol changed. Exclude `/api/auth/session` from
  service-worker cache reads and writes.
- The service worker never queues or replays session mutations.
- Protected-page verification continues returning `null` for every verifier
  error. `requireSession` continues redirecting to login for that result, including
  during a verification outage. Other page guards retain their redirects and denials.

### Scenarios

```gherkin
Feature: Verified session agreement

  Scenario: Return verified identity
    Given a valid session cookie for account A with expiry E
    When the browser requests session status
    Then the endpoint checks revocation
    And the endpoint returns HTTP 200 with exactly {"uid":"A","expiresAt":E}
    And E is the cookie expiry in Unix seconds
    And the response carries Cache-Control: no-store

  Scenario Outline: Reject unusable credentials
    Given <credentials>
    When the browser requests session status
    Then the endpoint returns HTTP 401 without identity data
    And the response carries Cache-Control: no-store

    Examples:
      | credentials                         |
      | no session cookie                   |
      | an expired session cookie           |
      | an invalid session cookie           |
      | a revoked session cookie            |
      | a cookie for a disabled account     |
      | a cookie for a deleted account      |

  Scenario: Keep a matching cookie
    Given Firebase has resolved account A
    When session status returns a valid success body for account A
    Then reconciliation accepts server agreement
    And reconciliation sends no session POST

  Scenario Outline: Repair a cookie before accepting agreement
    Given Firebase has resolved account A
    When session status returns <result>
    Then reconciliation posts the ID token for account A through the existing session endpoint
    And agreement remains unconfirmed until that POST succeeds
    When the POST returns HTTP 200
    Then reconciliation accepts server agreement without a second GET

    Examples:
      | result                                |
      | HTTP 401                              |
      | a valid success body for account B    |

  Scenario Outline: Keep failed repair out of the active session
    Given Firebase has resolved account A
    And the server cookie requires repair
    When the repair POST encounters <failure>
    Then server agreement remains unconfirmed
    And reconciliation does not confirm an active session

    Examples:
      | failure            |
      | HTTP 401           |
      | HTTP 500           |
      | HTTP 503           |
      | a network failure  |

  Scenario Outline: Preserve Firebase authentication after a temporary repair failure
    Given Firebase has resolved account A
    When the repair POST encounters <failure>
    Then reconciliation retains Firebase authentication for account A
    And a later repair attempt remains possible

    Examples:
      | failure            |
      | HTTP 500           |
      | HTTP 503           |
      | a network failure  |

  Scenario Outline: Distinguish dependency outages from unclassified server errors
    Given verification encounters <failure>
    When the browser requests session status
    Then the endpoint returns <status> without identity data
    And the response carries Cache-Control: no-store

    Examples:
      | failure                                  | status   |
      | a recognized dependency timeout          | HTTP 503 |
      | a recognized dependency transport error  | HTTP 503 |
      | a recognized service-unavailability error | HTTP 503 |
      | an unclassified server error             | HTTP 500 |

  Scenario Outline: Preserve authentication after an inconclusive status check
    Given Firebase has resolved account A
    When the session check encounters <failure>
    Then reconciliation accepts no server agreement
    And reconciliation sends no session POST
    And reconciliation retains Firebase authentication for account A

    Examples:
      | failure                    |
      | a network failure          |
      | HTTP 503                   |
      | HTTP 500                   |
      | a malformed success body   |

  Scenario: Recover from an inconclusive status check
    Given an earlier status check left agreement unconfirmed
    And Firebase authentication for account A remains available
    When a later check returns a valid success body for account A
    Then reconciliation accepts server agreement

  Scenario: Recover from a temporary repair failure
    Given an earlier repair POST failed temporarily
    And Firebase authentication for account A remains available
    When a later repair POST for account A returns HTTP 200
    Then reconciliation accepts server agreement without another Firebase sign-in

  Scenario: Refuse cached identity during an outage
    Given a service worker has a cached successful session-status response
    And the network is unavailable
    When the browser checks session status
    Then the cached response does not establish server agreement

  Scenario: Do not queue session creation for background replay
    Given a service worker controls the page
    When a session POST fails because the network is unavailable
    Then the worker stores no session request for background replay
    When connectivity returns after the reader signs out
    Then the worker does not replay that session POST
```
