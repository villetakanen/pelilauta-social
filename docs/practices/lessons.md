# Active Delivery Lessons

Every delivery branch maintains working lessons under
`docs/lessons/<branch-name>.md`, replacing `/` with `-`.

The lessons file is persistent working memory. It is updated throughout the
feature branch, which may deliver multiple slices to `main`, and is not
reconstructed at the end.

## Required Behavior

1. Read the active lessons file before planning, implementation, review,
   verification, release, or documentation work.
2. Create it when a branch first produces a meaningful finding.
3. Update it immediately after discovering a failed assumption, compatibility
   fact, product decision, useful source, tool failure, or reusable technique.
4. Separate observed facts from interpretation and human decisions.
5. Record accepted, deferred, and rejected actions so they are not repeatedly
   proposed without new evidence.
6. Keep task state in the applicable slice plan. Lessons explain what was
   learned and record what each merged slice established; they are not a task
   tracker.
7. For every merge to `main`, record the slice outcome, available integration
   identity, verification and human evidence, accepted carry-forwards, and
   remaining branch work. Record the pull request and source head before merge;
   reconcile the resulting merge identity during later integrated work when
   useful. Do not create a bookkeeping-only merge so a merge can name itself.
8. At branch close, reconcile stale current-state and open-gate sections, then
   finalize the same file with actual outcomes, root causes, compound decisions,
   remaining assumptions, and the next production problem.

Do not add ceremony for routine actions. Capture information that should change
later reasoning, planning, implementation, or review.

## Required Slice Content

1. Name the production outcome and available integration identity.
2. Record compatibility, deterministic, deployment, and human evidence.
3. Identify factory, harness, and architecture evolution included because the
   slice established and verified its concrete need.
4. State accepted carry-forwards and work remaining on the branch.

## Required Close Content

1. Name the branch outcomes and whether each shipped or was stopped.
2. Record compatibility, deterministic, deployment, and human evidence.
3. Separate what worked from what failed or created unnecessary cost.
4. State root causes rather than only symptoms.
5. Record each candidate action as accepted, deferred, or rejected.
6. Carry only accepted actions into another plan.
7. State remaining assumptions and the next production problem, if known.
8. Remove or reconcile stale statements in current context and open gates.

## Compound Rules

- A finding is evidence, not automatic scope.
- Prefer correcting an existing artifact over creating another process layer.
- Add automation only after a concrete repeated or release-significant failure.
- Keep work on the shortest path to a visible production outcome.
- Deferred work stays deferred until new evidence or a human decision changes
  its status.
- Keep rejected proposals visible so they are not repeatedly rediscovered.
