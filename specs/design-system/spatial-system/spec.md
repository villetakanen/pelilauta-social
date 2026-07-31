---
status: approved
---

# Spatial System

## Intent

Every interface decision about distance — padding, gutters, row heights, the space
below a block, corner radii — is answered by one grid rather than by judgment. Two
people spacing two different screens reach the same measurement, and a screen built
by an agent looks like one built by hand.

## The Three Roles

Spacing is chosen by the relationship between two things, not by how large the gap
should look.

- Space **inside** a component — a chip's padding, an icon to its label — is
  `--cn-grid`.
- Space **between** elements that belong together — cards in a row, fields in a form
  — is `--cn-gap`. This is the answer when the relationship is unclear.
- Space **below a block**, and the height of a row, is `--cn-line`.

There is no step between the roles. A measurement that is not one of them, or a
multiple of the grid, aligns with nothing else on the page.

## Vertical Rhythm

`--cn-line` is the prose rhythm unit and the row-height role — one token rather than
two that happen to be equal. Body text defaults to a one-`--cn-line` line box, so a
control one `--cn-line` tall aligns with the text beside it.

Stacked blocks are separated by `--cn-line` or a multiple of it.

## Radii

Radii are grid multiples, so a corner stays in proportion when the system rescales.
Radius reads as a size cue: a large surface carries a large radius, and a small one
does not. A consumer that wants a rounded corner without choosing a step gets the
medium one.

Radii are the one place a half step appears. A box has two corners across each edge,
so a half-step radius spends one full step and leaves the box on the grid. Spacing
has no half step.

Inside a rounded container the padding is `--cn-grid` or more, so the curve does not
close in on the content it wraps.

## Scaling

The grid is relative, so the system scales with the reader rather than around them.
That property, and the rules that keep it, are owned by
`specs/design-system/design-tokens/spec.md`.

## Blueprint

One literal measurement exists — the grid. Spacing roles, radii and elevation
shadows are stated as multiples of it, so changing the grid moves the whole system
and nothing else has to be revisited.

Values are in the [Units and grid](/tokens/units) lexicon; the reasoning is in the
Spatial System principles book.

## Non-Goals

- Rail and tray geometry, button sizing and icon sizes are part of the spatial
  system in v20 and are not owned here yet; they still come from Cyan 4.
- The layout grid — how many columns sit inside a breakpoint, and the margins,
  gutters and maximum container width around them — is not owned yet.
- Box rules, including how a border is counted against a box's own measurements,
  belong to System Mechanics.
- Typographic sizes are the type ramp's, not the grid's.

## Regression Guardrails

- The grid is the only literal length. Every other unit derives from it, and
  `units.css` states no absolute length.
- The elevation shadows resolve, which requires the grid to load before colour.

## Acceptance

- A reader who sets a larger default text size in their browser gets a
  proportionally larger interface, not the same layout with larger text in it.
- A control one `--cn-line` tall sits on the same rhythm as the text beside it.
- A developer choosing spacing for an unlisted case picks a role by the
  relationship between the two elements, and lands on a grid multiple.
