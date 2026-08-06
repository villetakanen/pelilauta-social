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

Worked instances: `apps/design/src/content/components/cn-loader.mdx` for a component
with two variants, `cn-card.mdx` for four nested axes.

## Writing it

Copy the template to `apps/design/src/content/<group>/<slug>.mdx`. That file is the book.
The `h1` renders from `title`; do not write one.

Anything that ships in source comes from a specimen that reads it, never from prose.

Read the component's own header comment and its spec before writing. What resolves when,
what a value inherits, and where the implementation departs from v20 are stated there and
nowhere else.

## Voice

Read `/principles/typography` before writing: it is the exemplar, set by the owner.
First person plural, declarative, no contractions. Every choice carries its
rationale — comparative where alternatives were live, quantified where numbers
exist. A book documents only what ships.

## Before the pull request

Cut a paragraph a competent reader could have written without this repository.

Never: "not X, but Y". An aphorism closing a paragraph. A knowing aside.
`grep -nwE 'easy|simply|quick|just'` returns nothing.
