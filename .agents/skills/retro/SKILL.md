---
name: retro
description: Synthesize the Pelilauta harness, all notes in docs/lessons/, and prior lesson-driven changes when the operator requests a retrospective or a review of accumulated findings. Do not use for a focused correction to a named harness artifact.
---

# Retro And Compound Mining

Shape and invariants: `docs/practices/lessons.md`. Run this when the operator asks
to relate accumulated findings to the harness. A focused correction to a named
contract, skill, template, or workflow is ordinary harness work. The notes are input
to a retrospective, not a queue to be cleared.

## Look

1. Read all the notes at once. They were written at low confidence and in isolation;
   reading them together reveals what none of them could say alone.
2. Look for one cause behind several notes — state it as a claim about the set, and
   do not delete the members on the strength of it.
3. Search history for prior instances: `git log --grep=lessons`, and the durable
   artifacts a past pass changed. The commit body is the archive, so a recurrence
   from an earlier cycle is recoverable only by looking. This is the step that finds
   a countermeasure written months ago and never adopted.
4. Correct each `**Suspected why:**` that the set or the history contradicts. A
   confident wrong cause is the failure mode this pass is meant to catch.

## Decide with the owner

5. Present the change concepts, each with a recommendation and its cost. Every one
   crosses an approval boundary — that is why the note exists rather than a fix.
6. When a rule turns out to be false, propose removing it before proposing a caveat
   or a check. Additive fixes to a false rule have twice been wrong.
7. Do not enforce a working practice in CI without confirming it is the target state
   rather than the present arrangement.

## Act

8. Apply an accepted change directly to the relevant code, test, spec, guide, skill,
   runbook, or workflow. Prefer correcting an existing artifact over adding a process
   layer.
9. Delete the note. Applied and discarded both end in deletion; git retains the
   reasoning. Promote a note the operator wants to keep to a plan, spec, or ADR
   first. Ask for that decision, and never invent a destination.

An accepted pass may change harness artifacts and delete resolved notes. Commit only
on explicit operator instruction. The pass never produces a summary file, an index,
a history table, or a report artifact — all of those get deleted, so writing them is
pure cost. It does not block unrelated delivery, and it does not need to leave the
list empty.
