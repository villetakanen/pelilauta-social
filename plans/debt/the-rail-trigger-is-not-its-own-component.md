# The rail's trigger has no component and no book

`packages/design-system/components/CnRail.astro` draws the trigger that collapses and
expands the rail, and `specs/design-system/rail/spec.md` governs it: its glyph in each
mode, where it stands in the application bar, the focus it returns to, and the script the
mode needs.

So the trigger is a control with its own semantics, its own two states and its own
accessibility contract, and it exists only as markup inside another component. It has no
entry in the design system's components, and no book page a reader can see it in, though
every other chrome control has both.

It belongs to the rail, and nothing else will ever mount it. That is a reason to keep the
rail as its owner, not a reason to leave it undeclared.

## Remaining change

Give the trigger its own component and its own book entry, mounted by `CnRail.astro` as
the rail's own control. Decide whether the rail's spec keeps governing it or hands its
contract to a spec of its own.
