---
name: plans-definition-collides
branch: feat/ds-navigation
date: 2026-07-30
---

**Context:** Drafting the workspace context map, the owner annotated `plans` as
"epic level PBIs". `AGENTS.md` and `README.md` both defined it as bounded
per-slice scope, implementation decisions, and acceptance evidence.

**What happened:** Two incompatible definitions coexisted without either being
wrong on its face — an epic-level ledger spanning many slices, and a per-slice
record closed by one merge. The owner reads it as the first meaning; the written
contract states the second. `apps/pelilauta/plans/` also exists alongside the
root directory, inherited from the v18 import, with no statement of which is
authoritative.

**Suspected why:** `plans/` was the only writable surface with no stated
lifetime, so both meanings fit and neither had to displace the other.

**Fix:** Aligned the definition to epic-level PBIs in `AGENTS.md` and
`README.md`. Two things remain open: which of the two `plans/` directories is
authoritative, and whether the acceptance-evidence role the old definition
carried now belongs to the epic PBI, the slice's pull request, or an ADR. This
collision plausibly explains [[shadow-epic-branch]] — a branch acquiring a plan
file as its work ledger is legitimate under one definition and not the other —
and the plan-as-inventory drift in [[harness-artifact-altitude]].
