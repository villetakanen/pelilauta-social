# Deprecate Cyan CSS

## Goal

Remove Cyan's stylesheets from the application, early, so that a person can see which
screens still lean on v18's styling. v21 now carries enough of the app that it is
usable without Cyan. What it cannot do is answer what is missing while Cyan is still
painting: there are no v19-era views to compare against, so a screen that renders
acceptably today may still need re-designing in the new language rather than
repairing. Stripping the legacy CSS turns that question into something a designer can
look at. This is a housekeeping, prep and polish epic: handling debt is its work,
not its slack. The cycle runs as a triage loop over what the removal exposes,
alongside the debt pile and a retro.

## Success criteria

- No file imports `@11thdeg/cyan-css`, and that import left before any triage.
- `packages/design-system/styles/compat/` is gone — `cyan-4.css` and
  `cyan-typography.css` both — and nothing in the design system declares or reads the
  legacy `--color-*` names.
- `apps/pelilauta/src/overrides.css` is gone, and so are the cyan files in
  `apps/pelilauta/src/styles/migrations/`.
- Every triage finding is either fixed here or filed in `plans/debt`, including a
  finding large enough to set a later epic's scope.
- Several `plans/debt` entries are retired — fixed, or shown obsolete — beyond one or
  two.
- A retro over `docs/lessons/` has run, and its accepted changes have landed.

## Guardrails

- `@11thdeg/cyan-lit` stays imported and its elements keep rendering. They may end up
  unstyled: that is a finding, not a defect.
- Cyan's CSS, the compat files and the migration files leave in one step. Only the
  app's `overrides.css` leaves surgically, on a step of its own.
- The removals gate the triage alone: a screen is judged for rework only after no
  legacy CSS paints it. Debt items and the retro do not wait on a removal, and no
  removal waits on them.
- A fix lands as a design-system pattern or a pelilauta style, never by restoring a
  Cyan import and never by moving a compat file somewhere else.
- Broken is an acceptable state, in flight and at close. A screen the triage did not
  reach stays as the removal left it.

## Out of scope

- Removing the `@11thdeg/cyan-lit` script import
- Replacing the remaining Cyan custom elements
- Re-designing the screens the removal exposes

## Possible work (non-binding)

- Drop the `@11thdeg/cyan-css` import from `BaseHead.astro` and `EditorHead.astro`,
  and delete `packages/design-system/styles/compat/` and the cyan files in
  `apps/pelilauta/src/styles/migrations/` in the same step. The legacy `--color-*`
  reads that remain — `SiteListItem.astro`, `NounSelect.svelte`,
  `SentryTestButton.svelte` — become triage findings.
- Triage loop: for each flagged screen, check v20, then fix it as a design-system
  capability (spec first) or a pelilauta style, or file it in `plans/debt`.
- Remove `@11thdeg/cn-d20-ability-score`: the import in `BaseHead.astro` and its
  `cyan-elements.css` block. Nothing renders the element; characters are suspended
  (`docs/adrs/0003-discontinue-characters.md`), so the package is unmaintained.
- Delete `overrides.css`, carrying nothing over: what it was holding up is a finding.
- Debt slices from `plans/debt`, selected per cycle by `next-task`; candidates that
  touch this epic's surfaces go first.
- Retro over `docs/lessons/` with the operator; promote accepted concepts into the
  harness.

## Done

- Debt slices, 2026-08-21: `colour-token-naming` (the `--cn-color-*` sweep,
  `4e8ffa44`), `loader-icon-announces-its-noun` (`4da98f01`),
  `v20-component-name-conformance` (ADR 0002 carried out, `15577e05`),
  `link-state-table-defeats-real-interaction` and `semantic-token-cycles`
  (`21a502c2`). `editor-bundle-split-has-no-detector` dropped as
  disproportionate (`eda444fa`); `elevation-used-as-a-state-flag` deferred to
  `plans/debt-deferred-for-rc/`.
- The annotated tag `before-cyan-removal` (`5e4f8c6d`, pushed) marks the state
  before the removal step, as its rollback point.
- Cyan's CSS left `apps/pelilauta` (`04edce3a`), and the triage that followed it,
  2026-08-22: hidden headings replaced by visible ones (`44adddb5`); the content
  area rule stated for all three container modes (`f532ce68`, `3c4aae86`); the
  Dividers capability, spec, stylesheet and book (`27179a87`); a control's click
  area at six grid units (`75d8d2df`). `button-touch-target` retired
  (`313359c5`); `prose-flow-collapses-a-replaced-child` filed.
- `docs/cyan-removal-handoff.md` carries the epic's running state and its traps.

## Open questions

- The operator decides which debt entries this cycle takes, at each `next-task`.
