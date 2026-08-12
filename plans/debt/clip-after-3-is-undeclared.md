# `.clip-after-3` Is Applied And Never Declared

Status: Recorded 2026-08-12, found while retiring `.secondary` in the content-grids epic

## What is wrong

`svelte/thread-editor/ForkThreadApp.svelte:116` applies `clip-after-3` to the quoted
thread it previews. No stylesheet declares it: not `packages/design-system/styles`, not
`@11thdeg/cyan-css`, not the component's own scoped block. The name says the quote is
clamped to three lines. Nothing clamps it.

The class is the only evidence of the intent, so the intent is what has to be recovered:
a preview that shows the first lines of a thread and stops.

## Why it stays open

The fix is not deleting the attribute. Whatever replaces it — a line clamp utility, a
component that owns its own preview — is a design-system decision, and one call site does
not settle where it belongs.

Clamping a text to a number of lines is wanted in more than this one place, and the
design system does not offer it. Where a surface needs it today it writes the clamp
itself. Consolidating those into one declared way of asking is the work; this call site
is the one that named the utility and never got it.

## What done looks like

The fork preview clamps its quote to three lines, through something the design system
declares, and the other places that clamp text ask for it the same way.
