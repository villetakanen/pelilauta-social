# Lessons And Compounding

`docs/lessons/` is a list of things we might want to take into account the next time
we change the harness. One file per note. It is not a work queue, a status board, or
agent memory, and nothing may depend on it.

Two skills use it. `lesson` writes a note. `retro` looks at the harness alongside the
notes and promotes actionable change concepts.

## Invariants

- **Write it only if it needs the owner.** A problem an agent may simply fix gets
  fixed in the slice; it does not become a file. Notes are for what crosses an
  approval boundary in `AGENTS.md` — the contract, a skill, a template, a
  dependency, a new directory.
- **The commit message is the permanent record.** Commit a note with its reasoning in
  the message body so that deleting the file later costs nothing. Git history is the
  archive; the list is scaffolding.
- **Anyone may delete any note at any time.** A human who thinks a note is incidental
  or not worth keeping should delete it — no justification, no ceremony. Nothing in
  the list needs to survive branch close, and a note worth keeping is promoted out to
  a plan, spec, or ADR first, which is the owner's decision.
- **A note names one instance and proposes one change.** Give the file and the line.
  The **Fix** must be something a person can do and then be done with, not a rule to
  follow. If the Fix cannot be written as a diff, do not file it — let the problem
  recur, because a second occurrence usually names itself.

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

**Suspected why:** one sentence. A guess, not a verdict — `retro` finds root
cause with more evidence.

**Fix:** the smallest change worth considering.
```

Four short paragraphs. A file that explains itself is the wrong shape.

## Rules

- A note is evidence, not automatic scope.
- Do not create a destination merely because a note exists.

Specs, guides, code, tests, skills, workflows, and runbooks must remain complete
when there are no notes.
