---
status: draft
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

## Icon Sizes

Five sizes — xsmall, small, medium, large, xlarge — stated as `rem` literals rather
than grid multiples, following v20, whose `tokens/units.css` files them beside the grid
and marks them "absolute, not grid-derived". They scale with the reader like every
other `rem` length; they simply do not derive from `--cn-grid`. The medium default is
the reason the family is absolute: at 2.25rem it is four and a half grid steps, so
expressing it as a multiple would mean changing it.

Values are in the [Units and grid](/tokens/units) lexicon.

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

- Rail and tray geometry and button sizing are part of the spatial system in v20 and
  are not owned here yet; they still come from Cyan 4. Icon sizes are owned — see the
  exception below.
- The layout grid — how many columns sit inside a breakpoint, and the margins,
  gutters and maximum container width around them — is not owned yet.
- Box rules, including how a border is counted against a box's own measurements,
  belong to System Mechanics.
- Typographic sizes are typography's, not the grid's.

## Regression Guardrails

- The grid is the only literal length, and every measurement derived from it derives
  from it in the stylesheet, not in a comment.
- Icon sizes are the one named exception: absolute by v20's decision, which states them
  as `rem` literals and marks them "absolute, not grid-derived". Four of the five land
  on the grid anyway; the medium default is 4.5 steps, so the family cannot be
  expressed as multiples without moving it. No other design-system stylesheet states an
  absolute length.
- The token entry point supplies the grid dependency used by the elevation shadows.

## Acceptance

- A reader who sets a larger default text size in their browser gets a
  proportionally larger interface, not the same layout with larger text in it.
- A control one `--cn-line` tall sits on the same rhythm as the text beside it.
- A developer choosing spacing for an unlisted case picks a role by the
  relationship between the two elements, and lands on a grid multiple.
