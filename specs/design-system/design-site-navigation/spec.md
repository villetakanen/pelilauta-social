---
status: approved
---

# Design Site Navigation

## Intent

The design system is documented as "books": MDX pages that each define a single
design aspect, principle, component or pattern. `apps/design` holds and serves them
to their readers, who are both humans and agents.

Design Site Navigation is a temporary navigation feature for `apps/design`, so
that a human or an agent can easily locate a book of the package.

## Behavior

Books belong to named groups. Which groups exist, their labels and their order
are the design system's decision, declared in one place —
`packages/design-system/books/groups.json` — which the site reads and does not
define. A book's group is its URL group. Within a group a book may declare its
position, otherwise books order alphabetically by title.

## Authoring

A book is one MDX entry in the content collection named for its group. Adding a
book is that one file: route files and navigation are never edited, because both
are derived.

Books are written, not generated. Prose is the body of the MDX, and a book that
needs live code — a rendered component, a value read from a stylesheet — imports a
specimen component for that part alone. A book whose content is produced by
enumerating a source becomes an inventory of what exists rather than guidance on
what to do, so enumeration belongs to the lexicon books that exist for it.

The site publishes only what exists: an empty group does not appear, and a draft
entry is neither published nor listed.

Every page carries the same navigation, complete in the served markup, marking
which book is being read. Where the viewport is too narrow to keep it visible, it
is reached through a labelled disclosure that needs no JavaScript.

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
- At a narrow viewport the navigation and its links are unreachable — by keyboard
  and assistive technology, not merely off-screen — until the disclosure opens.
- Every page's first focusable element skips the shell to the book's content.
- No page logs a console error, and the site builds with the optional managed
  icon submodule absent.

### Regression Guardrails

- A book has one `h1`, whose text is its frontmatter title. Two sources for a
  book's title must not reappear.
- No heading in the shell or navigation has the accessible name of a book, and no
  two published books share a title; existing book specs locate headings by name
  without a level filter, so either would make their locators ambiguous.
- The navigation renders once per page, and derives active state from the current
  path rather than receiving it.
- Active-state matching tolerates a trailing slash: the dev server and the built
  output differ in it.
- Book styles use no selector rooted at `main`, `body` or `footer` — the shell
  owns those, so such rules match nothing, silently.

## Acceptance

- `pnpm --filter design build` emits every published book and the index, and no
  `iconography/index.html`. A build is required: `astro check` alone does not
  surface a content-schema or MDX error.
- `pnpm --filter design test:e2e` passes, including the colour and icon book
  specs unmodified.
- Human review accepts the shell in Light and Dark and confirms keyboard-only
  traversal. This slice introduces new themed chrome, so mode review is in scope.
