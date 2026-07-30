---
name: over-planning
branch: feat/ds-typography
date: 2026-07-30
---

**Context:** We over-plan. Symptoms keep getting removed and the reflex returns.
The owner's read is that the root cause is still unknown, and that each solved case
makes the next easier — so this file is the case, not its symptoms.

**What happened:** today produced a six-story decomposition, a dependency graph,
per-story file names, verification criteria for unstarted work, a map of ~145
call-site edits, and fourteen settled decisions — with zero production change. Two
of the fourteen were needed to start. Several were visual judgments made from
arithmetic: h0 is 6rem because 4.24 × 1.414 = 6, and nobody has seen 6rem. This is
not new. `6b10b91` (2026-07-18) recorded "Delivery Process Became The Product" —
seven goals expanded into 21 serial issues, planning exceeding the implementation it
supported — and set the gate "no more than five outcome milestones on the critical
path." That gate never reached `main`; it sits in `docs/retros/` on the abandoned
`feat/core-design-tokens`. Twelve days later, six stories. The same correction has
been applied to specs (`280d6c5`, `6bb003f`), the contract (`2f8f5c0`), plans
(`86726d0`, `bb3292d`) and the inbox itself (`1016ccb`, `50a0590`, `22c0fb9`).

**Suspected why:** each correction is captured as another planning artefact on a
branch instead of installed in the contract, so the reflex outlives every fix — and
the capture apparatus is itself over-planned.

**Fix:** install the 2026-07-18 gate in `AGENTS.md`, since it was already written
and never adopted. Symptoms filed separately, deliberately unmerged:
[[epic-plans-preplan-slices]], [[epic-plan-accretes-decision-prose]],
[[agent-artefacts-have-no-length-budget]].
