# The Token Generator Is Reachable From One Directory And Checked Nowhere

Status: Recorded 2026-08-20, while spiking the field fill

`packages/design-system/scripts/generate-tokens.mjs` writes `styles/chroma.css`,
`styles/units.css`, `styles/semantic.css` and `styles/elevation.css` from the JSON under
`tokens/`. It is exposed as `generate:tokens` and `check:tokens` in
`packages/design-system/package.json:13-14`, and nowhere else.

`pnpm generate:tokens` therefore works from `packages/design-system` and fails from the
repository root, which is where the work happens. The generator's own failure message
(`generate-tokens.mjs:264,366`) prints that command, so following the instruction the
tool gives leads to an error.

Nothing runs the check. `check:icons` guards a stale icon registry in both applications'
builds (`apps/design/package.json:11`, `apps/pelilauta/package.json:13`); `check:tokens`
has no caller in any script, workflow or test. A colour role edited in the JSON without a
regeneration ships the previous value, and the build agrees.

Neither `pnpm dev` nor any build regenerates. The stylesheets are served as a plain
`@import` chain, so a designer editing a value sees the old one until they know the
command and the directory it works in.

## What done looks like

Editing a token and reloading the design site shows the new value, without a command
learned by reading a script. Whatever form that takes — a root script, a watch alongside
`dev`, generation on demand — a stale generated stylesheet cannot reach a build: the same
guard `check:icons` already gives the icon registry.
