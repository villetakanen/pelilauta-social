---
status: draft
provenance:
  - "Human decision 2026-07-30: the design site adopts the v20 documentation architecture — books as content-collection entries rendered through one shared layout and one catch-all route — rather than a hand-maintained navigation list. Chosen over a TypeScript navigation manifest so that adding a book costs one file, because the following slices add several (units and grid, elevation, typography, compound styles)."
  - "Human decision 2026-07-30: the shell and the navigation are owned by apps/design, not by packages/design-system. This navigation encodes the documentation site's information architecture, which is not a product capability. Mirrors the v20 constraint recorded in specs/cyan-ds/components/docs-tray/spec.md at 02880fbc, which forbade moving DocsTray into the design-system package."
  - "Human decision 2026-07-30: /iconography moves to /principles/iconography with no redirect, so that a book's URL and its navigation group agree. The other two book URLs are unchanged. This is an approved public-URL change under the AGENTS.md ASK gate; a redirect variant was offered and declined."
  - "Human decision 2026-07-30: the navigation lists published books only. Groups with no entries do not render, and unbuilt future books are not advertised as placeholders."
  - "Human decision 2026-07-30: wiring apps/design's Playwright suite into the repository verify gate is deliberately out of scope for this slice, and remains a known follow-up."
  - "Ported architecture: v20 at immutable commit 02880fbc995b45d459ce4f264b29d5283b1d8ced — app/cyan-ds/src/layouts/Book.astro (shared book layout), app/cyan-ds/src/components/DocsTray.astro (collection-derived groups, self-derived active state, empty groups omitted, the (order ?? 9999) then title sort comparator), app/cyan-ds/src/content/config.ts (one shared book schema), app/cyan-ds/src/pages/[...slug].astro (single catch-all)."
  - "Deliberate divergence from that port, forced by this repository's books: v20's Book.astro rendered the h1 and description from frontmatter. Here each book's hero carries build-time computed data (declaration counts parsed from the production CSS via ?raw, live icon-vocabulary counts) that only the book component can produce, and Astro slots do not propagate upward from a rendered <Content /> to the wrapping layout. The hero therefore stays in the book component and the title reaches it as a prop."
  - "Astro Content Layer API, verified against the installed astro 5.15.4: src/content.config.ts with the glob() loader and entry.id. v20's legacy defineCollection({ type: 'content' }) and entry.slug are not used. Entry ids are the path minus extension, slugified per segment (node_modules/astro/dist/content/loaders/glob.js, generateIdDefault)."
  - "Icon behavior anchored to specs/design-system/components/cn-icon/spec.md, which decided that an icon is never decorative and always announces its noun. The navigation is therefore typographic; the icon-only mobile disclosure wraps its icon in aria-hidden so the control is announced once."
  - "Token vocabulary anchored to specs/design-system/design-tokens/spec.md. Observed while implementing: --cn-shadow-elevation-1..4, --cn-shadow-button-hover and --cn-reply-dock-shadow in packages/design-system/styles/color-theme.css are all derived from calc(var(--cn-grid) * n), and --cn-grid is defined only by @11thdeg/cyan-css (dist/tokens/units.css, 0.5rem), which apps/design does not load. The shell therefore uses explicit shadow values; the grid token is the following slice's work."
---

# Design Site Navigation

## Intent

The design system's books are the artifact that communicates approved visual
intent to the people building Pelilauta. Before this capability the site
published each book as an isolated document: the index was the only catalog, and
a reader who had reached a book could only go back to the index or leave. Books
could not be discovered from each other, and nothing told a reader where they
were.

This capability makes the site navigable. From anywhere on it, a reader can see
the full set of published books, understand which one they are reading, and move
to any other, on a phone as well as a desktop.

It also makes publishing a book cheap. Each book used to be a complete HTML
document that restated the site's shell and editorial styling, so adding one
meant copying all of it and keeping every copy in step. A book is now its
content plus a short entry declaring its title, description and place in the
taxonomy; the site owns everything around it.

## Information Architecture

Books are organised into named groups. A group is a division of the design
system's subject matter, and a book's group is visible in its URL: a book in the
`tokens` group lives under `/tokens/`.

Group order is an editorial decision of the site, declared in one place so the
navigation and any index of the books cannot disagree. Within a group, a book
declares its own position; books that do not declare one, or that declare the
same one, fall back to alphabetical order by title so the listing is never
arbitrary.

The site publishes the groups it has books for. A group whose books are all
unpublished does not appear, and books that do not exist yet are not advertised.

An entry may be marked as a draft, in which case the site neither publishes it
at a URL nor lists it in the navigation.

A path that names no published book is not a page. The catch-all that serves the
books does not absorb unknown paths into a fallback.

## Navigation Behavior

The navigation lists every published book, grouped and ordered, on every page of
the site including the index. It is the same navigation everywhere: reaching any
book from any other never requires returning to the index.

Exactly one location is marked as current: the book being read, or the index
when the reader is on it. The current book's entry in the navigation reads as the
same book the page's own heading names.

Group labels organise the list, and are not headings, so a book title remains
the page's only structural landmark of that rank.

Two published books do not share a title. A reader choosing between identically
named entries could not tell where either leads.

On a viewport too narrow for a persistent index, the navigation is reached
through a labelled disclosure in the site header. While it is closed, it is
genuinely closed: its links are not reachable by keyboard or assistive
technology. Opening and closing it requires no JavaScript.

Every page offers a keyboard route past the shell to the book's content as its
first focusable element.

## Compatibility

The design site is not part of the v18 drop-in compatibility contract; its URLs
are v21's own. Within that, `/tokens/color` and `/components/icon` are unchanged
by this capability, and `/iconography` becomes `/principles/iconography` by
approved decision.

## Non-Goals

- This is documentation-site navigation, not a reusable product navigation or
  tray component. It is not published for `apps/pelilauta` to consume, and no
  navigation primitive is added to the design system.
- No search, filtering, or table of contents within a book.
- No theme switch. Light and Dark continue to follow the browser or operating
  system.
- No navigation for the Pelilauta application itself.
- No new token families. The shell consumes the existing surface, border and
  focus tokens, and states explicit values where a token does not yet exist.
- This capability does not define how the repository's verification gate is
  wired, or which suites it runs.

## Contract

### Definition of Done

- Every published book and the index render inside one shared shell that carries
  the navigation.
- The navigation lists every published book from every page, grouped and in
  order, and each listed link resolves to a published page.
- Each page marks exactly one current location, and on a book page the marked
  label equals that page's single `h1`.
- `/tokens/color` and `/components/icon` resolve at their existing URLs;
  `/principles/iconography` resolves; `/iconography` no longer does.
- A draft entry is absent from both the published URLs and the navigation.
- A path naming no published book is not served as a page.
- Group order and within-group order are declared once, and the navigation and
  the index present books in the same order.
- At a narrow viewport the navigation is not visible and its links are not
  focusable until the disclosure is opened, after which they are both.
- The first focusable element of every page targets that page's content.
- No page logs a console error.
- The site builds with the optional managed icon submodule absent, with an empty
  managed vocabulary rather than a failure.

### Regression Guardrails

- A book page has exactly one `h1`, and its text is the book's frontmatter
  title. Two sources for a book's title must not reappear.
- Neither the navigation nor the site header contains a heading whose accessible
  name equals a book title; existing book specs locate their page heading by
  accessible name without a level filter.
- The navigation is rendered once per page. A second copy for another viewport
  would duplicate every link and every current-location marker.
- Active state is derived inside the navigation from the current path, never
  passed to it as a property.
- Current-location matching tolerates a trailing slash, because the development
  server and the built static output differ in it.
- Book components hold no styling that depends on being the page's root
  document; the shell owns `main`, `body` and the footer. A selector rooted at
  one of those inside a book's scoped styles matches nothing, silently.
- No two published books share a title, so a listing entry always identifies one
  destination.

## Review

Adversarial review 2026-07-30, against the five axes in the spec skill. Findings
raised and resolved in this draft: the ordering rule was unstated and two
implementers could have differed (now declared); "a route between any two books
is one interaction" contradicted the narrow-viewport disclosure, which needs the
disclosure opened first (claim restated as not requiring a return to the index);
"without competing for prominence" was untestable (removed, keeping the checkable
"not headings"); unknown-path behavior was missing (now stated); duplicate book
titles were unaddressed although the navigation and the existing book specs both
locate by accessible name (now a stated behavior and a guardrail); and the
verification-gate exclusion described slice state rather than a durable Non-Goal
(reworded).

Limitation the human owner should weigh before approving: this pass was performed
in the same session that authored the spec, which is the weaker form the practice
allows. An independent critic has not read it.

## Acceptance

- `pnpm --filter design build` emits `index.html`, `tokens/color/index.html`,
  `principles/iconography/index.html` and `components/icon/index.html`, and no
  `iconography/index.html`. A build is required for these: `astro check` alone
  does not surface a content-schema or MDX error.
- `pnpm --filter design test:e2e` passes, including the pre-existing colour and
  icon book specs unmodified, and a navigation spec covering reachability from
  all four pages, single current location matching the heading, the skip link,
  and the narrow-viewport disclosure.
- Building with `packages/myrrys-proprietary` absent succeeds and reports zero
  managed nouns.
- Human review accepts the shell's appearance in Light and Dark, and confirms
  keyboard-only traversal of the navigation. This slice introduces new themed
  chrome, so mode review is in scope.
