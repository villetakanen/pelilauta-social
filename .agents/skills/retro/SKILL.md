---
name: retro
description: Close a Pelilauta delivery loop with evidence, root causes, human-gated compound decisions, and a bounded handoff to the next production outcome.
---

# Retrospective And Compound Loop

Follow `docs/practices/retrospectives.md`.

## Procedure

1. Read the delivery plan, spec, final diff, commit history, check results, human
   acceptance, deployment evidence, and prior retrospective that shaped the
   loop.
2. Write or update `docs/retros/<branch-name>-retro.md`.
3. Lead with the actual production outcome, including failure or non-delivery.
4. Separate observed facts, root-cause interpretation, and proposed action.
5. Propose the smallest durable destination for each useful lesson. Prefer
   editing an existing contract over creating another artifact.
6. Ask the human owner to accept, defer, or reject every proposed writeback.
7. Implement only accepted writebacks, preferably as separate reversible
   commits.
8. Link accepted actions from the next plan. Do not copy deferred or rejected
   work into active scope.
9. Close with remaining compatibility assumptions and the next named production
   problem.
