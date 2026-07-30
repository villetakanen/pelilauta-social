# feat/release-beta-8 Lessons

## Repeated broad verification dominates release time

**Evidence:** Human observation across this release counted roughly 20-21 full
test-suite runs and at least as many builds. Even small commits took hours to
move through the agent workflow despite the suite having limited coverage.

**Root cause:** Parallel agents and successive review loops can each rerun broad
verification without sharing an authoritative evidence ledger or deciding
whether a later change invalidated earlier results.

**Candidate lesson:** Keep one check ledger for a delivery or release commit.
Reuse valid evidence, run targeted checks after narrow changes, and reserve full
suite and build repetition for changes that can affect their outcome or for a
single required integration boundary.

**Durable owner:** `.agents/skills/delivery-slice/SKILL.md`,
`.agents/skills/delivery-review/SKILL.md`, and `.agents/skills/release/SKILL.md`.

**Disposition:** Deferred to a later compound pass; captured at the human
owner's request on 2026-07-30 without expanding this release.
