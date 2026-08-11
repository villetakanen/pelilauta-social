# A button's click area is its visual size, not its physical size

Cyan 4 promises "a minimum physical touch area of 56x56 pixels, even if their visual
appearance is smaller", and v20's spec calls `--cn-button-physical-size` the grid-aligned
row including margins. Neither delivers a larger target, and neither does v21:
`styles/buttons.css:33-40` gives the pill `block-size: var(--cn-button-size)` (38px) and
centres it in the row with `margin-block: 9px`. Margin takes no pointer events, and the
`::after` at `inset: 0` is the hover wash, declared `pointer-events: none`. The clickable
area is 38px tall.

Inline is not affected: `padding-inline: var(--cn-gap)` is part of the box. FABs are not
affected either, at 56px `block-size` — except `.small`, which collapses to
`--cn-button-size` and inherits the same 38px.

38px clears WCAG 2.2 AA (SC 2.5.8, 24 CSS px). It does not clear WCAG AAA (SC 2.5.5,
44 CSS px) or Material Design 3 (48dp).

## Remaining change

The click area is 48px, six grid units (human decision, 2026-08-10). The visual pill stays
at `--cn-button-size`, and a button row carries a gap above and below the target, so the
row occupies three lines of vertical rhythm.

Deliver the target rather than the row: replace the block margin with padding on the
control, or give the control a transparent area that receives pointer events. `.small` FAB
and any icon-only control reading `--cn-button-size` follow the same rule.

This changes the vertical rhythm of every button row in `apps/pelilauta`, so it belongs in
its own epic, with `specs/design-system/actions/spec.md` updated first: the spec states the
row, and the target is what the accessibility claim rests on.
