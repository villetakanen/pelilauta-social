# Elevation 4 Uses An Unsettled Colour Family

Status: Recorded 2026-08-04

## What is wrong

Elevation 4 currently resolves through `--cn-surface-4`, using the surface family
in both themes. This is the shipped v20 mapping, but the highest system layer has
not been evaluated as part of v21's colour hierarchy.

The role may require a primary-family colour instead. That would distinguish
system-level content through chroma rather than by reversing the surface sequence,
and would change which foreground roles meet WCAG 2.2 AA.

The current mapping is encoded in `styles/color-theme.css`, the Surface spec, the
Colour & Surface principles book, and contrast tests. Those sources describe the
current implementation; they do not settle the future colour family.

## What done looks like

The owner approves the Light and Dark expressions of elevation 4 after comparing
the current surface-family mapping with a primary-family alternative. The selected
background and foreground roles meet WCAG 2.2 AA for their intended content.

The semantic tokens, Surface spec, principles and utility books, specimens, and
contrast checks are updated together.
