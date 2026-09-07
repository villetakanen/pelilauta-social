---
name: next-task
description: Propose the smallest deliverable increment that creates useful value within the active Pelilauta epic or an explicitly requested improvement scope. Use when asked what to do next or to propose the next task.
---

# Next Task

Find the smallest change worth delivering next. Value may accrue to application
users, developers, documentation readers, or agents working through the harness.
A smaller diff is not necessarily a smaller useful increment.

## Establish the basis

Read the named epic. If none is named, identify it from the active branch and
open GitHub issues labeled `epic`. When the operator explicitly names a different
improvement scope, use that scope rather than assigning it to an unrelated epic.

Inspect the implementation, governing specs, and relevant documentation. Inspect
v18 behavior and v20 presentation when the candidate changes a migrated surface.
Identify what becomes possible, clearer, more reliable, or less costly after the
change ships.

Treat the epic's Possible work entries as candidates. Consider discoveries within
its goal and success criteria; do not assume every entry is necessary or correctly
sized.

## Find the increment

Compare plausible candidates internally. Choose one that:

- Creates a concrete benefit when delivered.
- Requires no later task to make that benefit usable.
- Includes the implementation, adoption, documentation, and evidence necessary
  for its outcome.
- Excludes improvements that can ship independently.
- Fits the epic or the operator's stated scope.

Prefer the smallest useful outcome that resolves a current need or enables
valuable subsequent work. Include supporting changes when the outcome depends
on them.

A documentation correction, a clarified spec, or a repaired skill can constitute
a complete increment. Name who benefits and what changes for them.

## Check readiness

Before proposing implementation, establish that the specs required to govern the
intended work are live. Apply `AGENTS.md`'s rules for when a spec is required;
do not invent a spec requirement for every task.

If a required spec is missing or proposed, consider making its completion and
operator clearance the next increment. Name the intent or decision it must
establish and the work that decision enables.

Starting from live specs does not freeze them. A task may uncover errors,
missing constraints, or better implementation choices. Amend specs during the
task through the workflow in `AGENTS.md`. The possibility of learning is not a
reason to reject a candidate or demand advance approval of implementation details.

Distinguish an unsettled starting objective from a detail the work can resolve.

## Explain the proposal

Write for a technically experienced operator deciding what to implement next.
Use a descriptive title and roughly 10–15 lines of concrete technical prose.
Use paragraphs or a short list where they help; no mandatory response labels.

Lead with the actual change: what is added, removed, or changed, and where.
Name relevant files, components, commands, interfaces, or behaviors.
Describe the resulting behavior precisely enough to distinguish this task
from neighboring work.

Connect the proposal to the source evidence: the current implementation,
an observed failure, a governing spec, or an epic requirement. Explain why
this is the next useful increment through that concrete relationship.

Include the essential implementation boundary and how completion can be
verified. Mention dependencies, compatibility concerns, or unresolved decisions
only when they affect execution. State what needs settling before starting
and what the task itself can resolve.

Do not substitute phrases such as “improve consistency,” “align the contract,”
or “ensure robustness” for the exact change. Do not spend lines announcing
value or risk that the technical description already demonstrates.

The proposal should contain enough technical detail to accept or correct its
scope without requiring another turn to discover what work is being proposed.

## Boundary

Propose one increment. Do not edit the epic, amend specs, or begin implementation
unless the operator also requests that work.
