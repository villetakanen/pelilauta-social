---
name: agents-write-models-not-anchors
branch: feat/ds-typography
date: 2026-08-01
---

**Context:** ASDLC calls the intended mode spec-anchored: a spec holds in place what
would otherwise drift, and is silent about everything else.

**What happened:** `specs/design-system/content-containers/spec.md` was first written
at 154 lines for one centred column, and almost none of it anchored anything — how
container queries resolve and why `ch` varies by font are facts about CSS, not
decisions this project made. Told to cut, the first thing deleted was Regression
Guardrails, which was the most anchor-like section in the file: a model's least
valuable section is the one that describes nothing. The same session produced the
same argument in four places — the plan-mode file, the spec, the stylesheet header
and the book. `specs/TEMPLATE.md` and `.agents/skills/spec/SKILL.md` were corrected
in flight by the owner's order; the skills were not.

**Suspected why:** an agent with reasoning to record and no stated home for it puts
it in the nearest document, and the nearest document is the spec.

**Fix:** `docs/practices/lessons.md` says "the commit message is the permanent
record" but scopes it to lesson notes. State it generally, in `AGENTS.md` — the
reasoning behind a decision goes in the commit message, the decision goes in the
spec. Then `.agents/skills/spec/SKILL.md` and the writing skills can point at one
rule instead of each inventing a home. Related:
[[epic-plan-accretes-decision-prose]], [[local-anatomy-drifted-from-upstream]].
