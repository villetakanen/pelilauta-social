# Protected-document recovery

## Scope

[#185](https://github.com/villetakanen/pelilauta-social/issues/185) implements the live
[recovery contract](../../specs/pelilauta/session/protected-recovery.md),
[Session](../../specs/pelilauta/session/spec.md), and
[Login](../../specs/pelilauta/login/spec.md). The root version and changelog declare
21.2.0.

## Implementation

- Matched page guards rewrite rejected GET documents to the existing login route
  at the requested address. Classified failures retain HTTP 401, 503, or 500 and
  no-store headers. HEAD responses omit the body. APIs, mutations, and resource
  denials retain their existing responses.
- Recovery shares status checks and cookie creation without starting member
  subscriptions. Session state and logout no longer require importing the module
  that starts member reconciliation.
- Automatic restoration runs once per pathname and query in a tab. Explicit retry
  shares pending work; unavailable tab storage requires explicit retry. Successful
  protected rendering clears suppression.
- Recovery crosses a full-document boundary when a view transition retains an
  existing session manager. Hidden development-router iframes perform no automatic
  recovery. Navigation to the current fragment-bearing address reloads the document
  before protected content can render.
- Provider and email sign-in retain validated return destinations. Email callbacks
  carry the destination independently of saved browser state. Disabled tab storage
  blocks neither cookie repair nor successful sign-in navigation.
- The service worker rejects no-store and private responses on cache writes and
  reads. Historical cache entries without privacy headers remain part of
  [#206](https://github.com/villetakanen/pelilauta-social/issues/206); this increment
  does not add logout-time cache deletion.

The governing specs remain live. Reconciliation against those contracts found no
new policy decision requiring a spec amendment.

## Verification

| Check | Result |
| :--- | :--- |
| `pnpm verify` | Passed: lint, 1,158 unit tests, and workspace builds. Lint reports four existing warnings; app type checking reports one existing Zod deprecation hint. |
| App production build | Passed, including Netlify runtime dependency checks and service-worker generation. |
| `node apps/pelilauta/test/netlify/protected-recovery.mjs` | Passed against the generated Netlify function. |
| Latest app browser suite | All 60 tests passed in 2.8 minutes, including authenticated-state isolation and restoration after logout. |
| Prose word-list checks | Passed over the changed delivery prose. |
| Automated technical writer | Repeated runs timed out without a completed report, including the pre-publication pass. |

The adapter checks substitute classified verifier results within one Node process.
They exercise middleware re-entry, private headers, rejected and unavailable
credentials, unclassified failures, HEAD and API responses, owner denial, public
rendering, mutation exclusion, and production password-form exclusion. Same-origin
SSR fetches run through the generated function; no development server is required.
The checks reject builds targeting any Firebase project except `skaldbase-test`.

Browser coverage includes genuine test-project authentication and cookie exchange,
return-destination preservation, explicit retry, discarded cookies, disabled tab
storage, owner denial after repair, incomplete logout, and JavaScript-disabled
fallback. Email delivery and email-action responses are intercepted; the resulting
session-cookie exchange uses a real test-user token.

An earlier browser run encountered stale Vite optimized-dependency URLs after a
production build. Restarting the development server removed those HTTP 504 failures.
A subsequent run exhausted Firebase's password-verification quota. The
[authentication reuse setup](../../apps/pelilauta/e2e/README.md#authentication-reuse)
replaces per-test password verification with isolated browser-state copies. The
latest complete run passed without quota retries or authentication bypass. Temporary
session files were removed after the run.

## Remaining delivery checks

Human visual review and release acceptance remain pending. UAT did not run during
implementation. The increment changes no security rules or production data.
The development server started for verification has stopped.
