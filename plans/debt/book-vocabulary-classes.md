# The Typography Book Wears An Unshipped Class

Status: Recorded 2026-08-04; narrowed to one class by the surfaces and elevation slice

## What is wrong

`apps/design/src/content/principles/typography.mdx` marks its section subtitles with
`class="text-subtitle"`. No stylesheet in `packages/design-system` declares it, so it
renders as nothing. It exists in neither v20 nor v21, and it names a text treatment
the scale does not publish.

`surface` and `elevation-1`, which the same page uses to frame its typeface
introduction, now ship. `packages/design-system/styles/surface.css` declares both,
under `specs/design-system/surface/spec.md`, and `/base/surface` documents them.

The class is the owner's intent marker, kept deliberately. The debt is that the design
system's own exemplar page asks for vocabulary the system does not ship, and
`specs/design-system/spec.md` requires a demonstration to be set by the system's own
classes.

## What done looks like

`text-subtitle` either ships — a declared class with a spec and a book entry — or
leaves the page. It does not render as nothing on the exemplar.
