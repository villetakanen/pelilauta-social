---
name: design-system-book
description: Writing or changing a book on the design site.
---

# Design System Book

## Which kind

Decide before copying anything. `specs/design-system/design-site-navigation/spec.md`
decides whether the page exists at all.

| Kind | Template |
| :--- | :--- |
| Base — what ships, its values, what it applies to | `books/templates/base.mdx` |
| Principles — how to choose, and what goes wrong | `books/templates/principles.mdx` |
| Component / Extension — visual behavior and schema | `books/templates/component.mdx` |

A book states decisions already made. If one is missing, read `docs/DESIGN.md`, then
`AGENTS.md`, then ask a human. Do not settle it in prose.

## The component model

A component book declares `runtime` in frontmatter — `static`, `progressive` or
`interactive`, defined in `books/runtimes.json`. The schema requires it, so a book that
omits it fails the build. The shell renders its label as the book's subtitle.

Never restate the runtime value in prose. Say what an application must do where that has
a consequence: the state its script toggles or the directive it requires.

A component book carries these sections in order:

1. *(no heading)* — what the component does, as an instruction. The `description`
   states what it is, so write the purpose here.
2. `## When to use it` — the capability it presents with a link to that capability's
   book, the case it serves, and the case it does not serve with the alternative's book.
3. *(Optional design sections)* — visual encoding, typographic integration, layout
   behavior, or content rules where the element defines them (e.g. `## Visual encoding`,
   `## Typographic integration`).
4. `## Example` — the canonical invocation rendered, then its code, then a specimen
   per axis that varies (semantic modes, densities, themes, states).
5. `## Reference` — `### Props` (or `### Attributes`), carrying the whole API and the
   rules a consumer must follow in the row it governs.
6. `## Accessibility` — the semantics it emits and what the consumer still owes.

Delete a section with nothing that ships; never reorder the rest. Keep every heading
name unique within the page — the book tests locate headings by accessible name
without a level filter, so a repeated name creates an ambiguous locator.

A reader takes internal mechanics from the code. The page carries no internal DOM
mechanisms, CSS selector tricks, or token tables. It carries the visual language,
typographic integration, spatial behavior, and content guidelines a designer or engineer
needs to use the element correctly.

Guidance leads and reference follows, which puts the props table below the specimens
even for a component with thirteen props. That order is the owner's decision
(2026-08-06).

Show what the book covers: a live example, and the code that produces it, wherever the
page can carry one.

Read a sibling book only to see how a heading is used, never to judge how much to
write.

## Writing it

Copy the template to `apps/design/src/content/<group>/<slug>.mdx`. That file is the book.
The `h1` renders from `title`; do not write one.

Anything that ships in source comes from a specimen that reads it, never from prose.

Read the component's header comment and its spec before writing. What resolves when,
what a value inherits, and where the implementation departs from v20 are stated there and
nowhere else.

## Voice

Follow `docs/WRITING.md`. A book is written for the designers, writers, and engineers
using the design system.

A principles book argues a choice — why Lato, how it reads — and rationale belongs
there. A base or component book is direct reference: what visual signals mean, how it
integrates into layouts, what parameters it takes, and what breaks.

## Before the pull request

Run the `docs/WRITING.md` checks over the book: the deletion test on every sentence,
then the word-list greps.
