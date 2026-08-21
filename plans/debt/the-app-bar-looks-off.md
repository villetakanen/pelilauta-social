# The Application Bar Looks Off

Status: Recorded 2026-08-21, while building the editor shell

## What is wrong

The application bar reads wrong. The owner cannot yet say why or how — only
that the whole bar looks off, not one measurement in it. That is the finding,
and it is recorded before it is diagnosed because a look that reads wrong is
worth keeping hold of.

It is not the modal bar, and it is not the editor: it shows on the **CnAppBar**
book at `/components/cn-app-bar` as much as on the editor shell, so it belongs
to the bar itself rather than to any surface standing under one. Clearance is
not it either — content clears the bar by `--cn-app-bar-height` and reads
correctly against it.

Measured on the editor shell at 1280 by 800, as raw material rather than as a
diagnosis:

- The bar's box is 64px tall, and `--cn-app-bar-height` resolves to the same
  64px, so the token sizes the box.
- The default bar at the top of a page paints no shadow. A modal bar paints
  `--cn-color-surface-4` with `oklch(0.3 0.09 242) 6px 6px 24px 0px`, offset on both
  axes.

## What needs asking

This one starts with an interview, not a measurement. The operator holds the
design intent for the bar — it is v20's, and `docs/DESIGN.md` does not settle
it — so the questions come after the owner has had a chance to look at the
book and name what reads wrong: the height, the type, the surface step and
veil, the leading region, the action row, or the proportion of the whole
against the content beneath it.

## What done looks like

The owner can name what reads wrong, `specs/design-system/components/cn-app-bar/spec.md`
says what it should be instead, and the bar reads as designed rather than as
inherited.
