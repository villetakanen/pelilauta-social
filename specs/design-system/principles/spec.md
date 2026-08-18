---
status: live
---

# Principles

## Blueprint

### Context

The principles collection teaches the visual and spatial decisions that components
share. Each book defines how to choose within one foundation, explains the reason
for the rule, and renders the result so the decision can be evaluated where it is
documented.

### Architecture

The design site separates three documentation responsibilities:

- A **principles book** teaches a design rule and its application.
- A **lexicon book** enumerates source-defined names and values.
- A **component book** documents a component's public schema and composition.

A subject may require both principles and a lexicon. The principles book links the
lexicon where values are needed; it does not reproduce them.

Five principles books cover the foundations consumed by components:

- **Spatial System** covers grid, spacing, layout relationships, and radii.
- **Colour & Surface** covers reference colour, semantic roles, themes, and
  elevation.
- **System Mechanics** covers density, box rules, and cross-cutting composition.
- **Typography** covers typefaces, scale, rhythm, and responsive type behavior.
- **Iconography** covers the icon grid, drawing rules, and library selection.

Books are published according to
`specs/design-system/design-site-navigation/spec.md`.

### Constraints

A principles book states approved decisions that the design system ships. A new
token family or implementation detail does not require a principles book unless it
introduces a design choice that readers must apply.

Each section addresses one decision. Prose states the rule, its rationale, and the
implementation mistake it prevents. Links to lexicons and adjacent books appear at
the decision that requires them.

The book renders its subject through the design system's shipped elements,
classes, tokens, and components. Private specimen styling does not substitute for
the rule being evaluated.

Content generated from source belongs in a lexicon. Component props, slots, and
composition regions belong in the component book.

## Contract

### Definition of Done

- Every shipped foundation has a principles book that renders the decisions it
  teaches.
- Each live specimen uses the shipped design-system source it evaluates.
- Human review accepts the rendered decision and the guidance used to reach it.

### Regression Guardrails

- A principles book does not copy a source-defined value or inventory that a lexicon
  can generate.
- A principles book does not document a component API or use private styling to
  simulate shipped behavior.
- Removing a rationale must not leave two plausible choices with no rule for
  selecting between them.

### Scenarios

```gherkin
Given a reader choosing between two plausible treatments for an unlisted case
When they apply the relevant principles book
Then the published rule leads to one treatment
```

```gherkin
Given documentation that can be generated from a stylesheet or component schema
When the design site publishes it
Then it appears in the governing lexicon or component book rather than principles prose
```
