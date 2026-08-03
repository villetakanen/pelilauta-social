# Typography

## Goal

The design system owns typography, so both applications render every typographic step
from `packages/design-system` and cyan-css can be removed.

## Success criterion

No typography token or rule reaches either application from `@11thdeg/cyan-css`.

## Known scope

- preflight — done
- fonts — done
- compat shim — open; nothing cyan-css or cyan-lit reads goes undefined
- the scale — open, waits on the compat shim
- the semantics — open, waits on the scale and preflight; carries the three reset rules
  preflight left behind and roughly 145 call-site edits
- breakpoints in `rem` — open; publishes the small-screen breakpoint the scale's
  container threshold is pinned against

## Outscoped

- monospace for form values, identifiers and slugs — a later phase; shipped early for
  form controls, `plans/debt/form-control-register.md`
- card-preview treatment, and the heading outline `snippetHelpers.ts` breaks — the cards
  epic
- a containment audit gate, if a card breaks under `container-type` — the cards epic
- `AlgoliaSearchApp.svelte:204` keeps its dead `text-link` class — non-goal
- a named screen set for visual acceptance — non-goal
