---
name: nothing-says-what-belongs-where
branch: feat/ds-navigation
date: 2026-07-30
---

**Context:** Four artifacts filled with detail nothing had said didn't belong in
them, each caught by the owner reading it rather than by a gate. Three are now
closed: the `AGENTS.md` context map states what each location owns, the
navigation spec defines "book", and the provenance field is gone with a
Subtraction axis added to the spec review.

**What happened:** The fourth remains. `plans/core-tokens.md` was written as an
inventory of token values and call sites — every line regenerable by a grep of
source. `plans/` is now defined as epic-level PBIs, which says what a plan *is*
but not what may be written inside one, so the same file could be written again
today without contradicting anything.

**Suspected why:** A location's purpose and its content bound are different
statements, and only the first got made.

**Fix:** State the operational test where plans are described: a line a grep of
source can regenerate is not plan content. One sentence, in `AGENTS.md` beside
the epic-PBI definition. Related: [[plans-definition-collides]].
