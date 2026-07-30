# Lessons And Compounding

`docs/lessons/` is a decision inbox: one file per finding that needs a human
decision, held until the owner is present to make it. It is not memory, not
evidence, not history, and never required context.

Two skills use it. `lesson` writes a finding. `retro` mines the inbox, applies
what is justified, and empties it.

## Invariants

- **File it only if it needs the owner.** A problem an agent may simply fix gets
  fixed in the slice; it does not become a file. Findings enter the inbox when
  acting on them crosses an approval boundary in `AGENTS.md` — the contract, a
  skill, a template, a dependency, a new directory.
- **The commit message is the permanent record.** Commit a finding with its
  reasoning in the message body so that deleting the file later costs nothing.
  Git history is the archive; the inbox is scaffolding. Keep no in-tree log,
  index, count, or compacted history table.
- **Nothing in the inbox needs to survive branch close.** The owner may delete
  the whole directory at any time. A finding worth keeping is promoted out to a
  plan, spec, or ADR first — promotion is the owner's decision, not an agent's.
- **Findings are never merged.** Two that look like facets of one cause stay as
  sibling files and link by slug. `retro` merges them if it is right; premature
  consolidation has already hidden a recurring failure in this project.

## File Shape

`docs/lessons/<slug>.md`:

```markdown
---
name: <slug matching the filename>
branch: <branch that produced it>
date: <YYYY-MM-DD>
trigger: <only when deferred: the concrete condition for reconsideration>
---

**Context:** the situation, in a sentence or two.

**What happened:** the observation, naming commits, files, or costs.

**Suspected why:** one sentence. A guess, not a verdict — `retro` finds root
cause with more evidence.

**Fix:** the smallest change worth considering.
```

Four short paragraphs. No count, no index, no revision history, no narration of
how the inbox changed. A file that explains itself is the wrong shape.

A `trigger` marks the finding as deferred by the owner. Its absence means open.
There is no other state: applied and discarded both mean deleted.

## Rules

- A finding is evidence, not automatic scope.
- Persistence is a decision, not the default.
- Do not create a destination merely because a finding exists.
- When a rule turns out to be false, the first candidate fix is removing it.
- Add automation only after a concrete repeated or release-significant failure.

Specs, guides, code, tests, skills, workflows, and runbooks must remain complete
when the inbox is empty.
