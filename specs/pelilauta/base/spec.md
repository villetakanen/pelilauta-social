---
status: approved
---

# Base

## Blueprint

### Context

Pelilauta serves people who play tabletop roleplaying games. It hosts several
applications — the sites, a reader's own material, the documentation, administration —
because a page its owner has made their own carries their identity, not the service's,
and can only do that where the service does not surround it. The base application is
what stays shared: what every reader of every application uses, and the front doors of
the others. An application added later takes its shared parts from here.

The base application therefore holds a feature only when every application needs it.
Anything an owner shapes for themselves belongs to their own application.

### Architecture

The base application lives under `apps/pelilauta/src/base`, reached as `@pelilauta/base`.
It holds what renders on the server — `chrome/BaseRail.astro` and the Astro and Svelte
files beside it. What runs in the browser goes under `@pelilauta/base/client`. A
sub-application that follows takes the same shape under its own directory.

Its layouts are the exception: every layout sits in `apps/pelilauta/src/layouts`,
whichever application owns it. `Base.astro` is the base application's. `ModalPage.astro`
beside it belongs to no application; every application takes it for a page that
interrupts a reader instead of being somewhere they are — signing in, or creating a game.

Its strings are the `base` locale namespace, `locales/<language>/base.ts`. A string
another application would need is not one of them.

A page belongs to the base application by taking `Base.astro`, and by nothing else. The
layout is the membership: a page's own file states which application it is part of, and a
reader does not infer that from the chrome the page happens to render.

### Constraints

Every page of the base application carries the same identity: the product's logomark and
wordmark, leading to the base application's root.

## Contract

### Definition of Done

- Every page taking `Base.astro` carries the same bar and the same rail.
- A reader on any of them reaches the base application's root from the bar.

### Regression Guardrails

- The layout adds no navigation of its own.
- A page taking `ModalPage.astro` carries no rail, whichever application it belongs to.

### Scenarios

```gherkin
Given any two pages of the base application
When each renders
Then both bars carry the same logomark and wordmark
And both lead to the base application's root
```

```gherkin
Given a page that interrupts a reader
When it renders
Then it carries no rail
```
