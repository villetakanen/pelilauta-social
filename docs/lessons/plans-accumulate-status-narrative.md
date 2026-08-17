---
name: plans-accumulate-status-narrative
branch: feat/chrome
date: 2026-08-17
---

**Context:** `plans/chrome-actions.md` was read on 2026-08-17 to answer what remains
open on the epic.

**What happened:** the file carried a `## Parked` section (added 2026-08-14, removed in
`2c97927`) declaring the plan "no longer worked as an epic" and its items shipped — a
status narrative that proved false: the epic was paused for a spike, not closed. The
same day, an agent added a Done line the operator corrected twice before it stood.
Both are agent-written state in a file the operator reads as goal plus hypotheses.

**Suspected why:** nothing states what a plan may not carry, so agents narrate progress
and pauses into whatever plan file is open.

**Fix:** add one line to `plans/TEMPLATE.md`'s opening paragraph: a plan carries its
goal and its open and done hypotheses, and no status narrative — a section outside the
template is deleted, not maintained.
