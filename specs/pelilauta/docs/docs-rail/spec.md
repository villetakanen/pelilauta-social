---
status: draft
---

# Docs Rail

## Blueprint

### Context

The navigation a reader reaches from anywhere inside the documentation. Its entries are
the articles themselves, so what it holds is the content rather than a set of places
chosen for it.

### Architecture

An Astro component, `apps/pelilauta/src/docs/chrome/DocsRail.astro`, reached as
`@pelilauta/docs/chrome/DocsRail.astro`. It wraps `CnRail` and supplies its entries;
`../../../design-system/rail/spec.md` and `../../../design-system/chrome-actions/spec.md`
govern everything about how they are drawn, placed and behave.

It reads the `docs` collection on the server. Only the footer's inbox and identity are
islands.

### Constraints

Every article of the collection stands in the rail, in the order its filename gives. An
article names itself: its `shortname` where it has one, its `name` otherwise, with the
`noun` it states, or `info` where it states none.

The rail's footer carries Pelilauta, the reader's inbox and their identity.

## Contract

### Definition of Done

- A reader reads any article and reaches every other one from it.
- The rail states which article the reader is on.

### Regression Guardrails

- The rail chooses no article, and orders none of them by hand.
- The rail states no measurement, responsive rule or interaction of its own; those are the
  design system's.

### Scenarios

```gherkin
Given a reader on one article
When the rail renders
Then that article is the current entry
And every other article of the collection stands beside it
```
