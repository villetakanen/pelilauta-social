# A card's action row is seven grid units, not six

`CnCard.svelte:317-321` gives `.actions` `block-size: calc(7 * var(--cn-grid))` — 56px, the
button row Cyan 4 and v20 built from a 38px pill and 9px margins.

A control's click area is six grid units, 48px, and `specs/design-system/actions/spec.md`
states it. A card's action row states seven, so the row is a unit taller than the thing it
exists to hold, and card heights across every listing carry the difference.

## Remaining change

Take the action row to `calc(6 * var(--cn-grid))`. What gates it is no longer the click
area, which a control now has: it is the occupied row the Actions spec states, also seven
units, built from the pill and the block margin that centres it. A 48px action row cannot
hold a control that occupies 56, so the two move together or neither does.

`specs/design-system/components/cn-card/spec.md` states the row, and the card book
describes it, so both follow the change.

`plans/debt/the-design-system-has-no-actions-row.md` records the missing capability;
publishing it would settle this measurement too.
