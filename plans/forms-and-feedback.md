# Forms and Feedback

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

Pelilauta's form controls and application feedback run on local design-system
capabilities, so the last Cyan Lit elements on those surfaces — and the bridge
rules that kept them rendering — can leave the application.

## Success criteria

- No Pelilauta surface renders `cn-toggle-button`, `cn-snackbar`, `cn-menu` or
  `cn-accordion`, or styles a tag with Cyan's `cn-chip`.
- `apps/pelilauta/src/styles/migrations/cyan-elements.css` carries no rule for a
  migrated element.

## Guardrails

- A migration lands only after its design-system capability is approved, booked
  and checked in `apps/design`. A replacement the platform supplies needs none.
- A form control keeps its control semantics: state, label and keyboard operation
  reach assistive technology.
- Application feedback keeps one producer contract: any surface reports through
  it, and a message survives the paint it was raised on.

## Out of scope

- Media and game: lightbox, story clock, sortable list, reaction, dice.
- The editor shell and the reply dialogs.
- The chrome epic's deferred sweeps and rail accessibility findings.
- The content-grids page migrations.
- Form control debts: touch target, action row height, form register.
- `NounSelect`'s icon listbox, which is no Cyan element.

## Possible work (non-binding)

- **Token-layer debts** — the first work touching the token layers picks up the
  four debt files under `plans/debt/` that name them.

## Done

- CnToggle ships, booked; five surfaces drop `cn-toggle-button`.
- CnMenu ships, booked at `/components/cn-menu`.
- ReplyArticle renders CnMenu; its bridge rules are gone.
- `.chip` ships and is booked; the tag surfaces apply it.
- Accordion needs no capability; `details.surface` carries it.
- Toggle and chip bridge rules left with their last consumers.
- CnSnackbar ships, booked at `/components/cn-snackbar`.
- SnackbarHost and a queue in `snackUtils` replace the document event;
  `Snackbar.astro` and `BaseTail.astro` are gone.
