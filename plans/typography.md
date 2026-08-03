# Typography

## Goal

At the end of this epic cycle, we want to have v20 level typography, and it's documentation
fully ported and operational at the v21 design system, and pelilauta apps.

So, that pelilauta app no longer needs Cyan 4 typography styles or tokens.

## Success criterion

1. A well formatted principles book exists in the ds, for how typography is expected to be used
2. A companion book, on the styling technical details - like tokens - is provided at the DS
3. Neither application — pelilauta or design — uses Cyan 4 typography in astro, svelte, or html
4. All Cyan 4 components, not yet migrated to v21, do have reasonable compat-shim in place for tokens and light-dom-styling

## Known scope

- preflight — done
- fonts — done
- the legacy `.astro` books — open; the last two go, and `docs.css` with them. A book
  cannot be written or reviewed until they do, so both book stories wait on it
- compat shim — open; unmigrated cyan-lit keeps its tokens and its light-dom rules, and
  nothing new reads cyan-css
- the scale — open, waits on the compat shim
- breakpoints in `rem` — open; the threshold the scale's container downshift is pinned
  against
- the semantics — open, waits on the scale; the three reset rules preflight left behind
  and roughly 145 call-site edits
- the principles book — open; how to choose a step, and what goes wrong
- the tokens book — open, waits on the scale; the scale itself, read from source

## Outscoped

- monospace for form values, identifiers and slugs — a later phase; shipped early for
  form controls, `plans/debt/form-control-register.md`
- card-preview treatment, and the heading outline `snippetHelpers.ts` breaks — the cards
  epic
- a containment audit gate, if a card breaks under `container-type` — the cards epic
- `AlgoliaSearchApp.svelte:204` keeps its dead `text-link` class — non-goal
- a named screen set for visual acceptance — non-goal
