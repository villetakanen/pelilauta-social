---
status: live
---

# MCP connection authorization

## Blueprint

### Context

A reader needs to authorize an assistant without sharing Firebase credentials and
retain control over continuing access independently of browser sign-out.

### Architecture

[Read-only site MCP](../spec.md) governs transport and resource permissions.
[Session](../../../session/spec.md) and [Login](../../../login/spec.md) govern
browser identity. [Settings](../../../library/settings/mcp-connections/spec.md)
governs the connection list and Revoke controls.

Grant and credential state remain durable across function instances.
Credential consumption and revocation remain atomic.

### Constraints

Registered clients require PKCE S256. Callbacks match registered URIs exactly,
including query strings. The server rejects URI fragments. Callbacks require
HTTPS, except for explicitly registered native-client loopback callbacks.
Rendered data excludes credentials and signing material. The database never
stores plaintext authorization codes, bearer tokens, or refresh tokens.

## Contract

### Required behavior

The server publishes OAuth metadata identifying the issuer, canonical MCP resource,
endpoints, `mcp:read` scope, S256, and public-client token authentication. Credentials
bind to the issuer, resource, registered client, verified Firebase person, and one grant.
Code exchange requires the bound callback and PKCE verifier; refresh cannot change
the person, client, scope, or originating approval time.

Sign-in preserves a validated authorization request. The server authorizes a new grant
only through an explicit same-origin Connect action matching the displayed account
and validated request. The server rejects changed accounts or requests and requires a
new approval presentation. The approval view displays the account, client, callback
host and port, read-only scope, and access lasting until revocation or account
invalidation. For loopback callbacks, the approval view warns against approval unless
the reader initiated the connection. Sign-in alone grants no access. Approval covers
every site, including sites created later.

The browser submits approval to the issuer origin, and the server returns OAuth
results only to the exact validated callback, preserving state. Denial returns
`access_denied` without a code. Codes and approval-form proofs expire after five
minutes. The server consumes authorization codes once.

Connections have no fixed or inactivity expiry. Access tokens expire after one
hour. Connections refresh silently while remaining valid, replacing and consuming
the refresh token atomically. Concurrent uses produce one replacement; the server
rejects consumed, missing, or revoked refresh credentials with `invalid_grant`.
An aborted transaction issues no replacement and leaves the original refresh
token usable. An uncertain commit or lost response never restores a consumed
credential and may require a new Connect action. Concurrent refresh cannot restore
a revoked grant.

On every MCP request and refresh, the server checks the grant, current account
validity, and Firebase credential revocation against the authentication that
established approval. The server persists observed disablement, deletion, or
credential revocation as grant termination. Reenabling an account or restarting
a server never revives a terminated grant. Temporary verification failure follows
the parent contract without terminating the grant.

Revoking an account's grant requires verified account identity and same-origin
approval. The server commits revocation before reporting success. Reads and
renewal starting after that commit fail, including requests with previously issued
access tokens. Already authorized reads may finish. Other grants and browser sign-in
remain unchanged. Browser logout does not revoke MCP grants. The system enforces
a finite configured retention period for consumed and terminated records; deletion
never revalidates a credential.

### Scenarios

```gherkin
Feature: Authorize continuing assistant access

  Scenario: Connect after sign-in
    Given a signed-out reader starts a registered client's valid connection flow
    When the reader signs in to Pelilauta
    Then the flow retains the authorization request and shows the Connect action
    And no MCP access exists until the reader explicitly approves
    When the reader selects Connect
    Then the client can exchange the code for credentials bound to that reader

  Scenario: Cancel connection
    Given a signed-in reader is reviewing a valid connection request
    When the reader denies approval
    Then the registered callback receives access_denied and the original state
    And the server issues no grant or credentials

  Scenario: Continue after token expiry
    Given a valid connection retains its current refresh token after a restart
    And its access token has expired
    When the client refreshes
    Then the client receives a new one-hour access token and a replacement refresh token
    And the client cannot reuse the consumed refresh token
    And the reader does not sign in or approve again
```
