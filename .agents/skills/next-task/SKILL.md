---
name: next-task
description: Briefly propose the next small, contained, atomic, deliverable and releasable task from a Pelilauta epic, with the fastest value first. Use when asked what to do next, to propose the next task from an epic, or to slice an epic into its next release-sized outcome.
---

# Next Task

Read the named epic. If none is named, identify the active epic from the current
branch and `plans/`. Inspect only the contracts, specs and source needed to understand
its current state.

Choose exactly one task. Prefer the smallest vertical slice that produces observable,
verifiable value and can ship on its own. Account internally for its necessary spec,
implementation, tests, migration and documentation; do not expose that delivery plan
before the task is accepted. Prefer existing paths and settled decisions over new
infrastructure.

Make the slice complete where its value is expected. When design-system work is meant
for Pelilauta, include enough Pelilauta adoption for the result to be useful there. Do
not propose only the underlying styles, component, spec or book and leave their first
real use for a later task.

Reject a candidate that:

- needs a later task before it is useful, verifiable or safe to release;
- bundles an independent outcome;
- changes behaviour outside the epic;
- is cleanup or scaffolding that can wait until after the first useful slice.

Answer in at most 100 words and exactly these three fields:

- **Next:** one plain-language sentence naming the complete outcome and where it appears.
- **Includes:** one or two sentences naming the observable behaviour, main affected
  surfaces or a useful count, and any important behaviour that stays unchanged.
- **Later:** one sentence naming the closest adjacent work left for later.

Do not list files, call sites, commands, tests, implementation steps or acceptance
criteria. Write for someone deciding whether the result is worth doing, not for its
implementer. Avoid architecture and process jargon such as capability, entry point,
migration, or which layer controls the result when plain product language says what
changes. Do not add an introduction, conclusion, justification section or alternative
candidate.

Do not edit the epic, create task files, or begin implementation unless explicitly
requested.
