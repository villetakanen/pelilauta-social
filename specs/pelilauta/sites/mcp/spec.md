---
status: live
---

# Read-only site MCP

## Blueprint

### Context

A game-site reader needs an assistant to consult and cite current wiki pages
without granting permission to change game content.

### Architecture

Netlify serves MCP at `https://pelilauta.social/mcp` using
[MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
The service supports protocol versions `2025-03-26` through `2025-11-25`.
[Connection authorization](authorization/spec.md) governs Connect, credentials,
and revocation. [Page retrieval](pages/spec.md) governs `list_pages` and `read_page`.
[Settings connection management](../../library/settings/mcp-connections/spec.md)
governs connection controls.

[Session](../../session/spec.md) governs browser authentication.
[Site](../spec.md) governs the wiki capability.

### Constraints

The endpoint uses MCP and OAuth with administratively registered public clients. Dynamic
registration, Client ID Metadata Documents, and browser-hosted clients remain
outside this capability.

The capability excludes search, revisions, attachments, notes, handouts,
clocks, threads, membership changes, and arbitrary URL retrieval.

## Contract

### Required behavior

The server authenticates requests before MCP initialization, discovery, and tool execution through public
and direct function-entry URLs, including requests for publicly readable content.
Only sign-in, OAuth metadata, and the token endpoint admit anonymous requests.
The server answers missing or invalid MCP credentials with HTTP 401 and a `WWW-Authenticate`
Bearer challenge carrying the resource metadata address.

Every authenticated person reads every site and page. Neither membership nor a
site's `hidden` flag restricts MCP reads. Tool arguments identify content, never
a person or role. Reads across sites need no additional approval.

Runtime configuration sets finite request-size, result-size, work, concurrency, and traffic limits.
Result size measures UTF-8 JSON bytes of the full MCP tool result, including text and structured data
but excluding transport framing. Before backend verification, the server applies a shared per-address
budget to all MCP and OAuth traffic, including anonymous requests and credential failures. The server
trusts only the platform-provided source address, never caller-supplied forwarding headers; it returns
HTTP 503 if the address is unavailable. The server bounds authenticated work per person across grants.
Function instances share budgets. The server rejects excessive bodies with HTTP 413 and exhausted traffic
budgets with HTTP 429 and `Retry-After`. A present Origin header must equal the issuer origin; the server
rejects foreign and `null` Origins with HTTP 403 before content access. This policy covers all MCP and
OAuth endpoints, including metadata and token exchange. The server admits originless native requests.
The server rejects body-size, traffic-budget, and Origin failures before authentication; when several
apply, any applicable error is valid. When a temporary backend failure prevents authorization
verification, the server returns HTTP 503 without content.

Authenticated responses exclude shared and offline caches using `no-store`. Logs never record credentials,
authorization codes, cursors, page bodies, or tool arguments. The server bounds operational-log
retention and excludes resource details from failure responses.

### Regression Guardrails

MCP never writes game content, memberships, profiles, or accounts. Connection and operational state
remain separate from game content. The server never executes page prose or follows it to trigger further
reads or writes. Requests never share mutable identity or selected-site state.

### Scenarios

```gherkin
Feature: Consult wiki content through MCP

  Scenario: Consult another permitted site
    Given a reader has connected an assistant and can read sites A and B
    When the assistant lists pages in A and reads a page in B
    Then both calls use the same connection without another approval
    And the read returns current Markdown and a canonical citation

  Scenario: Request a missing page
    Given an assistant has a valid connection and a site is readable
    And the requested page key does not exist in that site
    When the assistant requests that page
    Then the tool returns not_available without page metadata

  Scenario: Anonymous discovery through a direct function URL
    Given a caller passes the body-size, traffic-budget, and Origin checks without a valid MCP credential
    When the caller requests tool discovery through a direct function URL
    Then the response carries HTTP 401 with a Bearer challenge
    And contains no tools or content
```
