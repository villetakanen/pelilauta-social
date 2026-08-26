# The design system has no actions row

v19 and later do not use flex for spacing or alignment: where text alignment does not
align a thing, flex does not align it either. Applying that ruling stripped the flex
rules from six action rows — `EulaForm.svelte:124`, `offline.html.astro:28`, and the
`.actions` rows in `ForkThreadApp.svelte`, `ThreadEditorForm.svelte`,
`HandoutEditor.svelte` and `PageEditorForm.svelte` — and nothing published replaces
what those rules did.

Every control the design system publishes is inline-level, so a row of controls is a
line box and `.text-center` or `.text-end` aligns it; that much still works. Neither
`buttons.css` nor `typography.css` states an inline interval between two adjacent
controls, and the preflight zeroes every margin, so two controls in a row are now
separated only by the markup's inline whitespace — roughly one space character, where
`--cn-gap` held them apart before.

One space is enough for now. What the system lacks is a configurable actions row: a
published capability for a row of controls, which needs design work before it can be
specified. Two ways to state the interval were considered and not chosen — a control
stating its own inline separation from an adjacent control, and the row stating
`word-spacing` — this note is the record of the gap, not a proposal for its shape.

## Remaining change

Design and spec an actions row, then compose the six rows above from it instead of
the bare `text-end`/`text-center` alignment they carry now.
