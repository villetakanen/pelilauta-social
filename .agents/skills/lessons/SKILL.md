---
name: lessons
description: Maintain a Pelilauta feature branch's continuous lessons, delivered-slice evidence, decisions, and human-gated compound actions across multiple merges through branch close.
---

# Lessons And Compound Loop

Follow `docs/practices/lessons.md`.

## Procedure

1. Read `docs/lessons/<branch-name>.md` before work. Create it if this is the
   branch's first meaningful task. A feature branch may deliver multiple slices
   to `main` while this file remains active.
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
8. For each delivered slice, record its available integration identity,
   outcome, verification, human evidence, accepted carry-forwards, and remaining
   branch work. A merge cannot contain its own resulting SHA: record the pull
   request and source head before integration, then reconcile the merge identity
   during later integrated work when useful. Do not mistake slice acceptance
   for branch close or create bookkeeping-only merges.
9. Link accepted actions from the next applicable slice or plan. Do not copy
   deferred or rejected work into active scope.
10. At branch close or a stop decision, reconcile stale current-state and open-
    gate sections, then finalize outcomes, evidence, root causes, compound
    decisions, remaining assumptions, and the next named production problem in
    the same lessons file.
