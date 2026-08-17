# Forms and Feedback

A plan coordinates an active epic. Its entries exist to make the work and what
remains legible, not as a delivery record. It may be deleted after the epic closes;
deletion is not a closeout requirement.

## Goal

Pelilauta's form controls and application feedback run on local design-system
capabilities. The toggle, the snackbar, the menu, the accordion and the chip replace
their Cyan Lit and CSS counterparts on every surface that carries them, and the
migrated bridge rules leave with their last consumer.

## Success criterion

1. No Pelilauta surface renders `cn-toggle-button`, `cn-snackbar`, `cn-menu` or
   `cn-accordion`, or styles a tag with Cyan's `cn-chip`.
2. Where a replacement needs a design-system capability, that capability is approved,
   booked and checked in `apps/design` before its Pelilauta migration lands. A
   replacement the platform already supplies needs none.
3. A form control keeps its control semantics: its state, label and keyboard
   operation reach assistive technology.
4. Application feedback keeps one producer contract: any surface reports through it,
   and a message survives the paint it was raised on.

## Known scope

Outcomes, not steps, in two lists. The set grows as the work finds more.

### Open

- **Toggle** — spec, ship and book the local toggle; migrate the five consumers:
  `User`, `SitePlayersTool`, `CreateSiteForm`, `SiteExtraSettingsPane` and
  `SiteOptionsApp`.
- **Snackbar** — spec, ship and book local feedback; migrate `Snackbar.astro`,
  `BaseTail.astro` and the `snackUtils` producer contract behind them.
- **Menu** — spec, ship and book the local menu; migrate `ReplyArticle`'s menu.
- **Bridge prune** — drop each migrated element's rules from
  `apps/pelilauta/src/styles/migrations/cyan-elements.css` when its last consumer
  leaves.
- **Token-layer debts** — the first work touching the token layers picks up
  `plans/debt/token-parity-covers-units-only.md`, `token-layer-collapse.md`,
  `semantic-token-cycles.md` and `tokens-are-asserted-not-generated.md`.

### Done

- **Chip** — `.chip`, `.chip.promoted` and `.chip-list` ship in
  `packages/design-system/styles/chip.css`, booked at `/base/chip`. Cyan's prefix went
  with the port, so the tag surfaces apply `.chip`.
- **Accordion** — no design-system capability. `SiteDangerZoneSection` and
  `ThreadAdminActions` render `details.surface`, which is where the keyboard and the
  expanded state come from; `docs/ARCHITECTURE.md` already reads that state as a glyph
  and no surface, and `cn-accordion` carried no bridge rules to prune.

## Outscoped

- Media and game: lightbox, story clock, sortable list, reaction, dice.
- The editor shell and the reply dialogs.
- The chrome epic's deferred sweeps and rail accessibility findings.
- The content-grids page migrations.
- Form control debts: touch target, action row height, form register.
