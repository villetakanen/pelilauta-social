---
name: harness-artifact-altitude
branch: feat/ds-navigation
date: 2026-07-30
status: deferred
trigger: the next cycle, before new spec or plan work begins
---

**Context:** Harness artifacts — spec template, provenance frontmatter, plans —
state what belongs in them only negatively, if at all.

**What happened:** Four artifacts drifted the same way in one slice, each caught
by the owner reading it rather than by any gate:

- Provenance frontmatter reached 456 words carrying framework internals, design
  rationale, a defect finding and slice sequencing — all of which
  `specs/TEMPLATE.md` already assigns to the plan.
- The spec reached 177 lines for temporary documentation navigation, against 78
  for `design-tokens`, which governs the whole application's visual contract.
- Its Intent narrated history, then value claims, and never defined "book" or
  named agents as readers. Naming them immediately produced a missing contract
  line.
- `plans/core-tokens.md` was written as an inventory of token values and call
  sites — facts trivially greppable from source.

Five provenance entries were also worded as dated human decisions but composed
by the agent, laundering agent reasoning into human authority in the one field
designated as evidence.

**Suspected why:** One cause, not four. `specs/TEMPLATE.md` bounds the spec body
but not its frontmatter, defines a plan only negatively as where excluded detail
belongs, and prompts Intent for motivation rather than for the domain and its
boundaries. The spec skill states "a spec without provenance is an opinion, not
evidence" — pressure to add, with no counterweight. The mandatory adversarial
review cannot catch any of it: its five axes all ask whether the spec says
enough, so every pass grows the file. This one added a Review section, two
Definition-of-Done lines, two guardrails and two tests.

`git log --follow specs/TEMPLATE.md` shows all of this entering in one commit,
`140720c`, which added the Intent anatomy, mandatory provenance and the review
gate together, explicitly before implementation began, with no spec to verify
against. Its own lesson recorded the decision as aligning with published
ASDLC.io practice — while diverging from it: the published anatomy is Blueprint
(Context, Architecture, Constraints) plus Contract, and no ASDLC.io spec uses
Intent. The two dropped thirds are what would have forced concreteness.
See [[narrow-criticism-sweeping-rewrite]] for that commit's other half.

**Fix:** State an altitude for each artifact, positively. For plans, the
operational test is greppability — a line regenerable from source with a grep is
not plan content. For Intent, ask for the domain objects, the consumers by kind
including agents, and the expected lifetime. For provenance, one line per entry
naming a source, and mark agent-proposed decisions as such. Add a subtraction
pass to the review, run last: what can be deleted without losing a checkable
claim.

The subtraction pass applies to `AGENTS.md` itself, not only to specs. A false or
phase-scoped rule there is removed, not caveated: the `feat/*` → `main`
integration line was trimmed to the push guard alone once the owner pointed out
that target-branch mechanics belong to repository settings. Both fixes proposed
before that were additive — a CI check, then a caveat.
