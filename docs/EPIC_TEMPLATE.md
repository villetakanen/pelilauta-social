# <Epic>

An epic is a GitHub issue labeled `epic`, and this document defines its body structure. An epic is
transient: it carries behavior while the epic runs, behavior that outlives the
epic lands in a spec, and the issue closes when work completes. Epic entries keep the goal and
remaining work legible without recording historical delivery.

## Goal

State the outcome this epic delivers and why it matters in at most one paragraph.

## Success criteria

List observable states that prove the goal, one per entry. Exclude activities and acceptance criteria from specs. Success criteria close the epic; emptying the work list does not.

- <criterion>

## Guardrails

State constraints that must remain true while work lands. A guardrail is not progress; it blocks changes that violate constraints without closing the epic.

- <guardrail>

## Out of scope

List work this epic excludes, using at most 72 characters per entry. Name the excluded work rather than speculating on future epics.

- <work>

## Possible work (non-binding)

List candidate slices toward the goal as hypotheses rather than commitments or promised scope. State known scope and blocking dependencies in at most 220 characters per entry. The candidate set changes as implementation proceeds.

- <candidate>

## Done

List completed stories on one line each at most 72 characters long to keep remaining work legible. Decisions belong in the delivered spec, and implementation reasoning belongs in the commit message.

- <done story>

## Open questions

State material unknowns that can change direction or scope. Record items requiring a human decision or the Firebase contract. Delete this section when empty.

- <question>
