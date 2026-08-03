---
status: draft
---

# Design

Design decisions that no single capability owns. A decision about one capability is in
that capability's spec — the type scale in `specs/design-system/typography`, the faces in
`specs/design-system/fonts` — and is not repeated here.

## Authority

Appearance is v20's and a human's. Where either disagrees with the shipped application,
they win: the application is v18's, and appearance is not a compatibility contract.

## Themes

Two, Dark and Light, shipped in the same release. Dark is the default, and the theme the
interface is designed in. Light is checked before merge; where they disagree, Light is
adjusted.

The browser or OS selects the theme through `color-scheme`. A signed-in account may pin
one, applied by `apps/pelilauta` at SSR. The design system never reads account state.

## Not settled

A book does not answer these.

- What elevation means, and whether five surface roles are needed.
- Whether contrast below AA is acceptable on a raised Dark surface.
- Whether colour may carry meaning without an icon or label.
- Whether `--cn-color-success` resolving to `primary-60` is intended.
