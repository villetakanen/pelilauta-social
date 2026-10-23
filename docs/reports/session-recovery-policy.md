# Protected-document recovery policy

## Review boundary

[#184](https://github.com/villetakanen/pelilauta-social/issues/184) delivers approved
amendments to [Session](../../specs/pelilauta/session/spec.md), the
[recovery contract](../../specs/pelilauta/session/protected-recovery.md), and
[Login](../../specs/pelilauta/login/spec.md). Library and the account and site Settings
specs replace their login-redirect requirements with the shared recovery outcome.
The operator approved the authentication-policy changes and implementation in
[#185](https://github.com/villetakanen/pelilauta-social/issues/185). The six governing
specs carry `live` status.

## Existing behavior

- `apps/pelilauta/src/base/utils/requireSession.ts` redirects every verification
  failure to login and retains only `astro.url.pathname`.
- `apps/pelilauta/src/utils/server/auth/verifySession.ts` exposes rejected,
  unavailable, and unclassified failures through `checkSession`; the compatibility
  wrapper maps each failure to `null`.
- `apps/pelilauta/src/pages/login.astro` redirects verified cookies before rendering
  and mounts no session restoration flow.
- `apps/pelilauta/src/stores/session/index.ts` checks server agreement after Firebase
  resolves. The store repairs rejected or mismatched cookies, retains Firebase
  authentication after temporary failures, and attaches account and profile subscriptions
  after agreement.
- `apps/pelilauta/src/utils/client/sessionCookie.ts` shares cookie creation and coordinates
  creation against identity replacement and logout.
- `apps/pelilauta/src/pages/api/auth/session.ts` creates a five-day cookie without a
  recent-sign-in check. Expiry therefore imposes no maximum login duration.

The missing behavior is protected-document recovery before redirecting away from
browser credentials. The existing cookie exchange requires no replacement. Recovery
requires reconciliation without the member subscriptions attached by the session store.

## Transport comparison

| Transport | Effect | Constraint |
| :--- | :--- | :--- |
| Redirect to login with a validated return URL. | Use the existing login destination and make the interruption visible in the address bar. | The server cannot encode a browser-only fragment into the return query. Recovery must preserve the fragment separately before leaving the original document. |
| Rewrite to the login recovery presentation. | Keep the protected address, including the browser fragment, while rendering non-sensitive content. | Astro starts another rendering phase and re-executes middleware. The recovery target must remain unguarded, retain failure status and no-store headers, and avoid recursive recovery. |

The analysis recommends the rewrite transport. The rewrite preserves the requested
address without introducing a new public recovery URL. The proposal uses matched
guards rather than pathname authorization. A fresh document request performs both
authentication and resource authorization. A per-tab attempt bound prevents successful
cookie creation followed by cookie rejection from causing repeated automatic navigation.

### Astro evidence

The official [routing guide](https://docs.astro.build/en/guides/routing/#rewrites)
states that a rewrite preserves the browser address and starts a complete rendering
phase that re-executes middleware. The guide requires redirects before streaming page
content.

The official [middleware guide](https://docs.astro.build/en/guides/middleware/#rewriting)
distinguishes `context.rewrite()`, which re-enters middleware, from `next(path)`, which
rewrites in place. The guide warns about request-body consumption during middleware
rewrites. The proposal avoids mutation recovery and leaves rewriting at matched
document guards.

The inspected documentation source is `withastro/docs` commit
`ce41ff8b0ddca4e26b5cbf588cd81bd10572060c`, files
`src/content/docs/en/guides/routing.mdx` and
`src/content/docs/en/guides/middleware.mdx`. GitHits was unavailable in this checkout;
inspection examined the official repository directly. The locked Astro version is 7.2.0,
but no installed Astro runtime was available for a local experiment. The documentation
establishes transport semantics rather than adapter-specific status and header handling.

## Approval decisions

- Approve rewrite-based recovery at the original address, returning HTTP 401 for rejected
  credentials alongside separate HTTP 503 and HTTP 500 failure presentations.
- Retain silent renewal, the five-day cookie, and the absence of maximum login durations or
  recent-sign-in requirements.
- Approve one automatic reconciliation and replacement navigation, suppressing repeated
  recovery responses until explicit retry or successful authorization occurs.
- Retain the POST failure classification and logout behavior in
  [Session](../../specs/pelilauta/session/spec.md). The endpoint maps cookie-creation
  dependency failures to HTTP 401; changing that protocol falls outside this proposal.
- Preserve the pathname, query, and browser fragment across recovery and sign-in.
  Reject recursive authentication destinations and normalized off-origin destinations.

## Verification for implementation

1. Exercise rejected, unavailable, unclassified, and verified cookie results through
   Astro guards. Assert status, no-store headers, no protected data, middleware re-entry,
   and an unguarded recovery target. Repeat through the Netlify adapter.
2. Verify absent Firebase users, matching users, mismatched users, revoked credentials,
   failed repair, temporary failures, and missing JavaScript against the recovery contract.
3. Hold authentication and cookie exchange pending. Keep sign-in and retry controls
   usable without duplicate exchanges. Supersede work through logout and account changes.
4. Reject cookies after successful repair. Reload and traverse history on the repeated
   recovery response. Assert no automatic loop, including when tab storage is unavailable.
5. Navigate to a protected pathname with query and fragment. Exercise repair, explicit
   retry, provider login, and email completion. Assert the validated final destination.
6. Assert owner and administrator denials after successful authentication. Assert APIs,
   mutations, and public documents never enter recovery or replay submitted requests.
7. Run app `astro check`, `pnpm test`, and focused app browser checks under
   `delivery.yaml`. Reserve UAT for release review.

The parent [Session](../../specs/pelilauta/session/spec.md) spec exceeds the line target
defined in the spec skill. A separate recovery contract prevents expansion of the
existing reconciliation and logout contract.

## Spec review

Independent reviews identified conflicting status-failure handling, ambiguous attempt
budgets, destination-source precedence, and preserved redirects in the parent and
Settings specs. The revised proposals distinguish status HTTP 401 from service
failures, budget each attempt separately, preserve the guard-supplied recovery address,
and replace the conflicting redirect requirements in Library and both Settings specs.
All six amended or new specs passed independent review after these corrections.
Review identified no remaining policy blockers. Non-blocking findings concern repeated
prose and the runtime checks deferred to implementation.

The technical-writer command edited the proposals but timed out before returning its
report. A second run also timed out. A manual prose pass and the writing-guide greps
complete the local prose check; the automated writer report remains unavailable.
No runtime tests ran for this documentation-only increment.
