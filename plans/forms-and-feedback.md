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
2. Each replacement is an approved design-system capability, booked and checked in
   `apps/design`, before its Pelilauta migration lands.
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
- **Accordion** — spec, ship and book the local disclosure; migrate
  `SiteDangerZoneSection` and `ThreadAdminActions`.
- **Chip** — spec, ship and book the local chip class; migrate the tag surfaces
  (`TagHeader`, `FeaturedTags`, `EntryTagsSection` and kin, `LabelManager`).
- **Bridge prune** — drop each migrated element's rules from
  `apps/pelilauta/src/styles/migrations/cyan-elements.css` when its last consumer
  leaves.
- **Token-layer debts** — the first work touching the token layers picks up
  `plans/debt/token-parity-covers-units-only.md`, `token-layer-collapse.md`,
  `semantic-token-cycles.md` and `tokens-are-asserted-not-generated.md`.

### Done

## Outscoped

- Media and game: lightbox, story clock, sortable list, reaction, dice.
- The editor shell and the reply dialogs.
- The chrome epic's deferred sweeps and rail accessibility findings.
- The content-grids page migrations.
- Form control debts: touch target, action row height, form register.
