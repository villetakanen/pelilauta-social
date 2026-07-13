# PBI-055: Harden Session Cookie Configuration

## Background
The current session cookie configuration defaults to the browser's implicit `SameSite` behavior. The specification `docs/specs/session-and-auth.md` explicitly requires `SameSite: Lax` to ensure predictable security behavior across all browsers.

## Requirements
1.  **Update Endpoint:** Modify `src/pages/api/auth/session.ts`.
2.  **Config Settings:** Ensure the cookie is set with:
    ```typescript
    {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      sameSite: 'Lax' // Explicit addition
    }
    ```

## Context
Refers to "1.2.2 Authentication Flow" and "SameSite Strictness" recommendations in `docs/specs/session-and-auth.md`.

## Definition of Done
- [ ] `session` cookie has `SameSite=Lax` attribute in browser dev tools.
- [ ] Login flow remains functional.
