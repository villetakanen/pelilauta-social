# Forced Colours Are Unaddressed Across The Actions Family

Status: Recorded 2026-08-13 while reviewing `specs/design-system/chrome-actions/spec.md`

## What is wrong

Interaction feedback across the Actions family is carried entirely by colour that a
forced-colours mode discards. `--cn-hover` and `--cn-active`
(`packages/design-system/styles/color-theme.css:93-100`) are translucent washes mixed
over a surface, and the chrome action's resting state surface is transparent. Under
`forced-colors: active` the user agent replaces author backgrounds with the reader's
own palette, so a control that says "the pointer is on me" only through a wash says
nothing at all.

`specs/design-system/actions/spec.md` requires keyboard focus to remain visible
without colour perception, and says nothing about the mode where the user has told the
operating system to take colour over. `specs/design-system/chrome-actions/spec.md`
inherits that silence rather than adding to it.

The gap is no longer ahead: the navigation destination shipped, per
`specs/design-system/chrome-actions/spec.md`, and it says "you are here" with
`--cn-indicator` and `--cn-on-indicator` — two colours forced colours takes over.

## Why it is not fixed here

It belongs to no single capability. Buttons, links, the FAB and chrome actions all
carry the same assumption, so a local rule in one spec would leave the family
inconsistent and imply the others had been considered.

The reader who needs this has expressed a preference, in the same way the reader who
requests reduced motion has. The system honours the second and not the first.

## What would settle it

A decision on whether the Actions family states a forced-colours contract at all, and
if it does, where it lives: `specs/design-system/actions/spec.md` as the family root,
or `specs/design-system/design-tokens/spec.md` alongside the roles it would constrain.
