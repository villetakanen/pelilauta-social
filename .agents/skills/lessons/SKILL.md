---
name: lessons
description: Collect reusable Pelilauta lesson candidates, promote accepted lessons into durable owners, and compact resolved candidates to a minimal lessons-learned log.
---

# Lessons And Compound Loop

Follow `docs/practices/lessons.md`.

## Procedure

1. Read `docs/lessons/<branch-name>.md` when it exists. Do not create a lessons
   file merely to hold branch context, delivery evidence, or task state. Treat
   every lessons file as optional and non-durable; humans may delete it.
2. Add an entry only for surprising evidence with a plausible reusable
   consequence. Record evidence, root cause, candidate lesson, durable owner,
   and disposition.
3. If the owner can be corrected immediately, update it instead of growing the
   queue.
4. Ask the human owner to accept, defer, or reject decisions at the boundaries
   named in `AGENTS.md`.
5. Implement an accepted writeback in the establishing slice when its outcome
   or trustworthy verification requires it. Otherwise retain it for a later
   compound pass or an explicitly approved, timeboxed consumer-free compound
   slice; do not expand another slice without approval.
6. Keep each detailed entry until its durable owner and the entry's compaction
   are together in the intended integration delta. Replace it with one minimal
   `lesson / disposition / durable owner` record.
7. Run compound passes whenever useful and before the branch's final production
   integration. At 150 lines or 12 KiB, stop adding entries and give each a
   disposition: write back, explicitly defer to a durable owner, record human
   rejection, or mark it ignored when evidence disproves its reusable premise.
8. At branch close or a stop decision, disposition every proposed candidate,
   move unresolved accepted or deferred work to an approved durable owner, and
   compact resolved candidates. Keep only the minimal lessons-learned log.

PR identities, checks, review transcripts, delivered-slice indexes, current
objectives, remaining work, and next tasks belong to their existing operational
owners, never to the lessons log.

Never make a spec, plan, skill, test, runbook, or implementation depend on a
lessons log. The project must remain operable when all historical logs are gone.
