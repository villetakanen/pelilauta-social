---
name: asdlc-audit-has-no-coherence-check
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** `AGENTS.md` carried four bullets of design-site mechanism — how a book
is authored, where the taxonomy lives — which produced every `.astro` book we then
had to throw away. `.agents/skills/asdlc-audit/SKILL.md` exists to audit the
constitution and never flagged them.

**What happened:** all three of its REPORT questions look outward — which ASDLC
patterns are present, which diverge, which could be adopted. None asks whether a rule
sits at the wrong altitude, or duplicates a spec that already governs the subject. The
book rule was ASDLC-conformant and in the wrong document, and the audit cannot see
that. This is the second escape: the altitude finding was closed as covered because
"the `AGENTS.md` context map says what each location owns", but that map (`93bd0f7`)
is a directory tree — it says what each *directory* holds, never what each *document*
holds.

**Suspected why:** the skill was written as a conformance check against an external
knowledge base, so internal coherence was never in its scope.

**Fix:** add a fourth REPORT question to `.agents/skills/asdlc-audit/SKILL.md` — which
rules sit at the wrong altitude for the document holding them, or restate something a
spec already governs. Two lines, and it would have caught this.
