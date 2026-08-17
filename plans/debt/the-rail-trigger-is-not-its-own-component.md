# The rail's trigger has no component and no book

`packages/design-system/components/CnRail.astro` draws the trigger that collapses and
expands the rail, and `specs/design-system/rail/spec.md` governs it: its glyph in each
mode, where it stands in the application bar, the focus it returns to, and the script the
mode needs.

So the trigger is a control with its own semantics, its own two states and its own
accessibility contract, and it exists only as markup inside another component. It has no
entry in the design system's components, and no book page a reader can see it in, though
every other chrome control has both.

It also declares geometry the chrome action owns. `.cn-rail-trigger` states a target of
`calc(var(--cn-grid) * 7)`, a `::before` surface of six grid units with its own radius, its
own `--cn-hover` and `--cn-active` fills and its own focus ring — a second copy of what
`specs/design-system/chrome-actions/spec.md` declares for every other chrome control. That
spec's own goal is one vocabulary no container redefines, and this container redefines it.

It belongs to the rail, and nothing else will ever mount it. That is a reason to keep the
rail as its owner, not a reason to leave it undeclared.

## Remaining change

Give the trigger its own component and its own book entry, mounted by `CnRail.astro` as the
rail's own control, composing the chrome action rather than restating its target, surface,
states and focus treatment. Decide whether the rail's spec keeps governing it or hands its
contract to a spec of its own.
