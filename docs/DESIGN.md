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
implementation being ported; `specs/design-system/color-system/spec.md` governs it.

Semantics preserve purpose across colour schemes. Components consume purpose, not
a chroma step.

Colour carries the identity through every surface, and is built to be handed
over: one brand across the whole application, replaceable per site.

The palette is a northern forest under the sun. The primary scale shifts hue as
it lightens — glowing sunlit yellow down to deep shadowed green — because
hue-shifting scales mimic how colour behaves in nature; a held hue would be a
swatch, the rotation is a landscape. The cerulean surface gives the architecture
depth and atmosphere rather than neutral chrome. The register is Nordic calm
with one zine-punk spark; the palette never turns noisy, and never
polished-bland.

Colour is constrained so it can be given away. A sub-community themes its site
by replacing a whole chroma family, never a single role — the capability
Mekanismi's users loved, made safe by lightness-indexed scales whose contrast
survives the replacement. Love is a structural family because appreciation is
this community's core signal. Info is a role over primary, not a family: the
v20 info scale named a distinction the design never made.
`docs/color-rationale-study.md` records the rationale in full.

### Transparency

v19 made translucency systemic. Before it, a layer that let something through picked its
own share, so two translucent layers on one page were unrelated and a page over artwork
was tuned surface by surface. From v19 on, a share comes off one ladder.

The ladder is what makes translucency a property of the system rather than of the
component that happened to need it.

Translucency is a design decision and never a derived one. Where a layer sits over
artwork the system has never seen, no share can promise a contrast ratio — the only one
that could is opacity, which is the layer being removed. Legibility is guaranteed by
which levels cede and how far, not by a number computed against an image.
`specs/design-system/color-system/spec.md` governs the ladder, and
`specs/design-system/surface/spec.md` states which surfaces cede.

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
