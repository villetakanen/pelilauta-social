---
name: lesson
description: Write one Pelilauta lesson finding to the decision inbox when acting on it would need the human owner. Use retro to assess, apply, or empty the inbox.
---

# Write A Lesson Finding

Shape and invariants: `docs/practices/lessons.md`. This skill only captures. It
never assesses, applies, deletes, or reorganises — that is `retro`.

## Before writing anything

1. Can this be fixed now, inside the current slice, without crossing an approval
   boundary in `AGENTS.md`? Then fix it. Do not write a file.
2. Does acting on it touch the contract, a skill, a template, a dependency, a
   public URL, persisted data, or a new directory? Then it needs the owner, and
   it belongs in the inbox.
3. Is it task state, check output, PR history, current objectives, remaining
   work, or an already-fixed defect? Then it belongs to its existing operational
   owner, not here.

## Writing

4. One finding, one new file: `docs/lessons/<slug>.md`, with the frontmatter and
   four fields the practice guide defines. Four short paragraphs.
5. Keep `**Suspected why:**` to one sentence, phrased as a guess. Do not reason
   it into a verdict; capture is cheap and low-confidence by design.
6. Never edit or absorb an existing finding to accommodate a new one, and never
   rewrite the inbox. If a sibling looks related, link it by slug and leave it
   alone.
7. Commit the file with its reasoning in the message body. The message is the
   permanent record; the file is disposable.

Set `trigger:` only to record a deferral the owner has already decided. Never
mark a finding deferred on your own judgment.

Never make a spec, plan, skill, test, runbook, or implementation depend on a
finding. The project must remain operable when the inbox is empty.
