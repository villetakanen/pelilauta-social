# T0.2 — Numbered `--cn-color-{family}-{step}` references outside the source files

Captured at tag `before/color-token-repair` (2026-08-18). Excludes
`color-reference.css` and `color-theme.css`.

## Production components

- `packages/design-system/components/CnCard.svelte:202-203` — `--cn-color-primary-95`, `--cn-color-primary-30` (poster tint gradient).
- `packages/design-system/components/CnReactionButton.svelte:210` — `--cn-color-primary-20`.
- `packages/design-system/components/CnThemeSwitch.svelte:91` — `light-dark(--cn-color-primary-40, --cn-color-primary-90)`.

## Production styles

- `packages/design-system/styles/chip.css:69` — `light-dark(primary-60, primary-50)` in a gradient mix.
- `packages/design-system/styles/chrome-actions.css:320` — `light-dark(primary-95, primary-40)`.
- `packages/design-system/styles/toggle.css:88` — `primary-70` background.
- `packages/design-system/styles/poster.css:137-144, 163-165` — primary-10…80 gradient stops; surface-90, primary-40, primary-80.

## Compatibility shim (`packages/design-system/styles/compat/cyan-4.css`)

- Lines 3-26 — the reversed aliases: `--chroma-K-S`, `--chroma-S-K`, `--chroma-primary-{10..99}`, `--chroma-surface-{10..99}`, all defined as `var(--cn-color-*)`.
- Line 91 — `--color-button-accent: var(--cn-color-primary-70)`.
- Lines 152-153 — `--cn-color-primary: var(--cn-color-primary-70)`, `--cn-color-primary-variant: var(--cn-color-primary-80)`.
- Line 172 — `--cn-color-avatar-2: var(--cn-color-primary-50)`.

## Tests and specs

- `packages/design-system/test/color-palette.test.ts:54` — special-cases `--cn-color-primary-10`.
- `packages/design-system/test/color-contrast.test.ts:66` — resolves `--cn-color-surface-20`.
- `apps/design/e2e/chip.spec.ts:58` — asserts gradient containing primary-60/primary-50.
- `apps/design/e2e/cn-loader.spec.ts:87` — reads `--cn-color-primary-60`.
- `apps/pelilauta/test/styles/colorThemeContract.test.ts:41-82` — the full numbered palette as expected OKLCH literals (primary 0-100, surface 0-100, error/warning/info/love 20/40/60/90).
- `apps/pelilauta/e2e/color-theme.spec.ts:92-95` — references surface-10/20/95/100.

## Prose

- `docs/ARCHITECTURE.md:37` — names `--cn-color-primary-50` as the reference-palette example (a T1 record regression to correct).
- `specs/design-system/components/cn-card/spec.md:95-96` — approves primary-95/primary-30 gradient.
- `specs/design-system/components/cn-reaction-button/spec.md:70` — approves primary-20 rest colour.
- `docs/color-token-regression-plan.md:36`, `docs/lessons/*` — historical/plan prose, no migration needed.
