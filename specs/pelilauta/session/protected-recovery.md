---
status: live
---

# Protected-document recovery

## Blueprint

### Context

A reader with persistent Firebase authentication can lose access to protected pages
when the server cookie expires. Recovery restores access without repeating
interactive sign-in and preserves the requested destination.

### Architecture

Matched page guards rewrite rejected protected GET documents to the [Login](../login/spec.md)
recovery presentation. The rewrite preserves the browser address. Recovery renders no
protected content, serialized identity, or member subscriptions. The recovery target
remains unguarded and performs no further rewrites. Middleware re-entry installs a fresh
lazy resolver without invoking verification during recovery rendering.

[Session](spec.md) governs credential verification, cookie exchange, reconciliation,
concurrency, and logout. Recovery uses the Session protocol without establishing account or
profile subscriptions. A new document request verifies the resulting cookie and
repeats resource authorization before rendering protected content.

### Constraints

Recovery applies only to matched protected GET document routes. HEAD requests return
the corresponding failure status without a recovery body. APIs and mutations retain
existing authorization responses; recovery never replays a mutation or submitted form.
Authentication routes and recovery rendering never initiate protected-page recovery.
All recovery and authentication-dependent responses carry `Cache-Control: no-store`.

## Contract

### Required behavior

| Incoming protected document credentials | Server outcome |
| :--- | :--- |
| The cookie verifies. | Continue to route and resource authorization. |
| The cookie is absent, expired, invalid, or revoked, or the account is disabled or deleted. | Rewrite to non-sensitive recovery content with HTTP 401. |
| Verification is unavailable. | Show non-sensitive temporary-failure content with HTTP 503 and a retry action. Do not start automatic cookie repair. |
| Verification fails without classification. | Show non-sensitive failure content with HTTP 500 and a retry action. Do not start automatic cookie repair. |

The recovery page shows restoration progress, an explicit retry action, and sign-in
choices. Without JavaScript, the page states that browser restoration requires JavaScript
and links to the normal login route with the return destination.

#### Browser reconciliation

Recovery waits for Firebase to resolve the current user, then follows the status
and repair protocol in [Session](spec.md). A matching status or successful repair permits
one replacement navigation to the original protected address. The navigation carries
no credentials or identity parameters. When Firebase resolves no user, the page displays
sign-in choices without creating a cookie or navigating automatically.

A status HTTP 401 requires repair under Session. Network failures, HTTP 5xx responses,
and malformed status success bodies display an unavailable message with explicit retry.
Repair failures follow Session's authentication-retention and logout rules; the recovery
page displays the failure and any incomplete-logout notice. The presentation does not
distinguish revoked cookies from other rejected cookies.

A valid cookie without a Firebase user permits server-authorized documents; member
controls and direct Firestore reads remain unavailable until [Session](spec.md)
establishes agreement.

#### Attempt bounds

Each recovery visit starts at most one automatic attempt. Each automatic or reader-triggered
attempt performs at most one reconciliation, one repair POST, and one replacement document
navigation. Concurrent session consumers share that exchange.
A repeated recovery response for the same pathname and query in the same tab does not
restart automatic recovery, including after page reload or history navigation. Only explicit
retry or successful protected-document authorization clears this suppression. When tab
storage is unavailable, recovery requires explicit retry instead of starting automatically.

Explicit retry on HTTP 401 recovery starts a new bounded attempt, even after a prior
attempt fails. Retry on HTTP 503 or HTTP 500 requests the protected document again;
it does not start browser reconciliation from that failure page. Logout
or identity replacement supersedes an attempt under [Session](spec.md); obsolete completions
cannot trigger navigation. A stalled attempt leaves retry and sign-in choices usable, but retry
dispatches no further exchange until the pending exchange settles. Aborting a browser request
does not guarantee that cookie creation stopped; subsequent attempts and logout wait for the
dispatched exchange to settle.

#### Return destination

The server retains the original pathname and query before rewriting. The browser adds
the fragment from the unchanged address before recovery or sign-in navigation. Recovery
preserves these URL components through retry and supplies the validated `redirect`
destination from [Login](../login/spec.md) for interactive sign-in. Login's destination
validation applies to recovery targets. Without JavaScript, the login link contains
only the pathname and query.

### Regression Guardrails

- Rejected authentication never exposes protected content, even during active repair.
- A repaired cookie grants no resource permissions; owner and administrator denials
  trigger neither recovery nor automatic navigation.
- Public HTML and public-page enhancements preserve [Progressive Enhancement](../progressive-enhancement/spec.md).

### Scenarios

| Starting conditions | Action or event | Expected outcome |
| :--- | :--- | :--- |
| The cookie expired, Firebase retains user A, and the URL carries a query and fragment. | Repair succeeds. | A fresh document request preserves the destination and authorizes user A before rendering protected content. |
| Repair succeeds, but the browser rejects the cookie. | The replacement request returns recovery again. | Recovery displays retry and sign-in choices without initiating another automatic exchange or navigation. |
| The cookie belongs to user A, and Firebase resolves user B during recovery. | Reconciliation completes. | Only user B can establish agreement; the new document independently verifies resource permissions for user B. |
| Cookie verification is unavailable. | A reader requests a protected page. | HTTP 503 exposes no protected content and initiates neither automatic repair nor Firebase sign-out. |
| An unauthenticated mutation targets a protected resource. | Authorization fails. | The server renders no recovery document and replays no mutations. |
