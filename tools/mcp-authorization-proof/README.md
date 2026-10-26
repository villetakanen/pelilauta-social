# Native OAuth authorization proof

Use Node 22 or later. Run the isolated package from this directory:

```sh
npm ci --ignore-scripts
npm test
```

The package pins `@jmondi/oauth2-server` 5.0.0,
`@modelcontextprotocol/server` 2.3.1, and `firebase-admin` 14.5.0 outside the
application workspace. It starts
no listener and uses no HTTP routing framework.

## Application boundaries

`proof.mjs` supplies exact input checks, request-local jmondi repositories,
a cloned in-memory commit, and the SDK bearer gate. Jmondi supplies the grant,
PKCE, signing, and verification operations. The SDK supplies bearer challenges
and resource and scope checks.

The proof accepts one resource, `https://proof.example/mcp`, and one scope,
`mcp:read`. Authorization receives a verified mock UID. Exchange and refresh
preserve the stored grant identity. The access-token claim hook derives its
audience from the persisted authorization code.

The repositories stage writes until library processing succeeds. The memory
store checks the original code or refresh token and replaces cloned maps.
`firestore-store.mjs` preloads a request-local snapshot for synchronous jmondi
lookups. The snapshot is limited to 120 records in one random run namespace.
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

## Limits

A lost response after a successful commit cannot be retried with the consumed
code or refresh token. The per-run snapshot is proof-only and does not define a
production repository design. This proof does not establish Astro adapter
behavior, deployment, Firebase identity or consent, MCP client compatibility,
or a production endpoint.

The [investigation report](../../docs/reports/mcp-native-authorization-investigation.md)
records source references and verification results.
