# Lessons Compounding Log

A branch may maintain `docs/lessons/<branch-name>.md`, replacing `/` with `-`.
Create one only when work produces a plausible reusable lesson that does not
already have a durable owner.

Lessons logs are explicitly non-durable. Humans may retain, compact, archive, or
delete historical logs at any time. Agents must tolerate their absence and must
not use them as required context, provenance, or a behavioral contract.

The file is not branch memory. It does not record scope, task state, delivery
history, PR identities, checks, review findings, product decisions already
captured in a spec, or information needed merely to resume implementation.
Plans own planned work, specs own behavior, PRs and Git own delivery evidence,
and task tooling owns execution state.

## Active Candidate Shape

Each entry contains only:

1. **Evidence:** the surprising observation or failure.
2. **Root cause:** why it happened, separated from the observation.
3. **Candidate lesson:** the reusable change to future behavior.
4. **Durable owner:** the existing spec, practice, skill, test, runbook, plan, or
   implementation contract that should change.
5. **Disposition:** proposed, accepted, deferred, rejected, or written back,
   including the human decision when one is required.

If an observation has no generalizable consequence, it is not a lesson entry.
If its owner can be corrected immediately, make that correction instead of
creating an entry.

## Compacted Lesson Shape

After disposition or writeback, replace the detailed candidate with one minimal
record:

| Lesson | Disposition | Durable owner |
| --- | --- | --- |
| Reusable behavior change in one sentence | Applied, deferred, rejected, or ignored | Owning artifact, or `None` |

The optional compact record preserves what was learned and what happened to it.
It does not preserve evidence transcripts, chronology, delivery status, or
enough detail to compete with the durable owner.

## Compound Loop

1. Read active candidates when the file exists. Do not create an empty branch
   record.
2. Add a candidate when evidence reveals a reusable gap in project behavior,
   tooling, harness, architecture, or working practice.
3. Propose the smallest durable owner. Prefer correcting an existing artifact
   over creating another process layer.
4. Ask the human owner to accept, defer, or reject scope-changing, product,
   compatibility, dependency, data, release, or process decisions.
5. Implement an accepted writeback in the slice that establishes and requires
   it. A non-required writeback may remain queued for a later compound pass with
   explicit human deferral, or ship in an explicitly approved, timeboxed
   consumer-free compound slice, including at branch close.
6. Keep the entry until its durable writeback is included in the intended
   integration delta. Compact it to the minimal resolved format in that same
   delta.
7. For deferred, rejected, or ignored candidates, record the decision in a
   durable owner only when future rediscovery matters, then compact the entry.

Compound whenever the queue has useful accepted work. Waiting until branch
close is allowed, but not required. Crossing 150 lines or 12 KiB is a mandatory
disposition-and-compaction gate before adding more entries: write back accepted
candidates, explicitly defer them with a durable owner, record human rejection,
or mark a candidate ignored when evidence disproves its reusable premise.

## Integration And Close

- Before integrating a slice, resolve candidates that affect its correctness.
  Required accepted writebacks belong in that same slice.
- Delivery evidence and review dispositions stay in the PR or their owning
  spec/plan; only a generalizable lesson candidate enters this queue.
- Before the branch's final production integration, run a compound pass: give
  every proposed candidate a disposition, write back accepted candidates, move
  genuinely deferred work to its durable owner, and compact every resolved
  candidate to the minimal log. Later release work appends candidates only when
  it discovers a new reusable lesson.
- At a stop decision, give proposed candidates a disposition and hand off
  unresolved accepted or deferred work to an approved durable owner, then
  compact the file.
- Specs, practices, plans, tests, skills, and runbooks must remain complete when
  every lessons log is absent. They must not cite a log as their source of truth.

## Compound Rules

- A finding is evidence, not automatic scope.
- Retaining detailed candidate text is not compounding; changing the durable
  owner and compacting the entry is.
- Add automation only after a concrete repeated or release-significant failure.
- Keep work on the shortest path to a visible production outcome.
- Never preserve enough detail for another agent to reconstruct branch
  chronology from the compact log.
- Never infer that a historical log still exists; discover it opportunistically.
