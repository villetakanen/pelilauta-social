---
name: local-anatomy-drifted-from-upstream
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** `AGENTS.md` states that spec conventions follow the practices published
at ASDLC.io. `specs/TEMPLATE.md` and `.agents/skills/spec/SKILL.md` were the local
expression of that, and both had been edited since without anyone rereading what
upstream says.

**What happened:** two edits had reversed upstream. The template replaced Scenarios
with an Acceptance section, so Definition of Done absorbed behavior and Acceptance
restated it — visible as duplication in `design-site-navigation/spec.md` lines 57–71
against 88–95. And Blueprint was redefined as "not how it is built", where upstream
defines it as the architecture section that names interfaces and file paths. Three
sessions were spent designing a replacement anatomy before anyone fetched
`asdlc.io/patterns/the-spec/` and `asdlc.io/practices/living-specs/`, which took two
calls and showed the fix was to restore two sections, not to design anything. A
competing proposal in hand at the time (`docs/harness-improvement-proposal-sol.md`,
now deleted) would have deleted the Contract half entirely — a third departure,
argued as a correction.

**Suspected why:** nothing in the harness reads the source it claims to follow, so
each local edit is judged against the local text it is editing.

**Fix:** `.agents/skills/asdlc-audit/SKILL.md` REPORT question 2 asks what diverges
from recommended, but nothing points it at the documents that hold the local
expression. Name them: the constitution, `specs/TEMPLATE.md`, and the skills under
`.agents/skills/`, with their upstream counterpart article. Related:
[[asdlc-audit-has-no-coherence-check]].
