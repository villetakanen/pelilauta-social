# LinkStateTable Overrides The Interaction It Demonstrates

Status: Recorded 2026-08-13 while delivering `specs/design-system/chrome-actions/spec.md`

## What is wrong

`packages/design-system/books/specimens/LinkStateTable.astro:66-74` copies the whole
of `styles/links.css`, re-scopes every selector under its own wrapper class, remaps
`:hover`, `:active` and `:focus-visible` onto a `data-link-state` attribute, and
injects the result into the page.

The copy carries the resting rules as well as the state rules. A re-scoped resting
rule gains a class over the shipped one, and the injected `<style>` follows the design
system's stylesheet in source order. Either way it wins. The shipped `:hover` and
`:active` rules therefore stop reaching any link inside the specimen.

The forced rows still render, because the remapped attribute selectors are more
specific again. What is lost is the unforced case: a reader who moves a pointer over a
link in the **Links, Actions and Buttons** book sees nothing happen, and a reader who
presses one sees nothing happen.

The same technique was used for `ChromeActionSpecimens.astro` and produced the same
defect there, found by the owner reviewing the rendered page. It was fixed by
extracting only the rules whose selectors name a mapped pseudo-class and injecting
those alone, leaving every other rule to the shipped stylesheet. That fix transfers
directly.

## Why it is not fixed here

It belongs to the Actions capability's book, not to chrome actions. Changing it would
put an unrelated specimen into a changeset whose outcome is the chrome action, and the
`delivery-review` skill treats unrelated cleanup as coupling.

It is also not merely cosmetic to verify: the links book is the detector for link
interaction states, so the fix needs its own look at the rendered page in both themes
before anyone trusts it.

## What would settle it

Apply the extraction technique from
`packages/design-system/books/specimens/ChromeActionSpecimens.astro` to
`LinkStateTable.astro`, then confirm on `/base/links-actions-buttons` that a real
pointer changes a link's colour and that every forced row still renders.

Worth checking the other specimens that read source at the same time —
`StepTable.astro` also injects a re-scoped copy, though it demonstrates no interaction
state and so may be unaffected.
