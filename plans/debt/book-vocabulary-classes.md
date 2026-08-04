# The Typography Book Wears Three Unshipped Classes

Status: Recorded 2026-08-04, unstarted

## What is wrong

`apps/design/src/content/principles/typography.mdx` marks its typeface introduction
with `class="surface elevation-1"` and its section subtitles with
`class="text-subtitle"`. No stylesheet in `packages/design-system` declares any of
the three, so they render as nothing.

- `.elevation-1` is v20's (`packages/cyan/src/utilities/elevation.css`: background
  `--cn-surface-1`, shadowless by decision) and waits on the surfaces work.
- `.surface` and `.text-subtitle` exist in neither v20 nor v21; `text-subtitle`
  names a text treatment the scale does not publish.

The classes are the owner's intent markers, kept deliberately. The debt is that the
design system's own exemplar page asks for vocabulary the system does not ship, and
`specs/design-system/spec.md` requires a demonstration to be set by the system's own
classes.

## What done looks like

Each of the three either ships — a declared class with a spec and a book entry — or
leaves the page. None renders as nothing on the exemplar.
