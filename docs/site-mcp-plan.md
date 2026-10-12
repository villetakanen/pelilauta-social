# Read a game site through an AI assistant

This plan proposes a remote MCP connection for game-site authors, tentatively targeting Pelilauta 21.3.0. The first release serves existing site content through Netlify Functions and authenticates the person through Firebase Auth. The agent acts with that person's authority. The connection exposes no content mutations.

[Epic #208](https://github.com/villetakanen/pelilauta-social/issues/208) carries transient scope. This plan records the proposed design and unresolved choices; implementation requires a governing spec under `specs/pelilauta/sites/`. The release target authorizes no branch change, version bump, deployment, or production configuration change.

## Author outcome

An author connects a selected game site to ChatGPT Work or Claude Cowork and asks questions grounded in current pages. Responses cite pages retrieved through the connection. The author discusses campaign history, compares setting descriptions, finds rules, or prepares sessions without exporting the wiki.

The first useful conversation starts with “Read this campaign and explain what the pages establish about the harbour district.” The assistant retrieves relevant material and links its sources. Suggestions remain in the conversation; the connection cannot save them to Pelilauta.

Pelilauta supplies content and permissions. The connected assistant supplies inference and conversation history. This scope excludes embedded chat interfaces and model API calls billed by Pelilauta.

## Scope and authority

The user establishes the authority model: a person signs in as themselves, and the agent acts within that person's current rights. Tool arguments, prompts, and client-supplied user identifiers cannot select another principal. The Firebase service credential of the backend never constitutes the agent's authority.

The proposed initial eligibility rule admits site owners, matching the author audience. The operator must confirm this restriction before implementation; the authority model itself is settled. Under this proposal, player and other reader connections remain outside the release; owner connections gain no new content permissions.

Each connection grants reading for one selected site. Effective access is the intersection of the grant, the signed-in person's current site and page rights, and the read-only tool surface. Selecting a site limits access when the person can access other sites. Changing the selected site requires new consent.

Read-only applies to game content. Connection consent, token rotation, revocation, and operational records require separate infrastructure writes. Approve storage and retention before deployment; add no fields to existing site or page documents for connection state.

Excluded work comprises page creation, updates, deletion, revision restoration, notes, handouts, assets, clocks, discussion threads, membership changes, site settings, autonomous scheduled work, and a public connector-directory listing. The connection exposes no generic Firestore queries and fetches no arbitrary URLs.

## Existing application and remaining gaps

| Existing carrier | Consequence for implementation |
| :--- | :--- |
| [Site spec](../specs/pelilauta/sites/spec.md) | Preserve the game-site boundary and resolve its visibility requirements before exposing content. |
| [Page schema](../apps/pelilauta/src/schemas/PageSchema.ts) and [content schema](../apps/pelilauta/src/schemas/ContentEntry.ts) | Return current Markdown with identifiers and metadata. Exclude internal document fields from tool responses. |
| [Site schema](../apps/pelilauta/src/schemas/SiteSchema.ts) | Reuse the site identity and page organization; do not treat `pageRefs` as authorization evidence. |
| [Server readers](../apps/pelilauta/src/firebase/server/sites.ts) | Existing data access requires an explicit caller-aware authorization boundary for MCP. |
| [Owner guard](../apps/pelilauta/src/site/utils/requireSiteOwner.ts) and [membership helper](../apps/pelilauta/src/utils/server/auth/verifySiteAccess.ts) | Reuse established role semantics. Browser redirects do not form MCP error responses. |
| [Session spec](../specs/pelilauta/session/spec.md) and [token verifier](../apps/pelilauta/src/utils/server/auth/tokenToUid.ts) | Preserve browser login while adding delegated access for external clients. |
| [Netlify configuration](../apps/pelilauta/netlify.toml) and [Astro configuration](../apps/pelilauta/astro.config.mjs) | Verify function routing, Firebase Admin packaging, and cache headers against the existing deployment. |

The inspected page JSON routes and server readers omit caller identity. Some existing responses declare shared-cache headers. These paths do not prove every document is safe to disclose through MCP. Establish the Firebase read contract and page visibility semantics before reusing them; record discrepancies as blocking findings without publishing security-rule details.

The session files contain concurrent work at planning time. Implementation re-reads the delivered session contract rather than treating the inspected working tree as a frozen dependency.

## Connection experience

1. The author adds the Pelilauta remote MCP URL in the assistant's connection UI.
2. The assistant opens Pelilauta authorization in a browser.
3. The person signs in through Firebase Auth, or continues with a verified existing Pelilauta session. The consent page displays the current account and permits returning to sign-in if the account is wrong.
4. The person chooses an eligible site and grants reading. The consent page names the requesting client, selected site, and content disclosed to that client.
5. The assistant completes authorization and discovers the read tools.
6. Pelilauta connection controls let the person revoke the grant. Subsequent reads and refresh attempts fail, including requests with previously issued tokens.

Connecting does not authorize future clients or other sites. Account deletion, disablement, relevant Firebase session revocation, or lost site rights stop later reads. Ordinary browser logout retains the existing session contract; whether logout revokes connected assistants requires an explicit product decision. Revocation cannot remove content already returned to a third-party conversation.

## Firebase identity and MCP authorization

### Anonymous access boundary

Require authentication before MCP initialization, tool discovery, and every tool call, including reads of publicly visible site content. Reject missing, invalid, expired, or revoked credentials before dispatching MCP operations or reading site and page data. Apply the same guard to the public MCP route and the direct Netlify Function URL; alternate paths cannot bypass it.

Allow anonymous access only to the sign-in entry and protocol metadata needed to establish authorization. Authorization callbacks and token endpoints must validate the proof required by their flow before issuing credentials. Site selection and consent require a verified person. Anonymous responses disclose no account, site, page, search result, or tool catalog.

The remote clients must reach the HTTPS endpoint to receive an authentication challenge. Public network reachability grants no MCP access. Bound and rate-limit rejected requests and authorization entry points to control anonymous traffic; application authentication alone does not prevent requests from invoking a function.

### Delegated credentials

Keep Firebase Auth as the identity source. Add an OAuth authorization layer that binds a delegated grant to the verified Firebase UID. Do not instruct authors to paste Firebase ID tokens, refresh tokens, or session cookies into an assistant. Forward no Firebase credentials to an MCP client.

The recommended flow uses an established OAuth implementation or provider that authenticates through the existing Firebase identity. Select that component through a compatibility proof before committing to its storage model. A bespoke authorization server introduces token lifecycle and client-registration work beyond the MCP tool adapter.

The authorization layer covers authorization-code exchange with PKCE, discovery metadata, exact redirect validation, resource-bound tokens, and client identification supported by both target products. Validate the documented MCP authorization flow rather than assuming Firebase ID-token verification implements it. See [MCP authorization][mcp-auth] and [OpenAI authentication][openai-auth].

Bind each grant to a UID, client, selected site, read scope, creation time, expiry, and revocation state. Exact storage fields and token lifetimes remain design choices. Validate token issuer, audience, expiry, and scope on every protected request. Check the grant and current account and resource permissions before returning data. Keep credentials and account lookup failures out of tool output.

Treat Firebase authentication and delegated tokens as separate lifecycles. A revoked Firebase session must not survive through an independently refreshable MCP grant. Specify and test how Firebase revocation invalidates existing grants and token renewal. Use durable grant state where immediate revocation requires it; process memory cannot carry this guarantee.

Server Firebase credentials remain deployment secrets. The reader authorizes each operation before using Firebase Admin, whose reads bypass client security rules. Restrict deployment credentials to required operations where the selected runtime permits it. [Firebase token verification][firebase-tokens] and [Firestore access documentation][firestore-access] define the platform boundary.

## Netlify Functions architecture

Use a dedicated Node Netlify Function as the remote MCP entry point. Keep protocol dispatch separate from site authorization and content reading under the site application, following [ARCHITECTURE.md](ARCHITECTURE.md). Configure the function directory and public route only after deployment approval. The proposed external route is `/mcp`; its exact address remains uncommitted.

Use the MCP SDK for transport and protocol handling. Prove Streamable HTTP with bounded JSON responses in both clients before considering streaming. Store no user identity, selected site, or protocol session in process-global state. A request can reach a different function instance after any tool call.

The [Streamable HTTP specification][mcp-http] permits JSON responses and optional protocol sessions. Use these properties to avoid persistent connections for ordinary reads. Handle initialization, notifications, version negotiation, unsupported methods, and Origin validation through the SDK and explicit tests. Do not claim compatibility based on HTTP POST success alone.

Check runtime behavior against [Netlify function limits][netlify-limits]. Bound query work and response size below platform limits, and report a retryable error when a dependency times out. Long-running jobs and server-initiated notifications remain outside the initial transport design.

The existing Firebase module uses `import.meta.env` and Astro bundling. Verify how the standalone function receives secrets and resolves `firebase-admin`; importing that module unchanged is an unproven deployment path. Preserve Vite aliases and TypeScript mappings when sharing workspace code. Do not add package orchestration.

Return `Cache-Control: no-store` for authenticated content and authorization responses. Verify the deployed response against Netlify headers, CDN behavior, and service-worker handling. Public discovery metadata can use separate caching. No authenticated response can reuse another person's cached content.

## Proposed read tools

Tool names are provisional. Each tool derives the selected site from the verified grant, preventing prompts from widening scope with another site key.

| Tool | Proposed result |
| :--- | :--- |
| `get_site` | Return the selected site's title, description, game system, and canonical link. |
| `list_pages` | Return an authorized, paginated page index with stable keys, titles, categories, timestamps, and links. |
| `read_page` | Return current source Markdown, title, canonical link, revision marker, and an explicit continuation when needed. |
| `search_pages` | Return matching authorized page titles and excerpts with links and explicit search coverage. |

Expose tools as read-only through MCP annotations and enforce that property in the server. Unknown tool names and mutation requests perform no content writes. Discovery publishes no mutation capability, hidden administrative tool, or generic database operation.

Project responses from an allowlist. Exclude credentials, private account fields, membership lists, internal storage paths, and revision history. Images remain source references in Markdown; image retrieval and attached-file reading remain outside this release.

Use page keys for identity and existing URL rules for citations. Preserve Finnish, Swedish, and English text, including extended Latin characters. Define title and content matching, case handling, ordering, and excerpt limits in the governing spec. Distinguish complete searches with zero matches from incomplete scans.

Measure authorized listing and bounded content search against realistic site sizes. Evaluate the existing search integration only when it enforces the same access boundary before returning matches or counts. Add no vector database, external indexing copy, or embedding pipeline for this release.

Bind opaque pagination cursors to the grant, site, query, and relevant revision state. Recheck authorization when following a cursor. Paginate large pages with explicit truncation and continuation rather than dropping text. Detect content changes between chunks and require restarts when consistency breaks. Independent reads represent current data at retrieval time, not a promised site-wide snapshot.

Return source content as data. Do not promote instructions found in a wiki page into server instructions or fetch external links embedded in that page. Direct the assistant to cite retrieved pages and distinguish source statements from generated suggestions.

## Failure behavior and operational bounds

Reject invalid credentials with an authentication challenge. Deny resources outside the selected site without revealing titles, existence, counts, or snippets. Define consistent denied-versus-missing behavior in the spec. Distinguish permission failure from temporary backend failure and empty search results.

Bound input lengths, page sizes, search work, concurrency, and requests per grant. Select numeric limits from test-site measurements before release. Account for Firestore reads during search and authorization checks in the operating budget.

Log request correlation, tool name, outcome, duration, and bounded operational metrics. Exclude bearer tokens, authorization codes, page bodies, and search text from ordinary logs. Decide identifier retention and log access before enabling the connection in production. Provide an endpoint disable control that preserves normal site access.

## Evidence required for delivery

| Scenario | Required evidence |
| :--- | :--- |
| An author connects from each target assistant. | Firebase sign-in, site selection, consent, tool discovery, and a cited answer complete against a deployed test endpoint. |
| An anonymous request reaches the MCP route or direct function URL. | Initialization, tool discovery, and content reads fail before MCP dispatch or site-data access; only the authorization entry and required metadata remain accessible. |
| A request supplies another UID or site key. | The authenticated principal and selected site remain unchanged; no unrelated content or metadata returns. |
| Two grants belong to different authors or sites. | Concurrent calls and reused cursors cannot cross either boundary. |
| A grant expires or is revoked. | Reads and token renewal fail according to the authorization contract. |
| An account or required permission changes. | Later calls stop disclosing content without waiting for a new conversation. |
| A request asks to create, edit, or delete content. | No mutation tool exists, and the content collections remain unchanged. |
| A site is empty, large, or contains restricted pages. | Listing and search remain bounded and describe coverage without leaking excluded records. |
| A page changes during retrieval. | The response identifies its revision and chunk continuation detects incompatible changes. |
| Firebase or Netlify fails temporarily. | The client receives a retryable failure without content, credentials, or a false empty result. |
| The function starts cold or another instance handles the next call. | Authorization and read results remain correct without process-local session state. |

Use emulators or an approved non-production Firebase project with distinct authors, sites, permissions, and Unicode fixtures. Deploy previews must not inherit production credentials for these checks. Authentication and hosting tests can write isolated connection records; content-read tests assert that site and page records remain unchanged.

Apply [delivery.yaml](../delivery.yaml) to each implementation surface. Run focused authorization and reader unit tests, `astro check` for app changes, and the app browser regression gate for consent and disconnect UI. Exercise the deployed MCP protocol separately in both clients, including refresh and revocation. Reserve `pnpm test:uat` for delivery review under the existing release process.

## Delivery approach

First resolve the read contract, initial author eligibility, OAuth component, and grant persistence. Record required behavior in a proposed governing spec and review it through the repository's spec workflow.

Then prove the complete authentication and read journey against isolated data on Netlify. Use that evidence to settle SDK compatibility, function packaging, transport behavior, query bounds, and token lifecycle before production exposure.

Release only after both clients demonstrate the author outcome and pass the permission and revocation scenarios. Stage production configuration, endpoint naming, and authentication or persistence changes for operator approval under [AGENTS.md](../AGENTS.md). The current task delivers planning artifacts only.

## Open decisions

- Confirm whether initial connection eligibility requires the site owner role.
- Establish the effective site and page read contract, including hidden sites and page-level restrictions, without committing security rules to the repository.
- Select the OAuth implementation that preserves Firebase identity and supports both clients; settle client registration and callback validation through testing.
- Approve grant storage, token lifetimes, refresh behavior, and retention.
- Decide whether browser logout revokes agent connections as well as browser sessions.
- Confirm the external endpoint address and isolated Netlify and Firebase test environments.
- Set measured request, search, response, and cost limits for supported site sizes.
- Confirm 21.3.0 scheduling after current release work; no milestone commitment exists.

## Source references

Protocol and product documentation was checked on 2026-10-12. Recheck client requirements when selecting the SDK and authorization component.

- [ChatGPT Work custom MCP setup][openai-setup] describes connection and testing.
- [Claude custom connectors][claude-setup] describes Cowork remote connections.
- [ChatGPT WebMCP][webmcp] describes a browser-local alternative outside this scope.

[mcp-auth]: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
[mcp-http]: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
[openai-auth]: https://developers.openai.com/plugins/build/auth
[openai-setup]: https://developers.openai.com/plugins/quickstart
[claude-setup]: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
[firebase-tokens]: https://firebase.google.com/docs/auth/admin/verify-id-tokens
[firestore-access]: https://firebase.google.com/docs/firestore/security/rules-conditions
[netlify-limits]: https://docs.netlify.com/build/functions/configuration/
[webmcp]: https://learn.chatgpt.com/docs/webmcp
