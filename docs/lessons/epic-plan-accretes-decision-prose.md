---
name: epic-plan-accretes-decision-prose
branch: feat/ds-typography
date: 2026-07-30
---

**Context:** `plans/typography.md` is 443 lines. Every other plan is 74–197 and
every spec 80–192. The owner expected 100–200 and read it as a context cost.

**What happened:** it was 200 lines when written — the expected size — then grew to
304, 378 and 443 (`a964a18`, `31df5a1`, `dd3ac4a`) across commits that added no
research, only rulings made in conversation. Its two decision sections are 169 and
124 lines; all five sections carrying actual investigation total 106.

**Suspected why:** each ruling was written as the argument that produced it rather
than the decision it reached, because no spec existed yet to hold the decision.

**Fix:** record rulings as one-line decisions and let the commit message carry the
reasoning, as `docs/practices/lessons.md` already does for findings. Larger
candidate: settled decisions move into the spec as they are made, since `AGENTS.md`
makes the linked spec the source of truth, leaving the plan as investigation plus
pointers. Owner asked that this be recorded and not acted upon. Related:
[[epic-plans-preplan-slices]], [[agent-artefacts-have-no-length-budget]].
