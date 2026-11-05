# Native OAuth authorization proof

Use Node 22 or later. Install the workspace dependencies with
`pnpm install --frozen-lockfile` from the repository root. Run the proof package
from this directory:

```sh
npm ci --ignore-scripts
npm test
```

The package pins `@jmondi/oauth2-server` 5.0.0,
`@modelcontextprotocol/server` 2.3.1, and `firebase-admin` 14.5.0 outside the
application workspace. It starts
no listener and uses no HTTP routing framework.

## Application boundaries

`proof.mjs` configures synthetic identities against the shared core in
`apps/pelilauta/src/site/server/mcp/`. That core supplies exact input checks,
request-local jmondi repositories, a cloned in-memory commit, and the SDK bearer gate. Jmondi supplies the grant,
PKCE, signing, and verification operations. The SDK supplies bearer challenges
and resource and scope checks.

The proof accepts one resource, `https://proof.example/mcp`, and one scope,
`mcp:read`. Authorization receives a verified mock UID. Exchange and refresh
preserve the stored grant identity. The access-token claim hook derives its
audience from the persisted authorization code.

The repositories stage writes until library processing succeeds. The memory
store checks the original code or refresh token and replaces cloned maps.
`firestore-store.mjs` preloads a request-local snapshot for synchronous jmondi
lookups. The snapshot holds at most 120 records in one random run namespace.
Every consume transaction rereads the code or refresh token document, checks its
active state, then writes consumption and replacements atomically. Firestore
retries may rerun the transaction callback. Test barriers run before the
transaction; its callback performs database reads, stages writes, and applies the
shared state transition.

`proof.test.mjs` checks resource and identity binding, exact redirects, PKCE,
replay, competing exchanges, failure recovery, and bearer authentication.
The default `npm test` suite selects only offline tests, even when the live opt-in
exists in the environment. `firestore.safety.test.mjs` checks opt-in, emulator
rejection, project matching, and cleanup boundaries without network calls.

## Firestore integration proof

Install the isolated dependencies with `npm ci --ignore-scripts`. Set
`MCP_PROOF_FIRESTORE=true` and run `npm run test:firestore` from this directory.
The suite checks this flag, root `server_principal.json`, and
`apps/pelilauta/.env` before initializing Firebase Admin. Both project
IDs must equal `skaldbase-test`. The suite uses only the standard local service
account file, synthetic verified UIDs, and the fixed proof JWT secret. It never
uses Auth or signs in.

The suite writes beneath `mcpAuthorizationProof214/{random-run-id}` and deletes
only documents under that run document in its cleanup hook. Cleanup checks the
namespace marker and project, then verifies that the parent and both child
collections are empty. It reports deleted record counts. Record document IDs use
hashes; stored credentials are synthetic proof fixtures. Keep the test project
guard intact. Do not set an emulator,
project, or collection override. The Firestore suite has a 120-second test
timeout; run it only when the coordinator authorizes cloud execution.

## Deployed spike

The cloud helpers require Node 22.18 or later, the installed workspace, and a
Playwright Chromium installation. Run these commands from the repository root,
only after authorization for their cloud effects:

```sh
MCP_SPIKE_PREPARE=true node tools/mcp-authorization-proof/spike-fixtures.mjs
MCP_SPIKE_DEPLOY=true node tools/mcp-authorization-proof/deploy-spike.mjs
MCP_SPIKE_VERIFY=true node tools/mcp-authorization-proof/verify-deployed-spike.mjs
```

Preparation checks the service principal, local app, and deployed app against
`skaldbase-test`. It reuses the existing `existingUser` and `adminUser` Auth
accounts from `credentials.ts` without creating or changing accounts. One atomic
batch creates a grant namespace and two fixed site/page pairs. Every write uses a
create precondition; existing fixture paths or local state stop preparation.

Preparation stores operational state in `.local/mcp-spike-state.json` and secrets
in `.local/mcp-spike.env`, both with mode 0600. Keep both files gitignored.
Deployment targets only the pinned proof project, checks its Firebase variables
against the local app, imports the private environment, and masks the signing
secret in Netlify. It builds and publishes the test hostname without changing
the local production-project link.

Verification signs in once through Firebase password authentication, creates a
real server session, and approves consent in Chromium. The verification client
captures the authorization redirect header and exchanges its code. Its callback
path has no application handler and returns 404; this does not establish target
client callback behavior. The script checks discovery, both fixture sites,
refresh and replay, forged credentials, disconnect, and reconnect. It compares
fixture documents before and after reads, disconnects every spike grant for the
`existingUser` account in this namespace, and deletes its server session cookie.
Coordinate verification before running it while that account has an active
Claude Code connection. Credentials remain in memory and never enter the report.
Authorization records remain in the isolated namespace for inspection.

The registered `claude-cowork` public client uses the hosted Claude callback
specified in the [Claude authentication documentation](https://claude.com/docs/connectors/building/authentication.md).
Choose **Use your own OAuth client** when adding the custom connector, enter
`claude-cowork`, and leave the secret blank. The
[Claude custom-connector guide](https://claude.com/docs/connectors/custom/add-unlisted)
carries the current dialog instructions. Use the normal Firebase login for an
allowlisted test account.

### Claude Code

The operator's organization disables custom desktop connectors, so the current
connection target is Claude Code. Its installed version, 2.1.311, supports a
pre-registered public client and a fixed callback port. The
[Claude Code MCP documentation](https://code.claude.com/docs/en/mcp#use-a-fixed-oauth-callback-port)
specifies `http://localhost:PORT/callback`.

The spike registers `claude-code` with exactly
`http://localhost:49176/callback`. Other HTTP callbacks, ports, loopback aliases,
and client IDs cannot use this exception. Consent displays the port and asks the
reader to continue only after starting the connection in Claude Code.

Install the project-local configuration:

```sh
claude mcp add --scope local --transport http \
  --client-id claude-code --callback-port 49176 \
  pelilauta-mcp-proof https://pelilauta-mcp-proof-7f42d9.netlify.app/mcp
```

The command updates the operator's private Claude Code configuration for
this repository. It writes no `.mcp.json` file and adds no bearer-token header.
Start a new Claude Code session in the repository, open `/mcp`, select `pelilauta-mcp-proof`,
and choose authentication. Complete normal Firebase sign-in with an allowlisted test
account. The [Astro consent report](../../docs/reports/mcp-astro-consent-proof.md#claude-code-setup)
carries the operator-observed connection result and remaining checks.

The initial configuration probe emits a SEP-2352 issuer-stamp warning before
sign-in. Tool-read success does not establish that this warning clears or that
token-storage isolation holds. Capture those properties separately.

### ChatGPT

The [OpenAI authentication documentation](https://developers.openai.com/plugins/build/auth)
requires the exact redirect URI shown in the connection's management page.
This spike does not advertise issuer identification, so do not substitute the
stable callback for the connection-specific URI. Obtain that registered URI
before adding the ChatGPT client to the private environment. Do not share an
authorization response URL containing a code or token.

Disable and redeploy the connector before removing its fixtures. Use the existing
namespace cleanup helper only against the recorded namespace. Delete the four
site/page documents only after checking their `mcpProofNamespace` marker. Keep
the reused Auth accounts and unrelated test data intact. Never run the application
fixture reset or UAT as spike cleanup.

## Limits

Callers cannot retry a lost response after a successful commit with the consumed
code or refresh token. The per-run snapshot is proof-only and does not define a
production repository design. The isolated native-request proof does not establish Astro adapter
behavior, deployment, Firebase identity or consent, MCP client compatibility,
or a production endpoint.

The [investigation report](../../docs/reports/mcp-native-authorization-investigation.md)
records source references and verification results. The
[Astro consent report](../../docs/reports/mcp-astro-consent-proof.md) carries the
application integration and its test-project origin-check exception.
