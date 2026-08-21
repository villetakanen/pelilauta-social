# Deprecate Cyan CSS

## Goal

Remove `@11thdeg/cyan-css` and the `cyan-4.css` compat shim from the application, so
every style the app renders is a local design-system or app style. The removal breaks
many small surfaces at once — Cyan's atomics, element styles and utilities disappear —
so the cycle runs as a triage loop: the operator flags defects, the agent fixes each as
a design-system pattern or a pelilauta style. The triage cadence leaves slack, and the
epic spends it on the debt pile and a retro.

## Success criteria

- No file imports `@11thdeg/cyan-css`.
- `packages/design-system/styles/compat/cyan-4.css` is deleted, and nothing reads the
  legacy `--color-*` names.
- Every flagged fallout defect is fixed or filed in `plans/debt`.
- Several `plans/debt` entries are retired — fixed, or shown obsolete — beyond one or
  two.
- A retro over `docs/lessons/` has run, and its accepted changes have landed.

## Guardrails

- The installed Cyan Lit elements keep working: `@11thdeg/cyan-lit` stays imported,
  and `compat/cyan-typography.css` and the app's `styles/migrations/` files keep
  carrying what those elements read.
- A fallout fix lands as a design-system pattern or a local style, never by restoring
  a Cyan import.
- The app stays releasable: a defect that blocks a primary journey is fixed before new
  removal work starts.

## Out of scope

- Removing the `@11thdeg/cyan-lit` script import
- Replacing the remaining Cyan custom elements
- Removing `compat/cyan-typography.css`

## Possible work (non-binding)

- Migrate the last legacy `--color-*` reads (`SiteListItem.astro`, `BetaHeader.astro`,
  `NounSelect.svelte`, `overrides.css`) to `--cn-*` semantics; delete `cyan-4.css`.
- Drop the `@11thdeg/cyan-css` import from `BaseHead.astro` and `EditorHead.astro`;
  move any light-DOM rule a surviving Cyan element still needs into
  `styles/migrations/`.
- Remove `@11thdeg/cn-d20-ability-score`: the import in `BaseHead.astro` and its
  `cyan-elements.css` block. Nothing renders the element; characters are suspended
  (`docs/adrs/0003-discontinue-characters.md`), so the package is unmaintained.
- Triage loop: for each flagged defect, check v20, then fix as a design-system
  capability (spec first) or a pelilauta style; file what the cycle cannot carry in
  `plans/debt`.
- Fallout from Cyan's atomics: legacy `flex`, spacing and visibility classes lose
  their rules; replace each broken layout with local styles where it is flagged.
- Debt slices from `plans/debt`, selected per cycle by `next-task`; candidates that
  touch this epic's surfaces go first.
- Retro over `docs/lessons/` with the operator; promote accepted concepts into the
  harness.

## Done

## Open questions

- Which of the surviving Cyan elements render from `cyan-css` light-DOM rules today?
  The answer decides what `styles/migrations/` must absorb before the import goes.
- Which debt entries this cycle takes is the operator's pick at each `next-task`.
