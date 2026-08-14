---
status: draft
---

# <Capability>

<!--
Spec template. Copy to specs/<domain>/<capability>/spec.md.

When there is nothing left to add, stop.

Prose rules: docs/WRITING.md. The spec-specific tests: can an agent derive this
line from the code? If yes, delete it. Name the mistake a sentence prevents; if
it prevents none, or something else already prevents it, delete it. A section
the code fully expresses states `(implicit)`.

Do not write datelines, provenance, or the narrative of how a decision was
reached; git carries those. Do not announce the spec's own authority ("the set
is closed; a step is added by changing this spec").

Authoring procedure and the review gate: .agents/skills/spec/SKILL.md.
-->

## Blueprint

### Context

The user or system need this capability serves: who is served, and what they
get. Then what wins when its goals collide. Do not describe the world before
the work; that description is false once the work lands. One paragraph.

### Architecture

What would a reader of the code get backwards? State which way the dependencies
run, and any structural choice that reading one file would not reveal.

When a capability extends another, name the spec it extends and state only what
differs. The extended spec governs wherever this one is silent. Do not restate an
inherited rule to make this spec read completely.

### Documentation

The books that carry this capability. A change here has to reach every page
listed.

### Constraints

What would someone guess wrong if it were not written here?

Do not copy a value that is already written somewhere else. Link to it instead —
two copies can disagree.

## Contract

### Definition of Done

How do we know we are finished? Observable success criteria.

State the outcome, not the instrument. Naming a check here, or listing what it
asserts, writes the test plan before the behaviour is settled. What such a check
would assert is already a Constraint, a Guardrail or a Scenario; where it is not,
write it there.

### Regression Guardrails

What breaks silently, and when? Invariants that must survive changes to this and
neighbouring capabilities.

### Scenarios

What behaviour must not change? Gherkin, without dictating implementation. Name
the check that runs each one, where one exists.

One scenario is one behaviour. The same behaviour holding across a scheme, a size
or a presentation is still one scenario; write a second one only where the
behaviour itself differs. Where a rendered specimen is the detector rather than a
check, name the specimen.

```gherkin
Given <state>
When <action>
Then <observable outcome>
```
