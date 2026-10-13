# ADR 0005 — Resolve member identity through the session endpoint

- **Status:** accepted
- **Date:** 2026-10-12
- **Decided by:** Ville Takanen

## Context

Public content documents serve readers independently of identity. Browsers
render member presentation. Persisted UID and session-state values can show
a previous identity before session verification completes.

The session endpoint returns the UID verified from the `httpOnly` session
cookie. A separate browser-readable UID cookie duplicates that identity without
verifying the session.

## Decision

The browser obtains the server-verified UID through `GET /api/auth/session`.
[Session](../../specs/pelilauta/session/spec.md) governs reconciliation with
Firebase browser authentication and session establishment. SSR authentication
uses the existing `session` cookie. The application
introduces neither a `uid` cookie nor a cookie-derived localStorage mirror.

[Progressive Enhancement](../../specs/pelilauta/progressive-enhancement/spec.md)
governs member presentation after session establishment. Public HTML remains
independent of the requesting reader's identity.

## Consequences

Persisted display state cannot enable the member interface before reconciliation
completes.

This decision preserves session-cookie lifetime and revocation checks.
