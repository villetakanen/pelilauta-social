# <Epic>

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

The outcome this epic delivers and why it matters. At most a paragraph.

## Success criteria

Observable states that prove the goal, one per entry. Not activities, not a spec's
acceptance criteria. The epic closes on these, not on emptying the work list.

- <criterion>

## Guardrails

What must remain true while the work lands. A guardrail is not progress; it cannot
close the epic, only block a change that breaks it.

- <guardrail>

## Out of scope

Work this epic does not do, at most 72 characters each. Name the work, not a guess
at which epic picks it up.

- <work>

## Possible work (non-binding)

Candidate slices toward the goal: hypotheses, not commitments or promised scope.
Each entry carries its known scope, and what it waits on, in at most 220 characters.
The set grows and shrinks as the work teaches.

- <candidate>

## Done

One line each, at most 72 characters, so the remaining work stays legible. A done
story's decisions belong to the spec it delivered, and its reasoning to its commit
message.

- <done story>

## Open questions

Material unknowns that can change direction or scope. What needs a human decision or the
v18 and Firebase contracts to answer belongs here. Delete when empty.

- <question>
