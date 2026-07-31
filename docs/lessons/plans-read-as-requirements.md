---
name: plans-read-as-requirements
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** `AGENTS.md` names `plans/` once, in the workspace tree, as "epic level
PBIs". Nothing else says what a plan is, so its statements read as requirements that
must be true rather than as a description of an epic's scope and breadth.

**What happened:** `db086db` edited `plans/typography.md` mid-delivery to correct four
factual claims the preflight investigation had disproved — that v20 owned no reset
rules, that the whole `--cn-*-ui` family was undefined, that the first story was a
principles book, and that a colour-scheme flip was still pending after `55dafc9`
shipped it. The corrections were accurate and the commit was still the wrong move:
the owner does not want transient plans edited mid-feature, and none of those four
facts was scope or breadth. Three of them belong to `specs/design-system/preflight/`,
which the same session was about to write.

**Suspected why:** the plan is the only artefact that exists before its spec, so
findings land there and then have to be maintained there.

**Fix:** add one line to `AGENTS.md` defining a plan as an epic's scope and breadth —
why it exists, what it aims at, the stories and their dependencies — and stating that
verifiable claims about v18, v20 or Cyan belong to the spec that owns the surface. A
disproved claim in a plan then needs no edit, because the plan never asserted it.
Related: [[epic-plan-accretes-decision-prose]], [[over-planning]].
