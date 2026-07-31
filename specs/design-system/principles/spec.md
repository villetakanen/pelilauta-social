---
status: draft
---

# Principles Books

## Intent

The principles chapter documents how to use the design system: which measurement,
colour or type step to choose in a given situation, and the reasoning behind the
system's shape.

Its readers are the developers and agents building Pelilauta's interface. They
arrive with one decision to make, and need an answer they can apply to cases the
book does not list.

## Books And Lexicons

The design site carries two kinds of page about the same subjects.

A **principles book** states a rule, the reasoning that lets a reader apply it to an
unlisted case, and the mistakes the rule prevents. It is written prose.

A **lexicon book** states what exists and what each entry resolves to, completely.

A subject appears in both. Spacing has a principles book covering rhythm and choice,
and a lexicon listing every unit and its value.

## The Chapter

Five books cover the foundations that components depend on:

- **Spatial System** — grid, layout, spacing and radii.
- **Color & Surface** — primitives, semantic roles and elevation.
- **System Mechanics** — density, box rules, and cross-cutting do's and don'ts.
- **Typography** — the type ramp, styles and pairings.
- **Iconography** — the icon grid, stroke rules and library usage.

Each is written when a delivery slice needs it. An unwritten book is absent from the
site.

## Source Of Intent

Design intent comes from v20 and from approved owner decisions. Where v20 documents
a foundation, the v21 book ports and adapts it.

v18 and Cyan 4 supply the compatibility contract for application behaviour, data and
routes, which `AGENTS.md` governs. Design intent is outside that contract: how
Cyan 4 uses a token is a fact about the code being replaced.

A claim that neither v20 nor an owner decision covers is marked in the book as this
system's own.

## Blueprint

A principles book is one MDX entry in its group's content collection, per
`specs/design-system/design-site-navigation/spec.md`.

- The page's only `h1` renders from `frontmatter.title`.
- Sections are numbered, and each answers one decision.
- A token table carries four columns: name, derivation, computed value, and role.
  The role column states what the token is for.
- Specimens are inline-styled HTML in the MDX body, showing a distinction the prose
  has stated — a touch target against the smaller control drawn inside it, for
  example.
- Do and don't pairs name the mistake a reader would plausibly make.
- The closing section links the lexicon for values, and states which parts of the
  subject the design system does not yet own.

The reference books are v20's, in `pelilauta-20-ds` at
`app/cyan-ds/src/content/principles/`.

## Non-Goals

- Principles books link the values owned by token specs rather than restating them.
- Component APIs belong to component books.
- A capability is documented after it exists.

## Contract

### Definition of Done

- The book answers at least one question of the form "which of these should I use
  here" that the lexicon leaves open.
- Each claim traces to v20, to a recorded owner decision, or is marked as this
  system's own addition.
- The page renders with a single `h1` matching its navigation label.

### Regression Guardrails

- A principles book's content is written. Content regenerable from a stylesheet
  belongs to a lexicon book.
- A new token family does not oblige a principles book. A book is written when
  readers repeatedly decide something wrongly.

## Acceptance

- A developer chooses correctly between two plausible tokens after reading the book,
  in a case the book does not name.
- Human review accepts the writing.
