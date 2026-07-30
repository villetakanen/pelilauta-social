---
status: draft
provenance:
  - "Ported architecture: app/cyan-ds Book.astro, DocsTray.astro, content/config.ts and pages/[...slug].astro in v20 at 02880fbc995b45d459ce4f264b29d5283b1d8ced."
  - "Parent: specs/design-system/components/cn-icon/spec.md owns icon behavior, including that an icon is never decorative."
  - "Parent: specs/design-system/design-tokens/spec.md owns the surface, border and focus vocabulary the shell consumes."
  - "Human decision 2026-07-30: /iconography becomes /principles/iconography, no redirect; a redirect variant was offered and declined. Approved public-URL change under the AGENTS.md ASK gate."
  - "Human decision 2026-07-30: the group taxonomy and its order are a design-system decision, declared in packages/design-system/books/groups.json."
  - "Agent-proposed, human-accepted 2026-07-30: books as content-collection entries rather than a hand-kept navigation list; the shell and navigation rendered by apps/design; published books only."
---

# Design Site Navigation

## Intent

The design site publishes a set of documentation books, and that set is growing.
We want two things from it.

Readers can move around: from any book, reach any other book, and see which one
they are currently reading — on a phone as well as a desktop.

Adding a book costs writing the book. It does not also cost copying the site's
shell into a new page and editing a navigation list by hand.

## Behavior

Books belong to named groups. Which groups exist, their labels and their order
are the design system's decision, not the site's, and are declared in one place.
A book's group is visible in its URL. Within a group a book may declare its
position; otherwise books fall back to alphabetical order by title.

The site publishes what exists: a group with no published books does not appear,
a draft entry is neither published nor listed, and a path naming no published
book is not a page.

One navigation lists every published book on every page, so reaching any book
never requires returning to the index. Exactly one location is marked current —
the book being read, or the index — and on a book page that label is the same
title as the page's heading. Group labels are not headings, and no two published
books share a title.

Where the viewport is too narrow for a persistent index, the navigation is
reached through a labelled disclosure that needs no JavaScript. While closed it
is closed: its links are not reachable by keyboard or assistive technology.

Every page's first focusable element skips the shell to the book's content.

## Non-Goals

- Documentation-site navigation only. No reusable navigation or tray component is
  added to the design system, and `apps/pelilauta` does not consume this.
- No search, no in-book table of contents, no theme switch.
- No new token families; the shell states explicit values where a token does not
  yet exist.
- Does not define how the repository's verification gate is wired.

## Contract

### Definition of Done

- Every published book and the index render in one shell carrying the navigation,
  and every listed link resolves.
- Each page marks exactly one current location; on a book page its label equals
  that page's single `h1`.
- `/tokens/color` and `/components/icon` resolve unchanged;
  `/principles/iconography` resolves; `/iconography` does not.
- A draft entry appears in neither the URLs nor the navigation, and an unknown
  path is not served.
- At a narrow viewport the navigation and its links are unreachable until the
  disclosure opens, and reachable after.
- No page logs a console error, and the site builds with the optional managed
  icon submodule absent.

### Regression Guardrails

- A book has one `h1`, whose text is its frontmatter title. Two sources for a
  book's title must not reappear.
- No heading in the shell or navigation has the accessible name of a book;
  existing book specs locate headings by name without a level filter.
- The navigation renders once per page, and derives active state from the current
  path rather than receiving it.
- Active-state matching tolerates a trailing slash: the dev server and the built
  output differ in it.
- Book styles use no selector rooted at `main`, `body` or `footer` — the shell
  owns those, so such rules match nothing, silently.

## Acceptance

- `pnpm --filter design build` emits the four pages above and no
  `iconography/index.html`. A build is required: `astro check` alone does not
  surface a content-schema or MDX error.
- `pnpm --filter design test:e2e` passes, including the colour and icon book
  specs unmodified.
- Human review accepts the shell in Light and Dark and confirms keyboard-only
  traversal. This slice introduces new themed chrome, so mode review is in scope.
