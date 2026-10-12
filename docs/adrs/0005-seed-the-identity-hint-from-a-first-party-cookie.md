# ADR 0005 — Seed the signed-in UID from a first-party cookie

- **Status:** accepted
- **Date:** 2026-10-12
- **Decided by:** Ville Takanen

## Context

`apps/pelilauta/src/stores/session/index.ts` persists the UID and session
state in `localStorage`. The client renders signed-in UI from the stored
values before Firebase Auth resolves the session. The session cookie
expires after five days. An expired or deleted session cookie leaves the
client displaying the previous reader until the next sign-in.

Client code cannot read the `httpOnly` session cookie. Only protected
routes verify the session cookie on the server. Public routes serve one
CDN-cached document per URL. `apps/pelilauta/netlify.toml` caches the front
page for five minutes with one day of stale-while-revalidate. HTML
carrying a UID requires `private, no-store` caching and moves every
request, including crawlers, to a function.

## Decision

`POST /api/auth/session` sets a second cookie, `uid`, that carries only
the UID, remains readable by client code, and matches the `Max-Age`,
`Path`, `Secure`, and `SameSite` attributes of the session cookie.
`DELETE /api/auth/session` deletes both cookies.

During module initialization, before any component mounts, the session store
reads `uid` from `document.cookie`. The session store sets the UID when
the cookie is present, and clears the UID when the cookie is absent. The
session store mirrors the UID into the `session-uid` `localStorage` key to
preserve existing consumers.

The client uses the `uid` cookie only for display. The client waits for the
resolved Firebase user before executing Firestore reads and authenticated
actions. The server never reads `uid`. Public HTML carries no reader
identity.

## Consequences

Client sign-in state expires with the session cookie. Logging out in one
tab clears other tabs on their next page load. Cache keys, cached HTML,
and crawler output remain unchanged. Each request grows by about 40 bytes.
The first-party, functional cookie requires no cookie consent.

The implementation accepts debt by storing the UID in both the cookie and
`localStorage`. The cookie takes precedence only during initialization.

`specs/pelilauta/session/spec.md` governs the cookie as the UID source.
The endpoint change requires operator approval. The release is a patch.
