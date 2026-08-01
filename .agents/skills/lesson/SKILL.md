---
name: lesson
description: Note one thing we might want to take into account the next time we change the Pelilauta harness. Use retro to look at the harness alongside these notes.
---

# Write A Lesson Note

Shape and invariants: `docs/practices/lessons.md`. This skill only writes a note. It
never assesses, applies, or acts — that is `retro`.

## Before writing anything

1. Can this be fixed now, inside the current pull request, without crossing an approval
   boundary in `AGENTS.md`? Then fix it. Do not write a file.
2. Would we want to know this the next time we change the harness — the contract, a
   skill, a template, a workflow, the site's architecture? Then write it down.
3. Is it task state, check output, PR history, current objectives, remaining work, or
   an already-fixed defect? Then do not write it down.

## Writing

4. One note, one new file: `docs/lessons/<slug>.md`, with the frontmatter and four
   fields the practice guide defines. Four short paragraphs.
5. Name one instance, with the file and the line. A note about a category rather than
   a case cannot be acted on, and each reader fills the category with different
   examples.
6. Write the **Fix** as a change someone can make and mark done — not a rule to
   follow. If you cannot state it as a diff, do not file the note. Let the problem
   recur; a second occurrence usually names itself.
7. Keep `**Suspected why:**` to one sentence, phrased as a guess. Do not reason it
   into a verdict; capture is cheap and low-confidence by design.
8. Commit the file with its reasoning in the message body. The message is the
   permanent record; the file is disposable.

Never make a spec, plan, skill, test, runbook, or implementation depend on a note.
The project must remain operable when there are none.
