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

The site publishes only what exists: an empty group does not appear, and a draft
entry is neither published nor listed.

Where the viewport is too narrow to keep the temporary navigation visible, it is
reached through a labelled disclosure that needs no JavaScript.

## Blueprint

**The shell.** One layout wraps every page: a skip link as the first focusable
element, a masthead, the navigation, the book's content in a single main landmark,
and a footer. The shell owns those landmarks and their styles.

**A book.** One MDX entry in the content collection named for its group. Adding a
book is that one file; routes and navigation derive from the collections and the
taxonomy. The entry's frontmatter carries the title, and the page's only `h1`
renders from it.

**The body.** Prose in MDX. A book needing live code — a rendered component, a value
read from a stylesheet — imports a specimen component for that part. Content
regenerable from a source belongs to a lexicon book.

## Non-Goals

- Documentation-site navigation only. No reusable navigation or tray component is
  added to the design system, and `apps/pelilauta` does not consume this.
- No search, no in-book table of contents, no theme switch.
- No new token families; the shell states explicit values where a token does not
  yet exist.
- Does not define how the repository's verification gate is wired.
- Book presentation is not specified here. Reading measure, prose rhythm and editorial
  chrome are not decided, and get no stand-in: books render plain until the design system
  owns typography and content grids. What styling exists is disposable —
  `packages/design-system/styles/docs.css` and the whole-page `books/*.astro` components
  predate this spec and contradict the Blueprint above. They are replaced
  opportunistically, one book at a time, and never gate or sequence other work.

## Contract

### Definition of Done

- At a narrow viewport the navigation and its links are unreachable — by keyboard
  and assistive technology, not merely off-screen — until the disclosure opens.
- Every page's first focusable element skips the shell to the book's content.
- No page logs a console error, and the site builds with the optional managed
  icon submodule absent.

### Regression Guardrails

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
