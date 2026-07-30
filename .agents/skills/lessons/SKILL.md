---
name: lessons
description: Assess Pelilauta lesson candidates, apply justified improvements, and discard invalid, obsolete, or one-off signals.
---

# Lessons And Compound Loop

Follow `docs/practices/lessons.md`. One finding, one file:
`docs/lessons/<slug>.md`, with the frontmatter and four fields that guide
defines.

## Capturing

1. Write a file only for an observation with a plausible reusable consequence.
2. Keep `**Suspected why:**` a guess. Do not reason it into a verdict at capture
   time; a retro pass finds the root cause with more evidence.
3. Never merge a finding into an existing file, and never rewrite the queue to
   accommodate one. Facets of a suspected common cause stay as sibling files.
4. If the relevant artifact can be corrected immediately, do that instead of
   writing a file.

## Assessing

5. Read the queue and look for repeated failure shapes across files.
6. Ask the human owner to accept, defer, or reject at the boundaries named in
   `AGENTS.md`.
7. Apply an accepted change directly to the relevant project artifact. Do not
   expand an unrelated slice with an optional improvement without approval.
8. Set `status: applied` and delete the file; discard files where no project
   change is justified. Keep `status: deferred` only with a concrete `trigger`.
9. Run a pass whenever useful and before branch close.

PR identities, checks, review transcripts, delivered-slice indexes, current
objectives, remaining work, and next tasks belong to their existing operational
owners, never to this queue.

Never make a spec, plan, skill, test, runbook, or implementation depend on a
lesson file. The project must remain operable when the queue is empty.
