# `.text-subtitle` is used but not declared

`/principles/typography` sets the two typeface descriptions with
`<p class="text-subtitle">`. No stylesheet declares that class, so both lines render as
body text.

The class is the right name for what those lines are — a descriptor under a heading — and
no shipped step covers it. `small` is secondary prose, `caption` is uppercased metadata,
and `label` is monospace machine text kept for casing that carries meaning. A subtitle is
none of those: it is neither technical nor machine text.

## Remaining change

Declare the step. That is a change to the closed step set in
`specs/design-system/typography/spec.md`, whose table currently states eight steps and no
subtitle, so it needs the size, line, weight and tracking decided before the class ships
in `styles/typography.css` with its mirror class and downshift behaviour.

Until then the book names a class that does nothing.
