---
name: scope-refusal-by-classification
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** The epic is delivered story by story, and a story regularly turns up a
defect a few files away from the one it came for. `AGENTS.md` says to keep unrelated
cleanup out, and `delivery-review` challenge 3 asks the reviewer to flag it, so the
agent's cheapest move is to name the defect and leave it.

**What happened:** establishing where icon sizing tokens belong surfaced two defects in
`specs/design-system/spatial-system/spec.md` — a non-goal at line 67 claiming icon sizes
"still come from Cyan 4" when the icon epic took ownership, and a guardrail at line 77
claiming "the grid is the only literal length" while scoping its checkable half to
`units.css`, so `icon.css`, which states five absolute lengths with one off-grid, was
the one file the rule did not inspect. Both were reported with "none of that is
preflight's business, so I've changed nothing." Both are the spatial system, which is
this epic's own subject, and both were two-line fixes; the owner had to ask for them.

**Suspected why:** the contract names one direction of the coupling error — scope
growing — and has no words for the other, so "out of scope" reads as the safe answer
whenever a change is not strictly required.

**Fix:** extend the coupling line in `AGENTS.md` so it discriminates by epic rather
than by story: a defect found inside the epic's subject matter is the epic's work, and
reporting it instead of fixing it is a choice that needs the same justification as
fixing it. Same sentence in `delivery-review` challenge 3, which currently only asks
whether an included change earns its place, never whether an excluded one did.
Related: [[plans-read-as-requirements]].
