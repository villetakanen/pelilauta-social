# v21 Collapsed v20's Two Colour Token Layers Into One Namespace

Status: Recorded 2026-08-05 while reviewing the CnCard release against v20

## What is wrong

v20 separates two colour layers and names them differently. Its principles book,
`app/cyan-ds/src/content/principles/color-system.mdx`, publishes a "3-Tier Token
Model":

1. **The Chroma Layer (Mechanical)** — the raw OKLCH tonal scales, declared as
   `--chroma-*` in `packages/cyan/src/tokens/chroma.css`. The book calls this layer
   **swappable for sub-site branding**, and `specs/cyan-ds/tokens/chroma/spec.md`
   approves it as a capability of its own.
2. **The Semantic Layer (Functional)** — the roles, declared as `--cn-color-*` and
   `--color-*` in `packages/cyan/src/tokens/semantic.css`. The book calls this layer
   a **stable API**.

v21 ported the second layer's declarations and rewrote their inputs into the second
layer's own namespace, leaving one namespace carrying both roles:

- `packages/design-system/styles/color-reference.css` declares the tonal scales as
  `--cn-color-primary-50: oklch(0.5 0.24 162)`. That is v20's Chroma layer, under
  v20's semantic prefix. The values are v20's, unchanged.
- `packages/design-system/styles/color-theme.css:105` declares the roles as
  `--cn-color-success`, `--cn-color-warning`, `--cn-color-error`. These are a
  line-for-line port of `semantic.css:78`, with each `var(--chroma-…)` input
  rewritten to `var(--cn-color-…)`.

So `--cn-color-warning-40` is a reference step and `--cn-color-warning` is a semantic
role, one prefix apart. The swap point v20 designed — replace the chroma file, keep
the role names — has no seam to act on.

Two records then compound the divergence:

- `packages/design-system/styles/compat/cyan-4.css:2` labels the surviving
  `--chroma-*` names "Cyan 4 chroma names", filing v20's palette layer as v18 legacy.
- The approved `specs/design-system/design-tokens/spec.md:34` places those aliases
  "outside the permanent model" and line 37 removes them "before `v21.0.0-rc.1`",
  which would delete v20's branding mechanism rather than adopt it.

`docs/ARCHITECTURE.md:24` and ADR 0002 already state the v20 model correctly. The
code and the design-tokens spec are the drift.

## What done looks like

The reference layer is `--chroma-*` and carries the tonal scales; the semantic layer
is `--cn-color-*` and `--cn-*` and carries roles that read chroma steps. Swapping the
chroma declarations rebrands a sub-site without touching a role name.
`specs/design-system/design-tokens/spec.md` names chroma as the permanent reference
layer instead of scheduling it for deletion, and `styles/compat/cyan-4.css` keeps only
the aliases that are genuinely v18's.

This is a rename across every stylesheet and consumer that reads a tonal step, so it
wants its own slice and its own spec revision. It is not a fix to make inside another
component's epic.
