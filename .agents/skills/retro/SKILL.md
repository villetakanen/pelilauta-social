---
name: retro
description: Mine the Pelilauta lesson inbox with the human owner — find recurrence and root cause, apply justified changes, and empty it. Use lesson to capture a finding.
---

# Retro And Compound Mining

Shape and invariants: `docs/practices/lessons.md`. Run this whenever the inbox
holds decidable findings, and before closing a branch.

## Mine

1. Read the whole inbox at once. Findings were captured at low confidence and in
   isolation; the pass exists because reading them together reveals what none of
   them could say alone.
2. Look for one cause behind several findings — but state it as a claim about the
   set, and do not delete the members. Premature consolidation has already hidden
   a recurring failure here.
3. Search history for prior instances: `git log --grep=lessons`, and the
   durable artifacts a past pass changed. The commit body is the archive, so a
   recurrence from an earlier cycle is recoverable only by looking.
4. Correct each `**Suspected why:**` that the set or the history contradicts. A
   confident wrong cause is the failure mode this pass is meant to catch.

## Decide with the owner

5. Present findings for decision, with a recommendation and its cost. Every
   change here crosses an approval boundary — that is why the finding exists.
6. When a rule turns out to be false, propose removing it before proposing a
   caveat or a check. Additive fixes to a false rule have twice been wrong.
7. Do not enforce a working practice in CI without confirming it is the target
   state rather than the present arrangement.

## Empty

8. Apply an accepted change directly to the relevant code, test, spec, guide,
   skill, runbook, or workflow, and commit it with the reasoning in the message
   body. Prefer correcting an existing artifact over adding a process layer.
9. Delete the file. Applied and discarded both end in deletion; git retains the
   reasoning.
10. A finding the owner wants to keep is promoted out to a plan, spec, or ADR
    first. Ask for that decision — never promote, and never invent a destination,
    on your own judgment.
11. Leave a deferred finding in place only with the owner's concrete `trigger`.

The pass produces commits and deletions. It never produces a summary file, an
index, a history table, or a report artifact — all of those get deleted, so
writing them is pure cost. It does not block unrelated delivery because a finding
remains undecided.
