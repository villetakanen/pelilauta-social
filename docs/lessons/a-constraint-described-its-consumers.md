---
name: a-constraint-described-its-consumers
branch: feat/deprecate-cyan-and-qol
date: 2026-08-23
---

**Context:** The transparency ladder was published as colour vocabulary in one session,
touching `specs/design-system/color-system/spec.md`, `surface/spec.md` and
`components/cn-poster/spec.md`. Six days earlier,
`a-spec-legislated-for-its-neighbours` recorded the same class of defect in the
application specs.

**What happened:** `color-system/spec.md` stated in Constraints that the ladder "keeps two
translucent layers on a page related to each other instead of each tuned by eye, so a
share picked outside it reads as a mistake even where it looks right alone." Neither half
is about the colour system: the first describes what authors do across a page, the second
asserts how a reader will judge one. `surface/spec.md:79` and `cn-poster/spec.md:32` both
said a ceding level admits enough artwork "to belong to the page it is on", an outcome no
rule can check. The owner caught all three; two independent spec-review critics had read
these specs and raised none of them, and the sentence had already been copied into
`docs/DESIGN.md` and the colour book by then.

**Suspected why:** The first occurrence was one author with the whole tree in view writing
about neighbouring capabilities; this one is the Constraints prompt — what would someone
guess wrong if it were not written here — inviting a sentence about the guesser. Same
boundary, reached from two directions, which is why naming only one of them did not hold.

**Fix:** `specs/TEMPLATE.md:25` already ends a spec's jurisdiction at other capabilities;
extend that paragraph to end it at consumers too — expected behaviour of the components or
people that use a capability belongs in Context, where a need already lives. Then add the
consumer half to the **Scope** check in `.claude/skills/spec-review/SKILL.md:41`, which
currently names only "another capability's values". Both are one-sentence edits, and the
second is the half `a-spec-legislated-for-its-neighbours` deliberately left out to keep
that change to one instrument — its own note predicted that a stated check would catch the
rest.
