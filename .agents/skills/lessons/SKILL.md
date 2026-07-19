---
name: lessons
description: Maintain a Pelilauta delivery cycle's continuous lessons, evidence, decisions, and human-gated compound actions from first work through close.
---

# Lessons And Compound Loop

Follow `docs/practices/lessons.md`.

## Procedure

1. Read `docs/lessons/<branch-name>.md` before work. Create it if this is the
   branch's first meaningful task.
2. Update it during the task whenever evidence changes future reasoning. Do not
   wait for cycle close or a separate prompt.
3. Separate observed facts, root-cause interpretation, and proposed action.
4. Record current outcome evidence, open gates, accepted decisions, deferred
   work, and rejected proposals in the same file.
5. Propose the smallest durable destination for each useful lesson. Prefer
   editing an existing contract over creating another artifact.
6. Ask the human owner to accept, defer, or reject every proposed writeback.
7. Implement only accepted writebacks, preferably as separate reversible
   commits.
8. Link accepted actions from the next plan. Do not copy deferred or rejected
   work into active scope.
9. At acceptance or a stop decision, finalize the outcome, evidence, root
   causes, compound decisions, remaining assumptions, and next named production
   problem in the same lessons file.
