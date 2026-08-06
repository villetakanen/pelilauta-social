---
name: next-task
description: Briefly propose the next small, contained, atomic, deliverable and releasable task from a Pelilauta epic, with the fastest value first. Use when asked what to do next, to propose the next task from an epic, or to slice an epic into its next release-sized outcome.
---

# Next Task

Read the named epic. If none is named, identify the active epic from the current
branch and `plans/`. Read every Open item, the domain's parent spec, the existing
specs for candidate capabilities, and v20's implementation and books for the
surfaces in question.

Treat an Open item that declares a capability boundary or contract undecided as a
valid task. Do not answer it implicitly by selecting an implementation first.

Do not treat Known scope as closed. A task may split an Open item or name newly
discovered work absent from the plan when that work is necessary to the epic's Goal
or Success criterion. Reject work outside the epic's Goal.

Choose exactly one task. Prefer the smallest vertical slice that produces observable,
verifiable value and can ship on its own. Check the relevant specs before proposing
implementation. If a required spec is missing, or the work needs a substantive change
to its intent, propose completing and approving that spec first.

A minor clarification or correction to an existing spec, including one needed by a
bug fix, may stay inside the delivery slice. The slice must present the amendment to
the spec approver and receive approval before continuing with work that relies on it.
Account internally for its spec changes, implementation, tests, migration and
documentation; do not expose that delivery plan before the task is accepted. Prefer
existing paths and settled decisions over new infrastructure.

Make the slice complete where its value is expected. When design-system work is meant
for Pelilauta, include enough Pelilauta adoption for the result to be useful there. Do
not propose only the underlying styles, component or book and leave their first real
use for a later task. A missing or substantively incomplete spec is a complete task
when implementation cannot begin without settling its intent.

Reject a candidate that:

- starts implementation without a required spec, or relies on an unapproved change
  to one;
- needs a later task before it is useful, verifiable or safe to release;
- bundles an independent outcome;
- changes behaviour outside the epic;
- is cleanup or scaffolding that can wait until after the first useful slice.

Answer as exactly three unbulleted lines in this template:

```text
Task: <terse technical description of the task>
Rationale: <why this task should be done now>
Risks: <caveats and risks of taking this route>
```

Limit the `Task` value to 73 characters. Limit the `Rationale` and `Risks` values
to 221 characters each. The labels do not count toward these limits. Make the
rationale compare the task's timing with its closest alternatives. State concrete
uncertainty, coupling or regression exposure in risks; say when none is material.

Do not list files, call sites, commands, tests, implementation steps or acceptance
criteria. Write for someone deciding whether the result is worth doing, not for its
implementer. Use technical terms only when they identify the task or its tradeoffs
more precisely. Do not add an introduction, conclusion or alternative candidate.

Do not edit the epic, create task files, or begin implementation unless explicitly
requested.
