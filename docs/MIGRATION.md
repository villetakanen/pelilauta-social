# v18 Design-System Migration

Read this guide when planning or implementing the replacement of an existing
v18/Cyan consumer with a local Svelte design-system component. It is not general
design-system development context, a progress tracker, or a delivery plan.

This guide exists only for the duration of the v18 design-system migration. The
terminal migration sweep removes it after all findings are resolved or
explicitly retained.

## Migration Contract

Preserve the v18 application's behavior before replacing its Cyan Lit
dependency. The applicable capability spec owns the local component's approved
behavior; this guide owns shared migration mechanics and known baseline debt.

A migration pull request covers one bounded capability and consumer surface. It does
not perform a repository-wide legacy sweep, restore unrelated inherited tests,
or reopen approved design-system decisions.

## Inherited E2E Debt

The complete `apps/pelilauta/e2e` suite is inherited v18 debt. It is rudimentary,
ad hoc, barely functional as a complete suite, dependent on emulator and
historical setup, and not part of the repository gate. Do not cite the suite as
general acceptance evidence.

Legacy E2E selectors are consumers of Cyan element tags and can become stale as
source migrates. Inspect only tests directly related to the
changed surface so their assumptions are understood. Repair a test when the
change deliberately relies on it or the human owner asks; otherwise leave
unrelated suite restoration to dedicated work or the terminal sweep.

## Per-Slice Inventory

Inventory the target surface, not the whole repository:

1. Read the applicable capability spec and relevant v18 implementation.
2. Find declarative custom-element markup and imperative use such as
   `document.createElement('cn-...')`, `customElements`, element properties,
   methods, events, and slots.
3. Find legacy CSS rules that can match the element in this consumer context.
   Record the properties, values, specificity, and rendered outcome they
   establish; do not translate selectors mechanically.
4. Find directly related test selectors and fixtures. Their presence describes
   coupling, not trustworthy suite coverage.
5. Identify dynamic or persisted values passed into the component and preserve
   their meaning and storage shape.

The inventory is repeated for each new consumer context because a later surface
can be the first to reach a legacy rule. The global terminal scans below are not
repeated for each one.

## Styling Boundaries

A class-bearing local element does not match a legacy custom-element tag rule.
Size, margin, layout, and other tag-scoped behavior must be deliberately
re-expressed against the local component.

Svelte scoped styles also do not cross a child-component boundary. When a
consumer owns layout around the local component, target the child's public
class explicitly with `:global(...)`; do not move consumer-specific layout into
the component merely to avoid the boundary.

When an unmigrated capability owns the legacy behavior, keep the smallest
temporary bridge under `apps/pelilauta/src/styles/migrations/`. Record its
legacy source, current consumers, future owner, and removal condition. Do not
make temporary Button, Fab, layout, or typography behavior intrinsic to a
migrated component.

For Icon specifically, contexts standardize size through the public
`--cn-icon-size-*` tokens defined by its capability contract. Do not override
the component's private variables or reproduce a legacy selector without first
checking the actual v18 box-size outcome.

## Missing And Optional Inputs

Resolve dynamic inputs across every value reachable in the migrated surface.
For Icon nouns, use reviewed catalog artwork or an explicit human decision to
render the missing glyph. A v18 SVG 404 painted nothing, while the local missing
glyph is visible; those are different outcomes.

Exercise real optional and missing states when the contract depends on them.
Build-time resolvers can still eagerly resolve dynamic imports, so source syntax
alone does not prove that an optional package, asset, or registry is optional.

## Implementation And Review

Run targeted deterministic checks while implementing; the pull-request workflow
owns broad `pnpm verify` execution. Identify the changed application contexts in
the PR for the human owner's review. Agents do not administer visual acceptance
or prescribe Light/Dark review unless the change itself affects color or theming.

## Terminal Migration Sweep

Do one repository-wide sweep only when the v18/Cyan migration is believed
complete. Search source, styles, tests, scripts, and fixtures for:

- `<cn-` custom-element markup;
- `['"]cn-` string references, including imperative element creation;
- `customElements` registration and lookup;
- imports from `@11thdeg/cyan-*`;
- legacy custom-element CSS selectors;
- test selectors and fixtures that assume Cyan markup;
- retained public assets and application migration helpers;
- remaining Cyan dependencies.

Resolve each finding or explicitly retain it with its current owner and reason.
Remove obsolete compatibility assets and helpers only after no retained runtime
consumer needs them. When the sweep is complete, delete this guide.

`packages/design-system/styles/compat/cyan-4.css` goes with it. Owner decision,
2026-07-31: **the compatibility layer is removed before `v21.0.0-rc.1`.** It is
migration scaffolding rather than something v21 owes a consumer, so it carries an
expiry rather than a deprecation. Nothing new is written against it, and it is
not published in a design-system book — a table of legacy aliases beside the
roles they alias is how a shim starts reading as vocabulary.
