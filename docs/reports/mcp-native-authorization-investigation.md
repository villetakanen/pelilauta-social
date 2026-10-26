# MCP authorization through Astro routes

## Finding

The #214 spike can serve MCP through Astro API routes without an additional HTTP
routing framework. Two OAuth libraries can supply authorization-code processing,
but neither supplies the complete MCP authorization server required by the spike.

Use `@modelcontextprotocol/server@2.3.1` and jmondi for the next Astro and Firebase
consent proof. The native and Firestore proofs below establish the required
repository and claim hooks without changing application dependencies. Preserve the existing
Firebase browser session and obtain consent through application routes.

## MCP transport

The split server package exports `createMcpHandler`, `requireBearerAuth`, and
`oauthMetadataResponse`. Its handler accepts native `Request` objects and returns
native `Response` objects. Astro can dispatch to these functions directly.

The isolated dependency tree contains the server package, its core package, and
Zod. It contains no Express, Hono, or HTTP adapter. The previously selected
`@modelcontextprotocol/sdk@1.32.1` includes those framework dependencies; selecting
native imports from that package would not remove them from its dependency graph.

An isolated in-memory proof passed the following checks:

- Anonymous calls receive a 401 challenge before MCP dispatch.
- A token for another resource receives 401 before MCP dispatch.
- Initialization, tool discovery, and a fixture tool call complete through native
  requests and responses.
- The fixture response preserves Finnish and Swedish text.

The proof starts no HTTP listener. It uses the SDK's stateless compatibility path
for protocol version `2025-11-25`. It does not establish Astro adapter behavior,
Netlify deployment behavior, or compatibility with either target assistant.

The package source is pinned to
[typescript-sdk v2.3.1](https://github.com/modelcontextprotocol/typescript-sdk/tree/fcef852f6cdafea07f36cf6fae69b37c8adf85be).
The relevant modules are `packages/server/src/server/createMcpHandler.ts`,
`packages/server/src/server/middleware/bearerAuth.ts`, and
`packages/server/src/server/middleware/oauthMetadata.ts`.

## OAuth cores

| Component | Verified fit | Remaining application work |
| :--- | :--- | :--- |
| `@node-oauth/oauth2-server@5.3.1` | Its request and response objects wrap parsed HTTP data without a router. Public-client authorization-code flow, S256 PKCE, exact registered redirects, and scope enforcement passed an isolated proof. | Fetch adapters, Firebase identity and consent, registration, discovery, revocation endpoints, resource binding, and transactional persistence remain necessary. |
| `@jmondi/oauth2-server@5.0.0` | Its supplied Fetch adapter accepts native requests and returns native responses. An isolated proof accepted the correct S256 verifier, rejected an incorrect verifier, rotated a refresh token, and rejected sequential refresh replay. | Firebase identity and consent, client registration, MCP discovery, resource binding, and transactional persistence remain necessary. Its redirect policy permits normalization and loopback-port variation, so the spike requires an additional exact-match check. |

The first library ignores the `resource` parameter. Its proof confirmed that
issued and authenticated tokens have no resource or audience binding by default.
The second library reads `audience` or `aud` during authorization; its inspected
code does not establish RFC 8707 resource propagation through the authorization-code
flow. Neither result permits treating audience enforcement as supplied behavior.

Both libraries split refresh-token consumption and replacement into separate
persistence calls. Sequential replay rejection does not establish concurrent replay
safety. Firestore adapters must reject competing consumption attempts and define
recovery after consumption succeeds but replacement persistence fails.

The Node OAuth library consumes the authorization code before checking the PKCE
verifier. Its local proof confirmed that an incorrect verifier consumes the code.
The jmondi library checks PKCE before issuing tokens, then revokes the code after
issuance. These sequences require different persistence and failure handling.

The canonical source references are
[node-oauth 5.3.1](https://github.com/node-oauth/node-oauth2-server/tree/5e081f2e5b22d987d5b8f09e7183d825b84b502c)
and [jmondi 5.0.0](https://github.com/jasonraimondi/ts-oauth2-server/tree/01dd503c1b1ad04f03924dddbe62c91204d2284b).
For Node OAuth, inspect `lib/handlers/authorize-handler.js:323`,
`lib/grant-types/authorization-code-grant-type.js:57`, and
`lib/grant-types/refresh-token-grant-type.js:46`. For jmondi, inspect
`src/adapters/vanilla.ts:67`, `src/grants/auth_code.grant.ts:108`, and
`src/grants/refresh_token.grant.ts:23`.

## Bounded jmondi proof

[`tools/mcp-authorization-proof`](../../tools/mcp-authorization-proof/README.md)
contains an isolated package and reproducible tests. Twelve tests passed on Node
22.23.4 and Node 24.14.0. The workspace's existing `pnpm test` gate also passed all
1,158 tests. `pnpm lint` passed with four existing warnings. Independent review
found no remaining blocker in the bounded proof. Prose word-list checks passed;
the technical-writer runner reached its 90-second print timeout without a completed
report.

The proof establishes the following application policies through library hooks:

- Authorization, exchange, and refresh require one fixed resource. Codes and token
  records carry that resource; the signed audience comes from the stored grant.
- Redirects match the registered string before library normalization, including
  the registered port of a loopback URI. Missing, duplicate, and fragment-bearing
  redirects fail.
- Codes remain bound to their client, redirect, PKCE verifier, and verified mock
  user. Refresh preserves the stored user independently of browser identity.
- Each operation stages repository changes until library processing succeeds.
  Commit checks the original credential and applies consumption and replacement
  together. Two operations that validate the same code or refresh token produce
  one successful commit and one rejection.
- Failures before commit and after staging replacements preserve the complete
  store. A fresh request can retry the original credential.
- The native bearer gate accepts an issued token and rejects anonymous callers,
  forged signatures, expired tokens, another audience, revoked records, and
  insufficient scope.

The application supplies these fixed-resource policies and repository semantics;
jmondi does not acquire general RFC 8707 support through this proof. The commit
uses cloned in-memory maps. It establishes that the library permits deferred
transactional persistence, not that a Firestore adapter implements it correctly.
The proof returns no response before commit. A response lost after successful
commit still leaves the original credential consumed.

## Firestore transaction proof

The isolated package now includes a guarded Firestore adapter and an opt-in
integration suite. It pins `firebase-admin` 14.5.0; application dependencies remain
unchanged. The adapter shares the in-memory state transition and rereads consumed
records inside each transaction before scheduling consumption and replacement
writes. Each new record uses Firestore's create precondition.

Five live tests passed against `skaldbase-test` on Node 22.23.4 and Node 24.14.0:

- Authorization, exchange, reload, bearer verification, and refresh preserve the
  signed audience and delegated mock identity.
- Independently loaded stores competing for one code produce one successful
  response, one conflict, and one persisted replacement.
- Independently loaded stores competing for one refresh token produce the same
  single-consumer result and preserve the original delegated identity.
- A throw after transaction writes have been scheduled leaves every record
  unchanged. Code and refresh retries succeed through fresh stores.
- Transaction rereads reject snapshots that predate code or refresh consumption
  or revocation without creating additional records.

Each run created eight code records and eleven token records under a random
`mcpAuthorizationProof214` namespace. Both runs deleted their records and asserted
that the parent document and both child collections were empty. The suite touched
no game content or Auth accounts.

Eighteen offline tests passed on both Node versions. They include the twelve
native proof tests and six preflight and cleanup safety tests. The default test
command excludes the live suite. Live execution requires explicit opt-in and
matching service-principal and application project IDs. The guard rejects an
emulator target before initialization. Snapshot queries have explicit limits and
abort when the per-run bound exceeds 120 records.

`pnpm lint` passed with four existing warnings. Independent review found no
blocker in the guarded Firestore proof. The isolated package's npm audit reports
no known advisories. A clean `npm ci --ignore-scripts` installation passed the
offline suite even with the live opt-in present; the live command without that
opt-in failed before initialization. The proof still uses synthetic identities and a
fixed test signing secret; it supplies no production credential handling or
permission checks. Snapshot preloading remains a proof convenience, not a
production read-authorization cache.

### Separate application dependency finding

Before the separately approved application upgrade, the application resolved
`firebase-admin` 13.6.0 and `node-forge` 1.3.1. The latter falls within the
high-severity signature-verification advisory
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
An isolated 13.6.0 installation reproduced that advisory. Firebase Admin 13.10.0
removed the high-severity finding but retained eight moderate advisories;
14.5.0 cleared the isolated audit. The operator approved upgrading the application
to 14.5.0 before the Firebase consent stage.

### Application upgrade

The application now declares `firebase-admin` `^14.5.0`. Its manifest and `.nvmrc`
require Node 22; Netlify already declares that version and its configuration stays
unchanged. Server initialization uses `getApps`, `cert`, and `initializeApp` from
`firebase-admin/app` because version 14 removes the legacy namespace API. The
initializer retains its existing first-app reuse and credential configuration.

The lockfile refreshes the SDK's supported transitive dependencies, including
`@grpc/grpc-js` 1.14.6 and `protobufjs` 7.6.6. Initial top-level installation reused
older vulnerable workspace versions, so verification covers the refreshed tree.
The upgrade changes no cookie lifetime, revocation policy, browser Firebase
provider, production data, security rule, public address, or deployment setting.

The browser subscription regression now waits for `domcontentloaded`, followed
by its existing listener assertion. An earlier run timed out waiting for `load`
after the thread document had returned 200 and rendered. The test still checks
listener termination after logout and retains its existing timeout and no-retry
policy.

| Application upgrade check | Result |
| :--- | :--- |
| Frozen workspace installation | Passed. |
| Application type check and production build | Passed; one existing Zod deprecation hint remains. |
| `pnpm test` | All 1,158 workspace tests passed. |
| App browser suite on Node 22 | All 60 tests passed in the final run. |
| Generated Netlify function on Node 22 | Passed, including a real malformed-cookie rejection from the installed SDK and classified recovery, denial, and cache cases. |
| `pnpm lint` | Passed with four existing warnings. |

An intermediate browser run passed 58 tests and hit two navigation timeouts.
The subscription test now waits for the relevant document and listener signals.
The inbox failure case remains unchanged and passed in the final full run; its
earlier navigation delay remains unclassified. No retries or larger timeouts
were added. Generated-function checks run after a production build with the
development server stopped, because `astro dev` replaces the generated output.
The verification server has stopped. No commit, deployment, or UAT run occurred.

The SDK-upgrade audit recorded five critical findings among its pre-existing
advisories, with no new advisory IDs relative to the branch baseline. The separately
approved [critical dependency remediation](critical-dependency-triage.md) clears
those findings; both current production and full workspace audits report zero
critical findings. Noncritical findings remain. Displayed advisory paths do not enumerate all consumers of shared
dependencies; an advisory shown under Netlify can also apply to a version resolved
by the SDK. Remaining workspace findings require separate dependency and
reachability assessment. [Critical dependency triage](critical-dependency-triage.md)
records the four advisories behind those five findings and their verified fixes. The isolated proof's clean
npm audit does not establish a clean application audit.

## Broader authentication stack

`@better-auth/oauth-provider@1.7.12` supplies more authorization-server behavior,
but it requires Better Auth and its session model. Its authorization implementation
calls `getSessionFromCtx` and uses `sessionMiddleware` from `better-auth/api`.
Adoption would require another authentication integration rather than adding an
OAuth core behind the existing verified Firebase session. This investigation did
not prove that integration.

## Recommendation and verification limits

Continue the spike with jmondi's native adapters and request-local repositories.
Exercise Astro, Netlify, Firebase consent, and both target clients before
application adoption.
Node OAuth remains an alternative if integration reveals an unsupported requirement.

The initial investigation installed packages and ran proofs only under
`/tmp/pelilauta-214/investigation/`. The bounded proof adds an isolated tools package
outside the application workspace. Neither proof stage changed application
dependencies or cloud configuration. The operator subsequently approved the
separate application SDK upgrade recorded above. The earlier Express draft has been archived outside the
repository; its dependency changes have been removed. The Firestore stage wrote
only isolated test-project records and removed them. No production MCP endpoint, Firebase-to-MCP consent integration, or ChatGPT Work
or Claude Cowork connection passed verification in this investigation.
