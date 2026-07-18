# @pelilauta/design-system

Owner of the v21 design system: canonical DTCG token data, generated styles,
and (later) reusable Svelte components and package-owned page implementations.
Intent lives in [`specs/design-system/`](../../specs/design-system/spec.md);
naming is decided in
[ADR 0001](../../docs/adrs/0001-use-dtcg-paths-and-generated-css-names.md).

## Layout

- `tokens/` — canonical `*.tokens.json` source (DTCG 2025.10). The only place
  token paths, types, and values are authored.
- `scripts/` — deterministic package tooling. `scripts/lib/dtcg.mjs` defines
  the supported DTCG input scope.
- `tests/` — conformance checks run with the Node built-in test runner.

## Commands

- `pnpm check` — validate `tokens/` against the supported DTCG scope
  (non-mutating).
- `pnpm test` — run all package tests.

## Supported DTCG 2025.10 scope

Accepted input: plain token trees using `$type`, `$value`, `$description`,
`$extensions`, `$deprecated`; group-level `$type` inheritance; whole-value
`{path.to.token}` aliases; the types `color`, `dimension`, `fontFamily`,
`fontWeight`, and `number`.

Rejected as unsupported: any other `$`-property or `$type`, partial alias
interpolation, unresolved or circular aliases, and resolver documents
(themes/modes). No runtime or build dependencies; adding one requires
separate human approval.
