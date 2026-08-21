# Editing A Token Does Not Refresh The Design Site

Status: Recorded 2026-08-20, while spiking the field fill; narrowed 2026-08-21 when the
freshness gate landed

`packages/design-system/scripts/generate-tokens.mjs` writes `styles/chroma.css`,
`styles/units.css`, `styles/semantic.css` and `styles/elevation.css` from the JSON under
`tokens/`. A stale stylesheet no longer reaches a merge: `check:tokens` runs inside the
package's `test`, so `pnpm test` fails it at every cadence, and root `generate:tokens`
regenerates.

What remains is the dev loop. Neither `pnpm dev` nor any build regenerates, and the
stylesheets are served as a plain `@import` chain, so a designer editing a value sees
the old one until they run the command.

## What done looks like

Editing a token and reloading the design site shows the new value, without running a
command — a watch alongside `dev`, or generation on demand.
