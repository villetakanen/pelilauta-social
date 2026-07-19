# Active Delivery Lessons

Every delivery branch maintains working lessons under
`docs/lessons/<branch-name>.md`, replacing `/` with `-`.

The lessons file is persistent working memory. It is updated throughout the
cycle, not reconstructed at the end.

## Required Behavior

1. Read the active lessons file before planning, implementation, review,
   verification, release, or documentation work.
2. Create it when a branch first produces a meaningful finding.
3. Update it immediately after discovering a failed assumption, compatibility
   fact, product decision, useful source, tool failure, or reusable technique.
4. Separate observed facts from interpretation and human decisions.
5. Record accepted, deferred, and rejected actions so they are not repeatedly
   proposed without new evidence.
6. Keep delivery state in the plan. Lessons explain what was learned, not which
   task is currently in progress.
7. At cycle close, finalize the same file with the actual outcome, verification
   and human evidence, root causes, compound decisions, remaining assumptions,
   and next production problem.

Do not add ceremony for routine actions. Capture information that should change
later reasoning, planning, implementation, or review.

## Required Close Content

1. Name the production outcome and whether it shipped or was stopped.
2. Record compatibility, deterministic, deployment, and human evidence.
3. Separate what worked from what failed or created unnecessary cost.
4. State root causes rather than only symptoms.
5. Record each candidate action as accepted, deferred, or rejected.
6. Carry only accepted actions into another plan.
7. State remaining assumptions and the next production problem, if known.

## Compound Rules

- A finding is evidence, not automatic scope.
- Prefer correcting an existing artifact over creating another process layer.
- Add automation only after a concrete repeated or release-significant failure.
- Keep work on the shortest path to a visible production outcome.
- Deferred work stays deferred until new evidence or a human decision changes
  its status.
- Keep rejected proposals visible so they are not repeatedly rediscovered.
