---
status: live
---

# MCP connections in settings

## Blueprint

### Context

A reader needs to revoke continuing assistant access without signing out
of Pelilauta or disconnecting other assistants.

### Architecture

[Settings](../spec.md) governs `/settings` and section placement.
[MCP authorization](../../../sites/mcp/authorization/spec.md) governs connection
lifetimes, credential rotation, and revocation enforcement.

## Contract

### Required behavior

The section lists connection grants for the verified account independently of profile
loading, absence, or failure. Each grant displays its client, approval date, status,
and absence of scheduled expiry. The list distinguishes separate connections even when
client names and displayed dates coincide. The section explains that browser sign-out
does not revoke connections.

Each active connection presents an accessibly identified Revoke button. Retained inactive
records omit the Revoke button. The section distinguishes an empty result from loading
and failure states. A failed list request offers a retry action.

Settings derives account identity from the verified browser session. Revocation requires
a same-origin request and rejects grants from other accounts without exposing metadata.
Management responses exclude credentials and omit shared and offline caching.

The interface disables repeated submission while revoking a connection. Settings confirms
success only after commit, then marks the connection revoked. A retry for a retained,
already revoked grant belonging to the account succeeds. Failed or uncertain requests
show unconfirmed revocation and offer a retry action without claiming success.

Account changes clear prior connection data and pending presentation. Late
responses cannot populate another account's settings or undo confirmed revocation.

### Scenarios

```gherkin
Feature: Control assistant connections

  Scenario: Inspect and revoke one connection
    Given a reader has two active connections for the same assistant client
    When the reader opens settings
    Then both connections are distinguishable and each presents a Revoke button
    And each shows its approval date and no scheduled expiry
    When the reader revokes one connection
    Then settings confirms revocation only after the commit completes
    And the other connection and browser sign-in remain unchanged

  Scenario: Retry an uncertain revocation
    Given a reader selects Revoke for an active connection
    When the response is lost
    Then settings reports revocation as unconfirmed and offers a retry action
    When a retry confirms that the grant was already revoked
    Then settings marks the connection revoked

  Scenario: Manage connections without profile data
    Given a reader has a verified session but the profile cannot load
    When the reader opens settings
    Then connection listing and Revoke controls remain available
```
