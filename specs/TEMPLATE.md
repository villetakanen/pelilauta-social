---
status: proposed
---

# <Capability>

<!--
Spec template. Copy to specs/<domain>/<capability>/spec.md.

status is a process gate, not protection: `proposed` — the text carries agent
edits an operator may not have read; implementing against it requires an
explicit ask, and waiting for the answer. `live` — an operator has read it
through; it portrays how the capability is supposed to work. `deprecated` —
kept for its context or architecture as a lesson or example. Any spec may be
edited at any time; an agent edit to a live spec sets it proposed. An operator
makes a spec live by reading it — there is nothing to request.

When there is nothing left to add, stop.

Prose rules: docs/WRITING.md. The spec-specific tests: can an agent derive this
line from the code? If yes, delete it. Name the mistake a sentence prevents; if
it prevents none, or something else already prevents it, delete it. A section
the code fully expresses states `(implicit)`.

A spec states what its own capability does. It cannot bind another capability, so
a sentence about what another one does, does not do, or is the only exception to
governs nothing, and goes stale the moment that capability changes. Where the
boundary matters, name the spec that governs the other side and stop there.

Do not write datelines, provenance, or the narrative of how a decision was
reached; git carries those. Do not announce the spec's authority ("the set
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

A decorative micro-interaction — motion that announces nothing and changes no
state — is one sentence here: its trigger, what it shows, and the clause that
keeps it harmless, such as changing no measurement or resting under reduced
motion. It gets no scenario; the human review in the Definition of Done is its
gate.

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
