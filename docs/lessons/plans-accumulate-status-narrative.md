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
Hours after this note was filed, the same agent wrote three Done lines into
`plans/chrome.md` (`66602c9`) carrying one story's field name, paint timing and bar
placement — detail the commit message already carried — and the operator challenged
their benefit. All are agent-written state in a file the operator reads as goal plus
hypotheses.

**Suspected why:** nothing states what a plan may not carry, so agents narrate progress
and pauses into whatever plan file is open.

**Fix:** add two lines to `plans/TEMPLATE.md`: a plan carries its goal and its open and
done hypotheses, and no status narrative — a section outside the template is deleted,
not maintained; and a done story is one line stating that it closed, with its what and
how left to the commit message.
