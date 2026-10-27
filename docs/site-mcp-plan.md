# Read a game site through an AI assistant

[Epic #208](https://github.com/villetakanen/pelilauta-social/issues/208) proposes
reading game-site content through ChatGPT Work or Claude Cowork. The assistant retrieves
current pages and cites their addresses. Pelilauta supplies content through MCP on
Netlify Functions and identifies the person through Firebase Auth.

Run the authorization spike before writing the MCP spec. Use its findings to record
required behavior in a proposed spec under `specs/pelilauta/sites/` before implementing
the production capability. The illustrative 21.3.0
target indicates priority without committing to a release number. Include the work
in 21.2.0 if capacity permits, or defer it to 21.4.0 if critical work takes precedence.

## First task: authorization spike

[Task #214](https://github.com/villetakanen/pelilauta-social/issues/214) carries the spike.

Establish a separate Netlify development project that reproduces the local app setup
against `skaldbase-test`. Use a generated, obscure `netlify.app` hostname and authorize
that hostname in Firebase Auth for the test project. The operator approved this
development setup. The hostname provides no access control; MCP still requires
authentication.

Reuse the app build and runtime configuration. Transfer the required local development
environment values through Netlify environment settings without writing credentials
into tracked files or logs. Verify the deployed client and server project IDs before
running the proof. Keep the existing production deployment and its Firebase
configuration unchanged.

Prove Firebase sign-in, consent to read-only MCP access, and one authenticated fixture
read from both target clients at the development `/mcp` endpoint. Exercise anonymous
rejection, refresh, disconnect, Firebase revocation, and reconnect after a cold start.
Verify that a second permitted site needs no additional consent. Keep the tool surface
limited to the reads needed for this proof.

Deliver the working development environment and a report carrying the tested client
flows, authorization component, connection storage, token lifecycle, failures, and
remaining constraints. Record how to reproduce the deployment and tests without
publishing credentials. Use these results to draft the governing spec. Full page
search and production deployment remain outside the spike.

## Repository findings

### Authors and visibility

[verifySiteAccess](../apps/pelilauta/src/utils/server/auth/verifySiteAccess.ts) defines
site members as owners or players. The
[page editor](../apps/pelilauta/src/pages/sites/[siteKey]/[pageKey]/edit.astro)
admits both. These roles govern page editing; MCP connection eligibility requires
Firebase sign-in and consent to read-only MCP access.

The [site listing](../apps/pelilauta/src/pages/api/sites/index.ts) excludes hidden
sites. The [page route](../apps/pelilauta/src/pages/sites/[siteKey]/[pageKey]/index.astro)
passes `site.hidden` to `noSharing` but reads content without a caller check.
The [site spec](../specs/pelilauta/sites/spec.md) requires every page to respect site
visibility without defining the read permission matrix.

[PageSchema](../apps/pelilauta/src/schemas/PageSchema.ts) inherits optional `public`
and page `owners` fields from
[ContentEntrySchema](../apps/pelilauta/src/schemas/ContentEntry.ts). Their presence
does not establish a page read policy. The operator-provided rules snapshot linked
from [AGENTS.md](../AGENTS.md) resolves the Firebase read-contract question for this
scope. Enforce the authenticated person’s current read permissions for each requested
resource. Keep security-rule details outside tracked files.

### Content and search

[Server readers](../apps/pelilauta/src/firebase/server/sites.ts) read pages from
`sites/{siteKey}/pages/{pageKey}` and parse current Markdown. They accept no caller
identity and collapse missing documents and backend failures into `null`. MCP needs
caller authorization and distinct failure results before reusing this data access.

The existing
[page index](../apps/pelilauta/src/pages/api/sites/[siteKey]/pages.json.ts) reads the
whole subcollection and returns shared-cache headers. Build bounded MCP reads against
the requested site rather than forwarding these JSON responses.

[SiteSchema](../apps/pelilauta/src/schemas/SiteSchema.ts) carries page references,
categories, and ordering. Page references provide navigation metadata, not permission
evidence. Use `/sites/{siteKey}/{pageKey}` for citations and `markdownContent` for
source text. Omit rendered HTML and revision history.

[AlgoliaSearchApp](../apps/pelilauta/src/components/svelte/search/AlgoliaSearchApp.svelte)
queries `pelilauta-entries` without a Firebase principal.
That integration does not supply authorized MCP search. Start with bounded reads of
the requested site. Measure coverage and cost before choosing search limits.

### Identity and logout

The live [session spec](../specs/pelilauta/session/spec.md) governs browser identity.
The [session endpoint](../apps/pelilauta/src/pages/api/auth/session.ts) verifies
revocation and creates a five-day cookie. Logout deletes that cookie, clears local
reader data, and signs out of Firebase in the browser. It does not revoke credentials
across devices.

Preserve this logout contract. Give MCP grants separate disconnect controls.
Ordinary browser logout does not revoke them. Firebase account disablement, deletion,
and credential revocation must still invalidate delegated access. The OAuth design
must define how it detects those events before reads and renewal.

### Runtime and test environment

[Astro configuration](../apps/pelilauta/astro.config.mjs) already deploys server routes
through the Netlify adapter. [Netlify configuration](../apps/pelilauta/netlify.toml)
sets Node 22 and builds `apps/pelilauta`. Evaluate the MCP adapter in this runtime
before adding a standalone function. The
[Firebase server module](../apps/pelilauta/src/firebase/server/index.ts) reads secrets
through `import.meta.env`. A standalone function would need separate packaging and
configuration evidence.

Use `skaldbase-test`, the existing development/test Firebase project documented in
[Acceptance Testing](ACCEPTANCE_TESTING.md). The
[app regression suite](../apps/pelilauta/e2e/README.md) defines credentials and checks
that the service principal, app configuration, and running server target that project
before resetting fixtures. Reuse those checks for MCP fixtures. The project is shared.
Use dedicated fixture IDs and a narrow reset, and avoid concurrent resets by other
suites.

The authorization spike establishes the deployed MCP test endpoint. Verify that it
targets `skaldbase-test` before client connection tests.

## Connection and authority

1. The author adds the Pelilauta MCP URL in the assistant.
2. Pelilauta verifies an existing browser session or opens Firebase sign-in.
3. The consent page displays the account, requesting client, and read-only MCP scope.
4. The author approves MCP access for that client.
5. The assistant discovers tools and requests sites named in the conversation.
6. The author can disconnect the client through Pelilauta account controls.

Derive identity from verified Firebase authentication. Tool arguments identify the
requested site and page but cannot select a UID. Check the person’s current read
permissions on every disclosure. Consent covers the MCP connection. Reading another
site requires no new consent.

Authenticate before initialization, tool discovery, and tool execution, including
reads of public content. Guard both the public route and every direct function entry
path. Permit anonymous access to sign-in and required authorization metadata only.
Callbacks and token endpoints validate their flow proofs. Require identity before
consent. Bound anonymous traffic and authentication failures to
limit function invocation costs.

Bind each connection grant to a UID, client, MCP read scope, expiry, and revocation state.
Disconnect stops subsequent reads and renewal with already-issued tokens. Keep
connection state separate from site and page documents. Disconnection cannot erase
content already disclosed to an assistant.

## OAuth and transport

Select an established OAuth component through a connection proof in both clients.
Firebase remains the identity source. Authors do not paste Firebase credentials into
assistant configuration. Verify authorization-code exchange with PKCE, discovery,
client registration, exact redirect validation, resource-bound tokens, refresh, and
revocation against current client requirements.

Use the MCP SDK for protocol handling. Prove Streamable HTTP with bounded JSON
responses, initialization, notifications, version negotiation, Origin validation,
reconnection, and unsupported methods. Select transport and packaging from the deployed
proof. Keep request identity and requested-site state out of process globals so cold
starts and concurrent requests preserve isolation.

Keep server credentials out of client configuration, responses, and logs. Authorize
reads before invoking Firebase Admin. Return `Cache-Control: no-store` for authenticated
content and authorization responses. Verify CDN and service-worker behavior on the
deployed endpoint.

The approved production endpoint is `https://pelilauta.social/mcp` on the existing
Netlify deployment. This approval settles the endpoint address. Apply the approval
boundaries in [AGENTS.md](../AGENTS.md) to authentication, persistence, and deployment
configuration changes.

## Read tools

Each tool accepts a site key and checks resource access using the identity from the
verified MCP connection. Tool names remain provisional.

| Tool | Result |
| :--- | :--- |
| `get_site` | Return the title, description, game system, and site link. |
| `list_pages` | Return a bounded page index with keys, titles, categories, timestamps, and links. |
| `read_page` | Return current Markdown, title, page link, revision marker, and continuation when needed. |
| `search_pages` | Return matching titles and excerpts with page links and retrieval coverage. |

Project results from an allowlist that excludes account data, membership lists,
internal storage paths, and credentials. Preserve Finnish, Swedish, and English text.
Images remain Markdown references. Tools retrieve no attachments or external links.
Treat page instructions as source content. Ask the assistant to cite retrieved pages
and distinguish source statements from generated suggestions.

Define matching, ordering, excerpt lengths, and denied-versus-missing behavior in the
spec. Report complete searches with no matches separately from incomplete scans,
denied access, and temporary failures. Responses must not reveal excluded titles,
counts, existence, or snippets.

Bind cursors to the grant, site, query, and relevant revision state. Recheck permissions
on continuation and detect incompatible page changes between chunks. Each read reflects
retrieval time. The connection promises no site-wide snapshot.

Enforce read-only behavior in server dispatch and tool annotations. Exclude content
mutations, revision restoration, notes, handouts, assets, clocks, threads, membership
management, and site settings. Exclude embedded chat, Pelilauta-funded inference,
scheduled agents, WebMCP, public connector listings, vector indexing, generic database
queries, and arbitrary URL fetching.

## Verification and operation

Use dedicated authors, sites, grants, and Unicode fixtures in the established test
project. Assert that content reads leave site and page records unchanged.

| Scenario | Required result |
| :--- | :--- |
| An author connects from either target client. | Sign-in, consent, discovery, retrieval, and a cited answer complete on the deployed test endpoint. |
| An anonymous caller uses either endpoint path. | Initialization, discovery, and content reads fail before MCP dispatch or content access. |
| A caller forges a UID, requests an unauthorized resource, or reuses another grant's cursor. | No content or metadata exceeds the authenticated person’s current read permissions. |
| A conversation requests another permitted site. | Retrieval succeeds through the existing MCP connection without new consent. |
| A grant expires or is revoked, or an account becomes invalid. | Subsequent reads and renewal fail. |
| A person loses read permission for a resource. | Subsequent reads of that resource fail without revoking access to other permitted resources. |
| Calls overlap or reach different function instances. | Authorization remains isolated and reconnection succeeds. |
| A site is empty, large, or contains excluded content. | Retrieval stays bounded and reports coverage without disclosing excluded records. |
| A page changes between chunks. | Continuation detects incompatible revisions and requires a restart. |
| A dependency fails temporarily. | The response reports a retryable failure rather than an empty result. |
| A conversation requests a content mutation. | The connection performs no content write. |

Measure input, response, query-work, concurrency, and request-rate limits against
realistic test sites. Include authorization checks and search reads in the Firestore
budget. Verify bounded responses against the selected Netlify runtime limits.

Log correlation IDs, tool names, outcomes, durations, and bounded metrics. Exclude
credentials, page bodies, and query text. Set identifier retention and log access before
production exposure. Provide a connection disable control that preserves browser site
access.

Apply [delivery.yaml](../delivery.yaml) to implementation surfaces. Use focused unit
tests for authorization and retrieval, `astro check` for app changes, and the app
regression suite for consent and disconnect. Test protocol compatibility, refresh,
and revocation in both clients against the deployed endpoint. Reserve `pnpm test:uat`
for delivery review.

## Remaining investigations

- Use the authorization spike to settle connection storage, token lifetimes, refresh,
  revocation detection, and retention.
- Measure site sizes and deployment behavior to set operating limits during retrieval
  implementation.
