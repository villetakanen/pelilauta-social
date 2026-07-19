# Delivery Retrospectives And Compound Decisions

A retrospective closes one delivery loop. It explains the observed outcome,
why the loop produced it, and which lessons are worth carrying forward. It is
not a second plan and does not authorize follow-up work by itself.

## Timing

Write or finalize the retrospective after deterministic and human acceptance
and before declaring the loop closed. Update release evidence after merge,
deployment, or tagging when those events are part of the outcome.

## Required Content

1. Name the production outcome and whether it shipped.
2. Record evidence for compatibility, verification, and human acceptance.
3. Separate what worked from what failed or created unnecessary cost.
4. State root causes rather than only symptoms.
5. List candidate writebacks with a proposed durable destination.
6. Record the human decision for every candidate: accept, defer, or reject.
7. Carry only accepted work into a plan, with an explicit scope boundary.
8. State the close decision and the next production problem, if one is known.

## Compound Rules

- A finding is evidence, not automatic scope.
- Prefer a correction to an existing artifact over a new process artifact.
- Add automation only after a concrete repeated or release-significant failure.
- Keep product work on the shortest path to a visible production outcome.
- Do not turn a retrospective into a backlog dump. Deferred work stays deferred
  until a later failure or human decision makes it relevant.
- Rejected actions remain recorded so the same proposal is not rediscovered as
  if it had never been considered.
- The next plan links the retrospective decisions it actually adopts.

## Location

Use `docs/retros/<branch-name>-retro.md`, replacing `/` with `-`. Durable intent
belongs in `specs/`; execution belongs in `plans/`; operational procedure belongs
in `docs/runbooks/` or a small skill.
