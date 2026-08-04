---
status: draft
---

# <Capability>

<!--
Spec template. Copy to specs/<domain>/<capability>/spec.md.

When there is nothing left to add, stop.

A spec records only what nothing else holds: intent the code cannot state and no
compiler or test guards. Test every line: can an agent derive this from the
code? If yes, delete it. Test every sentence: name the mistake it prevents; if
it prevents none, or something else already prevents it, delete it. A section
the code fully expresses states `(implicit)`.

Do not write datelines, provenance, or the narrative of how a decision was
reached; git carries those. Do not announce the spec's own authority ("the set
is closed; a step is added by changing this spec").

Authoring procedure and the review gate: .agents/skills/spec/SKILL.md.
-->

## Blueprint

### Context

The standing capability: its goal, and what wins when its goals collide. Do not
describe the world before the work; that description is false once the work
lands. One paragraph.

### Architecture

What would a reader of the code get backwards? State which way the dependencies
run, and any structural choice that reading one file would not reveal.

### Constraints

What would someone guess wrong if it were not written here?

Do not copy a value that is already written somewhere else. Link to it instead —
two copies can disagree.

## Contract

### Definition of Done

How do we know we are finished? Observable success criteria.

### Regression Guardrails

What breaks silently, and when? Invariants that must survive changes to this and
neighbouring capabilities.

### Scenarios

What behaviour must not change? Gherkin, without dictating implementation. Name
the check that runs each one, where one exists.

```gherkin
Given <state>
When <action>
Then <observable outcome>
```
