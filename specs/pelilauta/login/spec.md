---
status: live
---

# Login

## Blueprint

### Context

A signed-out reader signs in and continues to the requested destination.

### Architecture

`apps/pelilauta/src/layouts/Login.astro` provides the layout for normal login and
protected-document recovery. The layout carries the modal application bar with the back
action and omits the navigation rail. The layout renders the background poster in the
`app-background-poster` slot and the artist credit in the `app-footer-credits` footer
slot. Normal login verifies the session on the server and redirects readers
with verified cookies before rendering. The route mounts no client-side session manager.
[Protected-document recovery](../session/protected-recovery.md) governs the recovery
presentation. The matched guard supplies its mode and original destination; caller-supplied
headers and query flags cannot select recovery mode.

[Google sign-in](google/spec.md), [email-link sign-in](email-link/spec.md), and
[development password sign-in](development-password/spec.md) govern the sign-in
sub-features. This spec governs their shared completion and return destinations.

### Constraints

The back action navigates to the front page. Readers frequently arrive from external
sites, so browser history would navigate away from the application.

Callers specify the target path in the `redirect` query parameter; existing session
guards depend on this parameter name.

## Contract

### Required behavior

- Normal login and protected-document recovery use `Login.astro`.
- Both presentations show Firebase and email sign-in options over the background
  poster and the artist credit in the footer.
- A reader with a verified cookie who opens normal login redirects to the stated
  destination, or the front page, without rendering the login page.

#### Shared sign-in completion

Successful Firebase authentication completes the checked server-cookie exchange
before reporting sign-in success or navigating. A failed exchange reports failure
without success feedback or navigation. [Session](../session/spec.md) governs
exchange sharing, identity replacement, and logout supersession.

### Regression Guardrails

- The document carries `noindex, nofollow`.
- The page renders no navigation rail.
- Normal login reads the destination from the `redirect` query parameter. Recovery
  uses the guard-supplied original address; a `redirect` query parameter within that
  address remains destination data and does not override the original address.
- Both presentations accept only relative paths within the service; any other value
  falls back to the front page. Validate the destination before navigation, including
  values recovered from browser storage, after URL normalization,
  rejecting off-origin URLs, control characters, and recursive login or recovery
  destinations. Preserve valid pathname, query, and fragment components across
  provider sign-in, email completion, and retry. Recovery without JavaScript retains
  only the pathname and query, as defined in Protected-document recovery.

### Scenarios

```gherkin
Given a signed-out reader
When the login route renders
Then the sign-in choices stand over the background poster
And the artist credit renders in the footer
```

```gherkin
Given a reader with a verified session cookie
When the reader opens the normal login route with a stated destination
Then the route redirects to that destination without rendering
```

```gherkin
Given a reader on the login page
When the reader selects the back action
Then navigation returns to the front page
```
