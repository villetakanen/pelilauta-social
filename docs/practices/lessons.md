# Lessons And Compounding

A finding worth considering a fix gets its own file: `docs/lessons/<slug>.md`.
One finding, one file. The directory is a flat, optional candidate queue — not
branch memory, delivery evidence, required context, or a behavioral contract.
Humans may delete any file at any time.

Compounding means assessing candidates and changing the project when a change is
justified. It does not mean preserving every observation.

## File Shape

```markdown
---
name: <slug matching the filename>
branch: <branch that produced it>
date: <YYYY-MM-DD>
status: proposed | deferred | applied | discarded
trigger: <only when deferred: the concrete condition for reconsideration>
---

**Context:** the situation, in one or two sentences.

**What happened:** the observation, with commits, files, or costs named.

**Suspected why:** the naive reason. A guess, not a verdict — a retro or review
pass finds the root cause later.

**Fix:** the smallest change worth considering, for a retro pass to weigh.
```

Nothing else belongs in the file. No count, no index, no header, no revision
history, no narration of how the queue changed. If a file needs to explain
itself, it is the wrong shape.

## Capture

Write a file when an observation plausibly changes future implementation,
verification, architecture, or working practice. Capture is cheap, so write it
at low confidence rather than reasoning it into a conclusion at capture time.

Do not write one for task state, check output, PR history, current objectives,
remaining work, or an already-fixed defect. Those belong to their existing
operational owners.

Do not merge a new finding into an existing file. Two findings that look like
facets of one cause stay separate; a retro pass merges them if it is right, and
premature consolidation has already hidden a recurring failure in this project.
Write a sibling file and link it by slug.

If the relevant artifact can simply be corrected now, do that instead of writing
a file.

## Compound Pass

Run a pass whenever the queue holds useful candidates, and before closing a
branch.

1. Read the queue. Recurrence is visible by reading siblings — files describing
   the same failure shape are the signal that it is real.
2. Test each signal before generalizing it. A useful tactic in one incident is
   not automatically a reusable lesson.
3. Ask the human owner to decide at the approval boundaries in `AGENTS.md`.
4. Apply an accepted change directly to the relevant code, test, spec, guide,
   skill, runbook, or workflow. Prefer correcting an existing artifact over
   creating another process layer.
5. Delete applied, invalid, obsolete, and one-off files. Deletion is the normal
   end state; git history retains them.
6. Keep a `deferred` file only with a concrete `trigger`.

A pass edits and deletes individual files. It does not rewrite the queue.

## Rules

- A finding is evidence, not automatic scope.
- Persistence is a decision, not the default.
- Do not create a destination merely because a candidate exists.
- Add automation only after a concrete repeated or release-significant failure.
- Keep work on the shortest path to a visible production outcome.

Specs, guides, code, tests, skills, workflows, and runbooks must remain complete
when the entire queue is absent.
