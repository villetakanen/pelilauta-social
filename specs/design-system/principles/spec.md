---
status: draft
---

# Principles

## Intent

A reader arrives at the design system with one decision to make: which spacing
step, which colour role, which type size. A list of what exists does not answer
that, and most decisions are cases no list names.

Principles books answer it. They state a rule and the reasoning behind it, so a
developer or agent can apply it to a case the design system has not written down.

## Guidance And Lexicons

The design system says two different things about the same subject.

A principles book teaches a decision: the rule, why the system is shaped that way,
and the mistake the rule prevents.

A lexicon book enumerates: what exists, and what each entry resolves to. Spacing
has both — a principles book about rhythm and choice, and a lexicon listing every
unit.

Neither restates the other. A principles book links the lexicon for values.

## The Chapter

Five books cover the foundations components depend on:

- **Spatial System** — grid, layout, spacing and radii.
- **Color & Surface** — primitives, semantic roles and elevation.
- **System Mechanics** — density, box rules, and cross-cutting do's and don'ts.
- **Typography** — the type ramp, styles and pairings.
- **Iconography** — the icon grid, stroke rules and library usage.

## Where Design Intent Comes From

Design intent comes from v20 and from approved owner decisions. Where v20
documents a foundation, the v21 book ports and adapts it.

A claim that neither covers is marked in the book as this system's own.

The v20 books are in `pelilauta-20-ds` at `app/cyan-ds/src/content/principles/`.

Application behaviour, data and routes are governed by `AGENTS.md`, not here. How
Cyan 4 used a token is a fact about the code being replaced, not a source of
design intent.

## Blueprint

A principles book is prose. Each section answers one decision a reader is likely
to arrive with, and the book closes by linking the lexicon that holds the values
and naming the parts of the subject the design system does not yet own.

Where a distinction is easier to see than to read, the book shows it — a touch
target drawn around the smaller control inside it, for example.

Books are published as described in
`specs/design-system/design-site-navigation/spec.md`.

## Non-Goals

- Values belong to the lexicon and to the specs that own them.
- Component APIs belong to component books.
- A new token family does not oblige a principles book.

## Regression Guardrails

- A principles book is written. Content that can be regenerated from a stylesheet
  belongs to a lexicon book.

## Acceptance

- A developer reads the book and chooses correctly between two plausible options
  in a case the book does not name.
- Every claim in the book traces to v20, to a recorded owner decision, or is
  marked as this system's own.
