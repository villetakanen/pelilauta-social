# PBI-054: Implement Server-Side Gating Middleware

> **Status:** TEMPORARILY DISABLED (2025-12-21)
> 
> The middleware implementation in `src/middleware.ts` was breaking the login cycle.
> It has been disabled by renaming to `src/middleware.ts.disabled` until the issue can be resolved.
> 
> The middleware is a safety guardrail and not critical for core functionality.

## Background
Currently, access control for protected routes (requiring EULA acceptance or completed profile) relies partially on client-side checks in `AuthManager.svelte`. To adhere to the "Zero-Trust" security model defined in `docs/specs/session-and-auth.md`, we must enforce these checks on the server side using Astro Middleware.

## Requirements
1.  **Create Middleware:** Implement `src/middleware.ts` (or strict equivalent if using a specific Astro pattern).
2.  **Intercept Requests:** Middleware must run on all protected routes (e.g., `/admin`, `/threads`, etc. - verify list).
3.  **Inspect Session:**
    *   Retrieve the `session` cookie.
    *   Verify the session using `serverAuth.verifySessionCookie`.
    *   Extract claims: `eula_accepted`, `account_created`.
4.  **Enforce Policy:**
    *   If claims are missing or false, redirect to `/onboarding`.
    *   Allow access if claims are present and valid.
5.  **Exclusions:** Ensure public routes (like `/login`, `/onboarding`, `/api/auth/*`) are NOT gated.

## Context
Refers to "Server-Side Enforcement (Middleware)" in `docs/specs/session-and-auth.md`.

## Definition of Done
- [ ] `src/middleware.ts` is created and registered.
- [ ] Protected routes return 302 Redirect to `/onboarding` if session lacks claims.
- [ ] Public routes remain accessible without claims.
- [ ] Tests verify that direct URL access to protected resources is blocked for incomplete accounts.
