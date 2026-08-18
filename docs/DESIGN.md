# Design

The Design Vision and high level guidance for Pelilauta v21 and its design system.

## Authority

The v20 Design System established the aesthetic we are now porting to the v18 business logic.
Where that authority is lacking, human supervision is needed for decision.

## Technical writing

`docs/WRITING.md` carries the writing rules for every artifact. Match the breadth and
the depth of writing to the domain: a principles book may need deep and wide prose, a
component book short technical details, a comment in a data model some background, a
comment in a CSS file a two-word disambiguation. Do not use a sibling file to judge
register or length.

## Foundations

### Colour

Replaceable chroma imports predate Pelilauta and exist in Cyan 1. v19 supplies the
current chromatic and semantic vocabulary, together with OKLCH lightness as an
approximation of contrast. v20 carries that model in the design-system
implementation being ported; `specs/design-system/design-tokens/spec.md` governs it.

Semantics preserve purpose across colour schemes. Components consume purpose, not
a chroma step.

### Spacing and responsiveness

Spacing derives from one base grid; `specs/design-system/spatial-system/spec.md`
governs the measurements.

v19 established one central model for responsive layout:

- Layout responds to CSS container queries, not media queries.
- The atomic-CSS screen-size helpers, such as `.sm-hidden` or `.only-on-desktop`,
  are deprecated.
- The design system decides what shows or hides at a width. The application chrome
  carries a component-specific mechanism
  (`specs/design-system/application-chrome/spec.md`); content container layouts
  handle widths as view modes internal to the component
  (`specs/design-system/content-container-layouts/spec.md`).
