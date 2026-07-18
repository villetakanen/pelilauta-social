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
  the supported DTCG input scope; `scripts/lib/projection.mjs` defines the
  deterministic `--cn-*` CSS projection.
- `styles/tokens.css` — generated, committed web representation of the
  canonical tokens. Never edited by hand; regenerate with `pnpm generate`.
- `tests/` — conformance and projection checks run with the Node built-in
  test runner.

## Commands

- `pnpm check` — validate `tokens/` against the supported DTCG scope and
  fail when `styles/tokens.css` is stale (non-mutating).
- `pnpm generate` — regenerate `styles/tokens.css` from `tokens/`.
- `pnpm test` — run all package tests.

## Supported DTCG 2025.10 scope

Accepted input: plain token trees using `$type`, `$value`, `$description`,
`$extensions`, `$deprecated`; group-level `$type` inheritance; whole-value
`{path.to.token}` aliases; the types `color`, `dimension`, `fontFamily`,
`fontWeight`, and `number`. Canonical path segments use lowercase letters,
digits, and single hyphens so their CSS projection needs no escaping.

Rejected as unsupported: any other `$`-property or `$type`, partial alias
interpolation, unresolved or circular aliases, and resolver documents
(themes/modes). No runtime or build dependencies; adding one requires
separate human approval.

## CSS projection

Canonical paths project one-to-one to the `--cn-*` namespace per
[ADR 0001](../../docs/adrs/0001-use-dtcg-paths-and-generated-css-names.md):
`color.primary.70` becomes `--cn-color-primary-70`. Whole-value aliases
become `var(--cn-*)` references and must resolve to a target of the same
`$type`. Colors serialize from the `oklch` and `srgb` color spaces; other
spaces, aliases embedded in composite values, and two paths projecting to
the same CSS name are explicit errors, and generation refuses to write
output when any error exists.
