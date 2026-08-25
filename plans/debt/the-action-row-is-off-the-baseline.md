# The action row is off the baseline

`specs/design-system/actions/spec.md:123` states the occupied row as `7 × --cn-grid`,
which is 56px. `--cn-line` is 24px, so a row is three and a half lines. A content area
separates its children by `--cn-line`, so every block below an action row sits half a
line off the baseline the typography and spatial systems keep.

Nothing in Content Container Layouts causes it, and nothing there can correct it: the
area states the interval between blocks, not the height of one.

## Remaining change

Decide whether the occupied row is a whole number of lines. If it is, the row and every
control measured against it change together, and the FAB sizes at
`specs/design-system/actions/spec.md:159-160` are part of that. If it is not, state in
the actions spec that a control's occupied row is deliberately off the line, so the
next reader meets a decision rather than a defect.
