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
| Component — a schema | `books/templates/component.mdx` |

A book states decisions already made. If one is missing, read `docs/DESIGN.md`, then
`AGENTS.md`, then ask a human. Do not settle it in prose.

## The component model

A component book declares `runtime` in frontmatter — `static`, `progressive` or
`interactive`, defined in `books/runtimes.json`. The schema requires it, so a book that
omits it fails the build. The shell renders its label as the book's subtitle.

Never restate the value in prose. Say what an application must do, where that has a
consequence: the state its script must toggle, the directive without which nothing
works.

A component book carries these headings, in this order, and no others:

1. *(no heading)* — what it is, plus the one mechanism the invocation does not reveal
2. `## When to use it` — instructions, closing on the case it is not for and the book
   of the alternative, and on what the component does not do
3. `## Example` — the canonical invocation rendered, then its code
4. `## Variants and states` — a sentence naming the axes, then one `h3` per axis
5. `## Composition` — where it may sit and what the parent must provide
6. `## Reference` — `### Props`, then `### Tokens`
7. `## Accessibility` — what it emits, and what the consumer still owes
8. `## Not shown here` — each stated behaviour without a specimen, its reason, and
   how it was established instead

Delete a section with nothing that ships; never reorder the rest. Nest to `h4` for a
sub-case of an axis. Keep every heading name unique within the page — the book tests
locate headings by accessible name without a level filter, so a repeated name creates
an ambiguous locator.

Guidance leads and reference follows, which puts the props table below the specimens
even for a component with thirteen props. That order is the owner's decision
(2026-08-06), taken with the cost known.

Two rules keep the page honest. **No value is transcribed**: props state types, and
tokens render through `TokenTable` from the stylesheet, so a token change cannot leave
the book behind. **Nothing is asserted without a specimen** — the specimen is how a
book is verified, by the author and again by the reviewer, and it is why a book states
only what ships.

A behaviour with no specimen goes in `## Not shown here` with the reason it cannot
have one, and states how it was established: a query the page cannot emulate for one
subtree, a state needing hydration the design site does not build, a gap recorded as
debt. Name a test there only where one already exists. Do not add one to satisfy this
section: the design system is verified by looking, and a test that re-asserts browser
behaviour — that a block centres, that a border paints — costs maintenance to
duplicate what the engine guarantees. A test earns its place where our own decisions
drift silently and no specimen reveals it: which stylesheet wins a declaration,
whether a rule is in the entry point, what a parser accepts.

The template is the model. No book in the repo is. Reading a sibling to find the
register is how bulk spreads: `cn-card.mdx` is the longest book here, and every page
that has copied it has come out longer than it needed to be. Read one only to see how
a heading is used, never to judge how much to write.

## Writing it

Copy the template to `apps/design/src/content/<group>/<slug>.mdx`. That file is the book.
The `h1` renders from `title`; do not write one.

Anything that ships in source comes from a specimen that reads it, never from prose.

Read the component's own header comment and its spec before writing. What resolves when,
what a value inherits, and where the implementation departs from v20 are stated there and
nowhere else.

## Voice

Register follows the kind. A principles book argues a choice — why Lato, how it reads —
so rationale and warmth belong there. A base or component book is reference: what
ships, what you pass, what breaks. Dry.

First person plural, declarative, no contractions. A book documents only what ships.

One fact per sentence. A `because` or `so that` tail gives the reason for a decision,
and the reason belongs in the commit message; keep it only where the reason is the
behaviour. No sentence restates the one before it.

## Before the pull request

Cut a paragraph a competent reader could have written without this repository.

Never: "not X, but Y". An aphorism closing a paragraph. A knowing aside.
`grep -nwE 'easy|simply|quick|just'` returns nothing.
