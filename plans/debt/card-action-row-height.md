# A card's action row is seven grid units, not six

`CnCard.svelte:317-321` gives `.actions` `block-size: calc(7 * var(--cn-grid))` — 56px, the
button row Cyan 4 and v20 built from a 38px pill and 9px margins.

The click area a control needs is six grid units, 48px
(`plans/debt/button-touch-target.md`). A card's action row states the old number, so once
the target lands the row is a unit taller than the thing it exists to hold, and card
heights across every listing carry the difference.

## Remaining change

Take the action row to `calc(6 * var(--cn-grid))` with the button target, not before: a
48px row holding a 38px-target button is the same defect in a shorter box. Both belong to
the same epic.

`specs/design-system/components/cn-card/spec.md` states the row, and the card book
describes it, so both follow the change.
