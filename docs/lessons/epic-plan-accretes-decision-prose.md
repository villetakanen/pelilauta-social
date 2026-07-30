---
name: epic-plan-accretes-decision-prose
branch: feat/ds-typography
date: 2026-07-30
---

**Context:** `plans/typography.md` is 443 lines and 3719 words. Every other plan in
`plans/` is between 74 and 197, and every spec in `specs/` between 80 and 192. The
owner expected 100–200 — the size of the research payload prepared for specs — and
read the file as long enough to be a context-window cost rather than a help.

**What happened:** it was 200 lines when first written, which is the size that was
expected. It then grew to 304 (`a964a18`), 378 (`31df5a1`) and 443 (`dd3ac4a`)
across three commits that added no research at all — only rulings made in
conversation. The two decision sections are now 169 and 124 lines, 66% of the file,
while the five sections carrying the actual investigation total 106. Each commit
appended; none compressed what was already there.

**Suspected why:** each ruling was written as the argument that produced it rather
than as the decision it reached, because no spec existed yet to hold the decision.

**Fix:** the cheapest candidate is to record rulings as one-line decisions and let
the commit message carry the reasoning, which `docs/practices/lessons.md` already
treats as the permanent record for findings. The larger candidate is that settled
decisions belong in the spec as they are made — `AGENTS.md` says the linked spec is
the source of truth — leaving the plan as investigation plus pointers. Related:
[[epic-plans-preplan-slices]], whose suspected cause is the same missing
destination.

Owner asked for this to be recorded and explicitly not acted upon.
