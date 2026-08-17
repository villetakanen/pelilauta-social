---
status: draft
---

# Base Bar

## Blueprint

### Context

The bar the base application and the library carry. It states one thing and states it
everywhere it stands: this is Pelilauta, and this leads to its front. A reader deep inside
an application they entered from a link has that one fixed point, whatever else the chrome
around them holds.

It belongs to the base application because more than one application needs it. Whether
every application does is what the spike is still buying: an application whose pages an
author has made distinct may well carry something else.

### Architecture

`apps/pelilauta/src/base/chrome/BaseBar.astro`, reached as
`@pelilauta/base/chrome/BaseBar.astro`. It wraps `CnAppBar`, which owns everything about
how a bar is drawn, placed and behaves.

An application takes it whole and states its own actions through the slot. It states no
identity, because the identity is not the consumer's to state.

### Constraints

The identity is the product's logomark and wordmark, leading to the base application's
root. It is the same on every page of every application that takes this bar.

The bar carries the page's own name nowhere. A page names itself in the document's title
and in its first heading.

## Contract

### Definition of Done

- A reader on any page taking this bar reaches the base application's root from it.
- Two applications taking this bar show the reader the same identity.

### Regression Guardrails

- A consumer states no identity of its own: what it passes are actions.

### Scenarios

```gherkin
Given a page of the base application and a page of the library
When each renders
Then both bars carry the same logomark and wordmark
And both lead to the base application's root
```
