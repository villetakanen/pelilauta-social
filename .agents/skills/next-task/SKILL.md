---
name: next-task
description: Briefly propose the next small, contained, atomic, deliverable and releasable task from a Pelilauta epic, with the fastest value first. Use when asked what to do next, to propose the next task from an epic, or to slice an epic into its next release-sized outcome.
---

# Next Task

Read the named epic. If none is named, identify the active epic from the current
branch and `plans/`. Read every Possible work entry, the domain's parent spec, the existing
specs for candidate capabilities, and v20's implementation and books for the
surfaces in question.

Treat a Possible work entry that leaves the relationship between elements, components or
documents undecided as a candidate, not an automatic task. Split it until one
decision directly enables one deliverable. Do not put a plan-wide classification
question ahead of concrete work unless every smaller candidate depends on that exact
decision.

Possible work is non-binding: an entry is a candidate, not a commitment, and the
set is not closed. A task may split an entry or name newly discovered work absent
from the plan when that work is necessary to the epic's Goal or Success criteria.
Reject work outside the epic's Goal.

Choose exactly one task. Prefer the smallest vertical slice that produces observable,
verifiable value and can ship on its own. Check the relevant specs before proposing
implementation. If a required spec is missing, or the work needs a substantive change
to its intent, propose completing and approving that spec first.

Name the artifacts that define the deliverable. For a new or updated spec, plan or
other document, put its exact repository path in `Task`; approval is part of
completing a spec, not a substitute for naming it. For implementation, name the
changed behaviour, where a user encounters it, and the few major artifacts needed to
make the task boundary clear. If that cannot fit within the answer limits, split the
candidate again.

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

- starts implementation without a required spec, or relies on a `proposed` change
  to one;
- needs a later task before it is useful, verifiable or safe to release;
- bundles an independent outcome;
- changes behaviour outside the epic;
- is cleanup or scaffolding that can wait until after the first useful slice.

Answer as exactly three unbulleted paragraphs, with one blank line between them:

```text
Task: <terse technical description of the task>

Rationale: <why this task should be done now>

Risks: <caveats and risks of taking this route>
```

Limit the `Task` value to 73 characters. Limit the `Rationale` and `Risks` values
to 221 characters each. The labels do not count toward these limits. Make the
rationale compare the task's timing with its closest alternatives. State concrete
evidence for that comparison and the dependency this task clears. State a failure
mode or unknown specific to this task in risks, including adjacent specs or decisions
that may still be missing. Do not substitute generic costs of specification,
implementation or review. Say when no material risk exists.

Name artifacts when they make the deliverable or a dependency concrete. Do not give
an exhaustive supporting-file or call-site inventory, commands, test procedures,
implementation steps or acceptance criteria. Write for someone deciding whether the
result is worth doing, not for its implementer. Use technical terms only when they
identify the task or its tradeoffs more precisely. Avoid placeholder nouns such as
ownership, capability, contract, boundary, surface and slice; name the affected
elements, components, behaviour, artifact or decision instead. Do not add an
introduction, conclusion or alternative candidate.

Before answering, replace `owns`, `owned`, `owner` and `ownership` with the concrete
relationship: specifies, implements, imports, renders, references, provides or keeps.
If none fits, inspect the artifacts until the relationship can be stated.

Do not edit the epic, create task files, or begin implementation unless explicitly
requested.
