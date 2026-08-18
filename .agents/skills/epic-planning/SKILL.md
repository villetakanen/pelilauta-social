---
name: epic-planning
description: Create or refine an epic plan in plans/ — goal, outcome-based
  success criteria, guardrails and explicit scope boundaries — before
  implementation. Use for an epic or a substantial change; do not use for
  task slicing (next-task) or implementation checklists.
---

# Epic Planning

Produce an intent-first epic plan: enough to steer delivery without freezing
the implementation. `plans/TEMPLATE.md` carries the structure; this skill
carries the process; `docs/WRITING.md` carries the sentences.

## Workflow

1. Read the template, the existing plan when refining one, the specs and
   implementation near the epic's surfaces, and v20 where the epic migrates
   one.
2. Identify the intended outcome, the observable states that would prove it,
   what must not regress, the boundaries, and the material unknowns.
3. Write or refine the plan at `plans/<epic>.md`, named after its `feat/**`
   branch.
4. Re-read for scope creep, hidden commitments, and task-shaped success
   criteria.

## Rules

- A candidate that needs a design-system capability names the spec the
  capability requires.
- An unknown about v18's behaviour or the Firebase contract goes to Open
  questions; AGENTS.md's Judgment Boundaries say when to ask and wait.
- Discovered work outside the epic goes to `plans/debt`, not the plan.
- Separate fact from assumption; label the assumption rather than stopping.
- Do not decompose into tasks or begin implementation; slicing is the
  `next-task` skill's pass.
