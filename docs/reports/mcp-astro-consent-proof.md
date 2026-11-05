# MCP consent through Astro

## Result

The local #214 increment connects the existing Firebase session to consent,
OAuth exchange, disconnect, and a read-only MCP fixture tool. The application
routes remain disabled without explicit test-project configuration. The authorized
Firestore rerun used isolated synthetic authorization records. The separate
Netlify project now serves an enabled read-only fixture proof. Two hidden fixture
sites and their pages use an isolated namespace and existing test accounts.
Preparation created no Auth accounts, leaving production data and provider configuration
remain unchanged. ChatGPT Work and Claude Cowork connections remain untested.

The operator approved a test-project origin-check exception for `/mcp/token`.
Astro has no route-level override, so explicitly enabled test builds replace its
native check with application middleware. The replacement permits only originless,
URL-encoded POSTs to that exact path on the configured test origin. All other
requests retain Astro's form-origin policy, including consent, disconnect, and
browser session routes. Production retains Astro's native check.

The generated-function regression exercises enabled and disabled builds without
cloud requests. Forged codes and refresh tokens reach OAuth validation and return
HTTP 400 in the enabled build. Cross-origin requests, browser forms without an
origin, and path variants still return HTTP 403.

## Implementation

`apps/pelilauta/src/site/server/mcp/` carries the shared OAuth and Firestore core,
configuration guard, HTTP handlers, and Firebase integration. The earlier tools
package imports that core rather than maintaining another implementation.
Install workspace dependencies before running the tools package.

| Route | Behavior |
| :--- | :--- |
| `/mcp/authorize` | GET verifies the browser session and displays consent. A same-origin POST binds approval to the account and authorization parameters. |
| `/mcp/token` | POST exchanges a code or rotates a refresh token after transactional consumption. Enabled test builds admit originless URL-encoded requests. |
| `/mcp` | Authenticated POST serves initialization, discovery, and `read_fixture_page`. |
| `/mcp/disconnect` | A confirmed same-origin POST invalidates every spike grant for the account in this namespace. |
| `/.well-known/oauth-authorization-server` | GET publishes authorization-server metadata. |
| `/.well-known/oauth-protected-resource/mcp` | GET publishes resource metadata. |

The tool accepts only `mcp-proof-214-a` and `mcp-proof-214-b` and reads their `proof`
pages. Each read requires current fixture-site membership and returns only the
page title, Markdown, and citation. This restricted fixture policy does not define
production MCP read permissions.

Every exchange, renewal, and bearer check validates the delegated Firebase account
and its credential-revocation timestamp. Consent records retain the original
Firebase authentication time. Account disablement, deletion, grant expiry, and
disconnect prevent subsequent access. Browser logout retains its existing meaning.

The provisional access-token lifetime is five minutes. Codes and consent proofs
also expire after five minutes. Grants expire one hour after consent; refresh
cannot extend that deadline. Records remain until explicit namespace cleanup.
Store loading rejects a namespace containing more than 120 code and token records.
These settings govern the isolated spike and do not define production policy.

## Development configuration

Configure the following values through untracked environment settings. Leave the
enable flag absent from production. Supply the enable flag, project ID, and origin
in the process environment before starting Astro or building the test deployment.
The config file derives the origin exception from those values and embeds its
selected origin in middleware. Setting only `.env` values does not enable the
build-time exception. Supply the full configuration to the server runtime as well;
the route reads each secret explicitly because Vite omits secrets from the whole
`import.meta.env` object.

| Variable | Accepted value |
| :--- | :--- |
| `SECRET_MCP_SPIKE_ENABLED` | `true` explicitly enables the routes. |
| `PUBLIC_projectId` | `skaldbase-test` is required. The Firestore client must independently report the same project. |
| `SECRET_MCP_SPIKE_ORIGIN` | An HTTPS `netlify.app` origin, or `http://localhost:4321` during Astro development. |
| `SECRET_MCP_SPIKE_NAMESPACE` | A version-4 UUID identifying a dedicated proof namespace. |
| `SECRET_MCP_SPIKE_SIGNING_SECRET` | A separately generated secret containing 48–256 characters. |
| `SECRET_MCP_SPIKE_CLIENTS` | A JSON array of one to four objects with `id`, `name`, and `redirectUris`. Redirects match registered HTTPS strings exactly, except the fixed Claude Code loopback callback below. |
| `SECRET_MCP_SPIKE_USERS` | A JSON array containing one to four dedicated test-account UIDs. |

Prepare the namespace through `createRunNamespace` in the shared Firestore module
only after test-project preflight and explicit approval for cloud execution.
Use the existing tools package's `validateFirestoreEnvironment` guard before
initializing Firebase Admin. Create dedicated fixture sites and `proof` pages
without overwriting existing documents. Give the test accounts fixture-site
membership. Keep both client and server Firebase configuration on `skaldbase-test`.
The runtime refuses Auth and Firestore emulator redirection.

Client registration remains explicit. The guarded fixture helper creates the two
fixed site/page pairs without overwriting existing documents. The spike registers the verification, `claude-cowork`, and `claude-code` public
clients. The spike does not support dynamic registration or Client ID Metadata
Documents. ChatGPT needs the exact callback URI from its connection-management
page before registration.

## Initial development baseline

The existing proof project serves
`https://pelilauta-mcp-proof-7f42d9.netlify.app`. Its Netlify project ID is
`b5a31e13-8160-4921-89e2-f34735ed2bd7`; the published baseline deploy is
`6ae30b7b4c7a6da3b3810162`. The manual deployment includes the current working-tree
implementation and is not a release commit. The project has no repository-linked
build configuration or automatic deployment setup. The CLI resolves
`apps/pelilauta/netlify.toml` through `--filter pelilauta`.

The existing project environment matches the local Firebase configuration, and
its server principal belongs to `skaldbase-test`. The server credential check
succeeded before deployment. Firebase Auth already authorizes the proof hostname;
preparation changed no authorized domains. The initial baseline sets
`SECRET_MCP_SPIKE_ENABLED=false`; the enabled fixture proof supersedes that setting.

Before connector enablement, the live config endpoint reported `skaldbase-test`
and version `21.2.1`. A hydrated Chromium login page exposes a Firebase SDK app
targeting that project and reports no uncaught browser errors. The login document returns HTTP 200 with `no-store`;
a malformed session returns HTTP 401 with `no-store`. MCP and both discovery
routes return HTTP 404 with `no-store`.

The first server Firestore probe returned HTTP 500. Four subsequent reads,
including three cache-bypassed probes, returned HTTP 200 with array results.
Historical error-log retrieval returned no events. The initial failure remains
unclassified and needs attention during subsequent deployed verification.
The browser smoke check waits for DOM readiness and the hydrated email input;
waiting for network idle timed out before that correction.

Always target the proof project explicitly when publishing its stable hostname:

```sh
NETLIFY_SITE_ID=b5a31e13-8160-4921-89e2-f34735ed2bd7 netlify deploy \
  --site b5a31e13-8160-4921-89e2-f34735ed2bd7 --filter pelilauta --no-build --prod
```

Build and verify the test-project artifact before this command. The `--prod` flag
publishes the dedicated test project's hostname; it does not select the production
application. The CLI rejects `--context` with `--no-build`, so the published
baseline uses the proof project's all-context environment settings. The existing
local production-project link remains unchanged. Preparation changed no production
deployment, Firebase data, or Auth account.

## Enabled fixture proof

Deploy `6ae3254dbe0079973a3cdc09` enables the spike at
`https://pelilauta-mcp-proof-7f42d9.netlify.app/mcp`. Discovery returns HTTP 200,
and anonymous MCP requests return HTTP 401 before dispatch. Anonymous direct
function-entry requests also fail. Netlify masks the signing secret, which remains
locally only in the gitignored mode-0600 environment file.

The deployed verifier completed real Firebase password sign-in, session creation,
Chromium consent, originless code exchange, MCP initialization, tool discovery,
and reads from both fixture sites without additional consent. Refresh rotates
the credential, replay returns `invalid_grant`, disconnect stops reads and renewal,
and new consent reconnects. The verifier disconnected its grants and cleared its
session after completion. Fixture document comparisons confirmed no content changes.
Authorization records remain until explicit namespace cleanup.

The browser run found two header requirements. Chromium sends `Origin: null` on
form POSTs under `no-referrer`; consent forms now use `same-origin`. Their CSP
also permits the registered callback origin because Chromium applies `form-action`
to the OAuth redirect. Token and other non-form responses retain `no-referrer`.
Consent identifies the registered callback hostname. Consent accepted the
submissions without relaxing any browser origin check.

The verifier is a controlled client, not ChatGPT or Claude. Its callback path has
no application handler; it captures the authorization redirect header and exchanges
the code itself. This proves deployed server behavior but not target-client
registration, callback completion, or refresh scheduling. Cold-start recovery,
deployed concurrent-user isolation, and Firebase credential revocation remain
unproved. Anonymous invocation-rate limits also remain unverified. The verification
neither disabled nor globally revoked the shared test accounts.

Claude's current [authentication requirements](https://claude.com/docs/connectors/building/authentication.md)
confirm `https://claude.ai/api/mcp/auth_callback` for Cowork and the hosted apps.
The registered client ID is `claude-cowork`, with no client secret. The verifier
confirmed that this registration reaches consent and includes the callback origin
in CSP. A person must still add the custom connector and complete that flow in
Claude.

OpenAI's current [authentication requirements](https://developers.openai.com/plugins/build/auth)
use a connection-specific callback when issuer identification is not advertised.
Obtain the exact registered redirect URI from the ChatGPT management page before
adding its client. The
[tools runbook](../../tools/mcp-authorization-proof/README.md#deployed-spike)
carries preparation, deployment, verification, and cleanup commands.

## Claude Code setup

The operator reports that the organization disables custom desktop connectors and
selects Claude Code as the next target. Installed Claude Code 2.1.311 supports
`--client-id` and `--callback-port`. Its current
[MCP documentation](https://code.claude.com/docs/en/mcp#use-a-fixed-oauth-callback-port)
confirms the `http://localhost:PORT/callback` form.

Deploy `6ae360a2a649d45dd5332ff5` registers the `claude-code` public client with
`http://localhost:49176/callback`. Configuration accepts that HTTP URI only for
that client. Changed ports, paths, query strings, fragments, IPv4/IPv6 loopback
aliases, and lookalike hosts remain rejected. Consent identifies the port and
warns the reader to continue only after initiating the Claude Code connection.
The MCP resource and issuer remain HTTPS.

The local CLI configuration for this repository now contains
`pelilauta-mcp-proof`, with HTTP transport, client ID `claude-code`, and callback
port 49176. It contains no client secret or bearer-token header. The initial CLI
probe reports **Needs authentication**. A live pre-authentication request with
the exact callback reaches sign-in; a changed port returns HTTP 400.

The operator subsequently reports a working Claude Code connection and supplies
its tool output. Claude Code discovers `read_fixture_page` and reads both
`mcp-proof-214-a` and `mcp-proof-214-b`. The results contain the expected titles,
Finnish and Swedish Markdown, and test-site citation URLs. The client lists no
resources, matching the tools-only surface. This is operator-observed native
client success, not an independently captured OAuth trace. Native disconnect,
reconnect, cold-start behavior, and issuer-stamp isolation still need separate
evidence.

A subsequent read-only Firestore inspection confirms native refresh. The single
`claude-code` authorization grant has 12 token records sharing the same originating
authorization-code binding. Creation timestamps span 2026-10-29 15:41:32 UTC to
16:33:08 UTC, exceeding the five-minute access-token lifetime. Eleven prior token
records are revoked, establishing 11 refresh rotations without a new consent
grant. The newest token expires at 16:38:07 UTC. Inspection changes neither
credentials nor sessions and records no token values. The one-hour consent-grant
limit still applies.

The CLI probe also emits a SEP-2352 warning about a missing issuer stamp on stored
OAuth credentials. The supplied tool output does not establish whether this
warning persists after authentication or whether credential-storage isolation
holds. The
[tools runbook](../../tools/mcp-authorization-proof/README.md#claude-code)
carries the installed command and next steps. Production and Firebase Auth
configuration remain unchanged.

## Verification

Run focused checks from the repository root:

```sh
pnpm --filter pelilauta exec vitest run test/site/server/mcp
pnpm test
node apps/pelilauta/scripts/check-mcp-spike-builds.mjs
```

Stop the development server before running the two-build adapter check. The script
uses synthetic OAuth settings and a mocked Firestore store. It suppresses cache
warming and leaves a disabled-spike artifact after verification. It establishes
request dispatch and invalid-credential rejection, not a deployed successful token
exchange. Run the original offline proof with `npm test` from
`tools/mcp-authorization-proof`. Reserve its live Firestore suite for separately
authorized execution. The shared adapter serializes native Dates to avoid
coupling callers to one Firebase Admin package's Timestamp class.

Verification on Node 22.21.1 passes all 1,181 workspace tests, 21 offline proof
tests, both enabled and disabled builds, and both generated-function origin
regressions. The offline proof suite includes fixture-plan and opt-in checks.
The application type check reported no errors and one existing deprecation hint.
Lint passed with four existing warnings. The focused spike suite contains 22 tests.
The technical-writer command did not complete within the execution timeout;
prose word-list checks passed.

The authorized Firestore rerun passed all five integration tests on Node 22.21.1
against `skaldbase-test`. Preflight checked both the service principal and app
project before initialization. The suite verified exchange and refresh identity
binding, concurrent code and refresh consumption, atomic rollback, and rejection
of stale consumed or revoked credentials. Cleanup deleted eight code records and
eleven token records, then verified that the run document and both child
collections were empty. The suite used the isolated package's Firebase Admin
14.5.0 and synthetic identities; it did not exercise Firebase Auth or the deployed
application's SDK integration.

The local handler tests cover consent validation, login return destinations,
identity-bound exchange, protocol initialization, both fixture sites, refresh,
disconnect, forged credentials, configuration rejection, and request bounds.
Mocked Firebase tests cover project mismatch, current membership, revocation,
namespace validation, account deletion, and account disablement. They do not
establish real Firebase sign-in, actual Firestore transactions, browser consent
behavior, or either target client's compatibility.

The governing scope remains #214 and `docs/site-mcp-plan.md`. The spike precedes
the production MCP spec. The existing Session contract and production routes
remain unchanged.
