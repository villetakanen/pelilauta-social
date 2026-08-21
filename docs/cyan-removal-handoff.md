# Cyan Removal Handoff

What the 2026-08-21 session learned that the next one needs. The removal's scope,
guardrails and step order are in `plans/deprecate-cyan-and-qol.md`; this file holds
only the traps. Delete it when the removal has merged.

## Tests that die with Cyan

Two tests exist to hold v21 against the installed `@11thdeg/cyan-css`. When the
import leaves, they leave or shrink — do not "fix" them into keeping Cyan resolvable:

- `apps/pelilauta/test/styles/colorThemeContract.test.ts` resolves the application's
  aliases against installed Cyan declarations, and its `intentionallyUndefined`
  set (`--color-on`) documents a Cyan `cn-icon` behaviour.
- `packages/design-system/test/units.test.ts` asserts our unit tokens still compute
  Cyan's values — the parity existed only because both stylesheets load together
  (`plans/debt/token-parity-covers-units-only.md` is the wider note).

`plans/debt/form-control-register.md` records that in `apps/pelilauta` the technical
register on inputs wins on load order against Cyan's `input[type="text"]`. The
removal ends that tie; the note's third bullet is obsolete the same day.

## Traps

- `--cn-button` names a **unit** prefix (`--cn-button-size`,
  `--cn-button-physical-size`). The colour-token sweep tripped on it three times —
  `units.mdx`, `token-table.test.ts`, `links-actions-buttons.mdx:124` — and the third
  kept a whole book page from rendering for two commits. Grep for the bare string
  before trusting any sweep near it.
- A book page can fail to render its entire body while `pnpm test`, `astro check`,
  lint and the design e2e stay green
  (`docs/lessons/a-book-page-can-vanish-with-every-gate-green.md`). After the
  removal, look at rendered pages; a green suite is not that evidence.
- Cyan's legacy vocabulary includes `--cn-color-*` names. Five compat aliases became
  self-referential after the token rename and were deleted (`compat/cyan-4.css`); a
  custom property that references itself computes to invalid silently, everywhere.

## Baseline

`apps/design`'s Playwright suite passes 327/327 with zero flakes as of `21a502c2` —
the earlier intermittents were downstream of the broken book page. After the
removal, any failure there is real.
