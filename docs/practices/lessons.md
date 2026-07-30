# Lessons And Compounding

A branch may keep `docs/lessons/<branch-name>.md`, replacing `/` with `-`, when
work produces a surprising observation that might improve later work. The file
is an optional candidate queue, not branch memory, delivery evidence, required
context, or a behavioral contract. Humans may delete it at any time.

Compounding means assessing candidate learnings and changing the project when a
change is justified. It does not mean preserving every observation.

## Candidate Shape

An active candidate contains only:

1. **Evidence:** what was observed.
2. **Assessment:** whether the signal is valid, repeated or consequential, and
   what alternative explanations were considered.
3. **Possible change:** the smallest useful change, if one exists.
4. **Disposition:** proposed, accepted, deferred, applied, or discarded,
   including the human decision when required by `AGENTS.md`.

A candidate does not need a permanent destination. One-off operational evidence,
task state, check output, PR history, and already-fixed defects normally do not
belong in the queue. If assessment shows that nothing should change, discard the
candidate instead of inventing a policy, guide, check, or follow-up task.

## Compound Loop

1. Read the branch queue when one exists; do not create an empty one.
2. Add a candidate only when evidence plausibly changes future implementation,
   verification, architecture, or working practice.
3. Test the signal before generalizing it. A useful tactic in one incident is
   not automatically a reusable lesson.
4. Ask the human owner to decide changes at the approval boundaries in
   `AGENTS.md`.
5. Apply an accepted change directly to the relevant code, test, spec, guide,
   skill, runbook, or workflow. Prefer correcting an existing artifact over
   creating another process layer.
6. Delete applied, invalid, obsolete, and one-off candidates unless the human
   owner wants a compact historical record.
7. Keep a deferred candidate only when it names concrete evidence or a future
   condition that should trigger reconsideration.

Run a compound pass whenever the queue contains useful candidates and before
closing its branch. The pass assesses each signal, applies accepted changes,
and removes debris. It does not block unrelated delivery merely because a
candidate remains undecided.

## Optional History

When the human owner wants to retain what happened, compact resolved entries to:

| Lesson | Disposition | Result |
| --- | --- | --- |
| Reusable behavior change in one sentence | Applied, deferred, or discarded | Changed artifact, reconsideration trigger, or `None` |

Historical logs remain optional and must never be required context. Specs,
guides, code, tests, skills, workflows, and runbooks must remain complete when
all lesson logs are absent.

## Rules

- A finding is evidence, not automatic scope.
- Persistence is a decision, not the default.
- Do not create a destination merely because a candidate exists.
- Add automation only after a concrete repeated or release-significant failure.
- Keep work on the shortest path to a visible production outcome.
