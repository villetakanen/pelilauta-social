---
name: epic-planning
description: Create or refine an epic as a GitHub issue — goal, outcome-based
  success criteria, guardrails and explicit scope boundaries — before
  implementation. Use for an epic or a substantial change; do not use for
  task slicing (next-task) or implementation checklists.
---

# Epic Planning

Produce an intent-first epic: enough to steer delivery without freezing
the implementation. An epic is a GitHub issue labeled `epic`;
`docs/EPIC_TEMPLATE.md` carries the body structure; this skill
carries the process; `docs/WRITING.md` carries the sentences.

## Workflow

1. Read the template, the existing issue when refining one, specs and
   implementation near epic surfaces, and v20 where the epic changes
   presentation no spec has settled.
2. Identify the intended outcome, the observable states that would prove it,
   what must not regress, the boundaries, and the material unknowns.
3. Create or edit the issue with `gh issue` and label it `epic`. Name the
   outcome rather than the release branch.
4. Re-read for scope creep, hidden commitments, and task-shaped success
   criteria.

## Rules

- A candidate that needs a design-system capability names the spec the
  capability requires.
- An unknown about the Firebase contract goes to Open
  questions; Judgment Boundaries in `AGENTS.md` state when to ask and wait.
- Discovered work outside the epic goes to an issue labeled `task` and
  `debt`, not the epic.
- Separate fact from assumption; label the assumption rather than stopping.
- Do not decompose into tasks or begin implementation; slicing is the
  `next-task` skill pass.
