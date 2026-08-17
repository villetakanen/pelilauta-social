---
name: a-spec-legislated-for-its-neighbours
branch: feat/chrome
date: 2026-08-17
---

**Context:** Five applications gained a spec each, with a rail spec beside it, over one
session: `specs/pelilauta/{base,library,site,docs,admin}`.

**What happened:** Four of the eleven specs claimed something about the applications
around them. `base-rail/spec.md` said no application a door leads to offers a control
returning to the base, which nobody had decided and which reads as a rule forbidding a way
home; the library's rail was built without one because of it. `site/spec.md` said it was
the one application not carrying the base's bar, which the documentation and administration
falsified within the hour. `site-rail/spec.md` said the entry leading to Pelilauta stands
in no other rail, and two other rails carry it. `base/spec.md` said every application takes
`ModalPage.astro`. Each sentence was written in good faith about the state of the tree at
that minute, and none of them could bind the specs they described.

**Suspected why:** A spec's sentences read as law, and nothing in the template said where
its jurisdiction ends. An author with the whole tree in front of them states what they can
see, and what they can see includes their neighbours.

**Fix applied:** `specs/TEMPLATE.md` now states that a spec cannot bind another capability,
so a sentence about what another one does, does not do, or is the only exception to governs
nothing and goes stale when that capability changes.

**Fix not applied:** `spec-review` has no check for this class. Three of five critics found
an instance while reading a spec against its code, which suggests a stated check would
catch the rest — a census claim is cheap to test, because verifying it means opening a file
the spec has no business governing. Left out to keep this change to one instrument.
