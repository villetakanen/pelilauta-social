# Lessons And Compounding

`docs/lessons/` is a list of findings from the work: issues, blockers, errors and
openings for improvement in the harness, the context or the ways of working. One file
per note. It is not a work queue, a status board, or agent memory, and nothing may
depend on it.

Two skills use it. `lesson` writes a note. `retro` looks at the harness alongside the
notes and promotes actionable change concepts.

## Invariants

- **A note records what happened.** The finding as it occurred is the value. Task
  state, check output, PR history and remaining work are not findings.
- **Nobody is a suspect.** The agent, the model and the operator are not where an
  issue comes from. Expect the harness, the context or the prompt, and record no blame.
- **A note names one instance.** Give the file and the line. A guess at the cause is
  one sentence. A root-cause chain goes in only when the operator asks for it; `retro`
  finds cause with more evidence.
- **A note stands alone.** Do not compare it with earlier notes or search history for
  the same finding. `retro` does that.
- **The commit message is the permanent record.** A note is committed with its
  reasoning in the message body when the operator asks, so that deleting the file later
  costs nothing. Git history is the archive; the list is scaffolding.
- **Anyone may delete any note at any time.** A human who thinks a note is incidental
  or not worth keeping should delete it — no justification, no ceremony. Nothing in
  the list needs to survive branch close, and a note worth keeping is promoted out to
  a plan, spec, or ADR first — the owner decides that.

## File Shape

`docs/lessons/<slug>.md`:

```markdown
---
name: <slug matching the filename>
branch: <branch that produced it>
date: <YYYY-MM-DD>
---

**Context:** the situation, in a sentence or two.

**What happened:** the observation, naming commits, files, or costs.

**Suspected why:** one sentence, a guess. Omit it when no guess is visible.

**Fix:** the smallest change worth considering. Omit it when none is visible.
```

Four short paragraphs at most. A file that explains itself is the wrong shape.

## Rules

- A note is evidence, not automatic scope.
- Do not create a destination merely because a note exists.

Specs, guides, code, tests, skills, workflows, and runbooks must remain complete
when there are no notes.
