---
status: live
---

# Login

## Blueprint

### Context

A signed-out reader signs in and continues to where they were. The route serves that
moment alone: a signed-in reader never sees the page, the `redirect` parameter carries
the way back, and the page holds both sign-in flows, Firebase and email.

### Architecture

The layout is `Login.astro` in `apps/pelilauta/src/layouts`, and the login page alone
takes it. The page interrupts — a reader arrives to sign in and leave — so the layout
carries the modal application bar with the back action and no rail. It mounts the
background poster through the `app-background-poster` slot and the artist's credit
through a footer taking `app-footer-credits` — the same slot names the application's
other layouts use. No shared layout carries both the interruption and the poster, so
login takes a bespoke one. It mounts no client-side session manager: the route
verifies the session on the server, and a signed-in reader is redirected before the
page renders.

### Constraints

The back action leads to the front page: a reader often arrives from outside the
service, and returning through the session would take them back out of it.

A caller states the destination in the `redirect` query parameter. Pages guarding a
session already send readers here with it, so the name is a contract.

## Contract

### Definition of Done

- The login page takes `Login.astro`, and no other page does.
- A signed-out reader sees the sign-in choices over the background poster, and the
  credit in the footer.
- A signed-in reader opening the route lands on the stated destination, or the front
  page, without seeing the page.

### Regression Guardrails

- The document carries `noindex, nofollow`.
- No rail renders on the page.
- The route reads the destination from the `redirect` query parameter, and follows it
  only to a relative path inside the service; any other value falls back to the front
  page.

### Scenarios

```gherkin
Given a signed-out reader
When the login route renders
Then the sign-in choices stand over the background poster
And the credit renders in the footer
```

```gherkin
Given a signed-in reader
When they open the login route with a stated destination
Then they land on that destination without the page rendering
```

```gherkin
Given a reader on the login page
When they take the back action
Then they land on the front page
```
