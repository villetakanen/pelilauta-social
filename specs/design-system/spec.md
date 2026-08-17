---
status: approved
---

# Design System

## Blueprint

### Context

Every page the design system publishes does two jobs at once: it teaches a decision,
and it renders on the system it describes — so the page is where the decision is
seen, judged, and revised. This dual use is the design system's purpose. The site is
the documentation of the design and the instrument the design is evaluated with.

A page that only tells has done half its job. The combinations the applications will
compose — a heading over a list, a definition list before a subheading, a caption
against its image — appear on the page, set by the system itself, before any
application composes them.

### Architecture

`packages/design-system` is the single source. Both applications consume it;
`apps/design` consumes it first, and is the surface the design is judged on before
`apps/pelilauta` receives it.

What a book is and how one is published is
`specs/design-system/design-site-navigation/spec.md`. How the books divide into
guidance and lexicons is `specs/design-system/principles/spec.md`.

## Contract

### Definition of Done

- A reader can evaluate a published rule without leaving its page: the page renders
  the rule operating on real content.
- Nothing on the design site styles what the design system it documents already
  styles.

### Regression Guardrails

- A principles page that states a rule without rendering it has regressed to
  documentation. Prose annotates what the page shows; it does not substitute for it.
- A demonstration is set by the system's elements, classes and tokens — a
  demonstration with private styling evaluates nothing.
