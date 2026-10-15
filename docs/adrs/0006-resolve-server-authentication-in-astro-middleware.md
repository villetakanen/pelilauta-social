# ADR 0006 — Resolve server authentication through Astro middleware

- **Status:** accepted
- **Date:** 2026-10-13
- **Decided by:** Ville Takanen.

## Context

Pelilauta uses two Firebase credentials: a browser authentication session for direct Firestore access and an HTTP-only session cookie for server requests. An expired cookie does not indicate that browser authentication expired. The initial document request carries the cookie but cannot expose persisted browser credentials to the server.

Server routes invoke Firebase verification through page guards or direct verifier calls. Each invocation performs separate verification; pages, endpoints, and server components share no request-scoped result. Protected routes redirect before browser code can repair an expired cookie.

Astro provides middleware and `locals` for request-scoped services. The [Astro authentication guidance](https://docs.astro.build/en/guides/authentication/) combines middleware authentication with route-level access checks. The guidance states that raw URL pathname matching can disagree with router matching. Middleware adoption leaves authorization at route boundaries instead of pathname prefixes.

Public documents permit shared caching and do not depend on the requesting identity. Verifying cookies on every document request introduces Firebase latency and availability dependencies into identity-independent rendering.

## Decision

Introduce an authentication resolver through Astro middleware. Store the resolver in `context.locals`; allocate resolver state inside the middleware invocation. Resolver installation performs no verification or cookie mutation.

The first consumer invokes the Firebase cookie verifier. Memoize the in-flight promise so concurrent and subsequent consumers share one result for the request. Preserve the verifier distinctions among verified credentials, rejected credentials, unavailable verification, and unclassified failure. No module-level variable or cross-request cache stores the resolved identity or verification promise.

The result describes the incoming cookie. Creating or deleting a cookie does not authenticate the active request. A subsequent request verifies the resulting cookie independently.

Keep authorization at the matched route or resource boundary. Session, administrator, and site-owner guards consume the resolver; each guard enforces its access requirements. API handlers retain server-side authorization regardless of client presentation. Do not infer access from a pathname prefix or a previously rendered document.

Public rendering does not call the resolver to personalize HTML or serialized island properties. Protected HTML and authentication-dependent responses exclude shared caching. Request-scoped identity remains on the server unless an approved contract requires specific identity properties in the browser.

Retain Firebase browser authentication and the existing cookie exchange. `Astro.session` does not replace the credential store. Middleware cannot renew a Firebase cookie without a valid ID token from the browser.

Use a shared browser recovery flow when the approved lifecycle contract permits recovery. Recovery renders no protected data, exchanges a browser ID token through the session endpoint, and retries the protected document after cookie creation succeeds. The retried request requires server authentication and resource authorization. A server-verified cookie does not establish browser Firestore readiness.

[Task #184](https://github.com/villetakanen/pelilauta-social/issues/184) settles recovery eligibility, failure presentation, retry bounds, and redirect versus rewrite before implementation. This ADR selects no transport and authorizes no changes to credential lifetime, revocation policy, or recent-sign-in requirements.

## Consequences

Consumers share a verification result and avoid duplicate Firebase verification within a request. Lazy resolution isolates public rendering from Firebase authentication availability. Middleware introduces a request-scoped service dependency that tests supply or exercise through Astro.

Automatic recovery requires browser execution and another document request. Visits without JavaScript cannot recover credentials held only by the Firebase browser SDK. Redirect and rewrite implementations preserve a sign-in path when automatic recovery fails.

Replacing direct verifier calls requires an audit of protected routes and session endpoints. Verification tests cover concurrent consumers, isolation between two users, dependency failures, public requests without verification, response cache headers, and retained resource authorization. Recovery tests cover failed exchanges and bounded retries in the browser.

The [Session](../../specs/pelilauta/session/spec.md) and [Login](../../specs/pelilauta/login/spec.md) specs govern implementation. Amend them through the approval workflow before changing protected-page recovery. [Progressive Enhancement](../../specs/pelilauta/progressive-enhancement/spec.md) governs public rendering. This decision introduces no protected-page identity bootstrap from #183 and adopts no new authentication provider.
