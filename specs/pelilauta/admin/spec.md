---
status: draft
---

# Admin

## Blueprint

### Context

Administration is where somebody keeps the service running for everybody else: the forum's
channels and topics, who holds an account, what the sites are doing, and what Pelilauta
posts to social media. A reader arrives to run one tool, changes something on other
people's behalf, and leaves.

Nobody reaches it by browsing. It is reached from the base application's rail, by the
readers who hold the tools.

### Architecture

The administration application lives under `apps/pelilauta/src/admin`, reached as
`@pelilauta/admin`. Its layout is `apps/pelilauta/src/layouts/Admin.astro`, its bar is
`chrome/AdminBar.astro` and its rail is `chrome/AdminRail.astro`. What runs in the browser
goes under `@pelilauta/admin/client`, and its guard under `@pelilauta/admin/utils`. Its
strings are the `admin` locale namespace.

Every page states its guard itself and returns what it answers with. The layout takes no
part in it, and therefore renders for a reader holding the tools alone.

There are two kinds of page. A tool of the service takes `requireAdmin`. A developer tool
takes `requireDeveloperTools`, which is that guard and this environment showing the tools
at all — `PUBLIC_SHOW_DEVELOPER_TOOLS`, which no deployed environment sets.

### Constraints

The bar carries administration's name and glyph, leading to its front page. A reader
reaches Pelilauta from the rail's footer.

A reader who holds no tools is sent to `/403`, whichever page they open.

A developer tool answers as a page that does not exist where the environment does not show
the tools, because there it is not one of the service's pages at all. User management and
the snackbar utility are developer tools; the forum's channels, the social media poster
and the sites' activity are the service's.

## Contract

### Definition of Done

- A reader holding the tools reaches every tool from any page of the application.
- A reader holding none of them reaches no page of it.

### Regression Guardrails

- No page of the application renders for a reader before the guard has answered.

### Scenarios

```gherkin
Given a reader who holds no administrative tools
When they open a page of administration
Then they are sent away before it renders
```
