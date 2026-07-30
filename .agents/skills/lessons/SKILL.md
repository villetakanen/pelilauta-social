---
name: lessons
description: Assess Pelilauta lesson candidates, apply justified improvements, and discard invalid, obsolete, or one-off signals.
---

# Lessons And Compound Loop

Follow `docs/practices/lessons.md`.

## Procedure

1. Read `docs/lessons/<branch-name>.md` when it exists. Do not create a lessons
   file merely to hold branch context, delivery evidence, or task state. Every
   lessons file is optional; humans may delete it.
2. Add an entry only for surprising evidence with a plausible reusable
   consequence. Record evidence, assessment, a possible change, and disposition.
   A candidate does not need a permanent destination.
3. Test the signal before generalizing it. If the relevant artifact can be
   corrected immediately, do that instead of growing the queue.
4. Ask the human owner to accept, defer, or reject decisions at the boundaries
   named in `AGENTS.md`.
5. Apply an accepted change directly to the relevant project artifact. Do not
   expand another slice with an optional improvement without human approval.
6. Discard candidates when no project change is justified. Delete resolved
   entries unless the human owner wants a compact historical record.
7. Keep a deferred candidate only with concrete evidence or a future condition
   that should trigger reconsideration.
8. Run compound passes whenever useful and before branch close: assess each
   signal, apply accepted changes, and remove debris.

PR identities, checks, review transcripts, delivered-slice indexes, current
objectives, remaining work, and next tasks belong to their existing operational
owners, never to the lessons log.

Never make a spec, plan, skill, test, runbook, or implementation depend on a
lessons log. The project must remain operable when all historical logs are gone.
