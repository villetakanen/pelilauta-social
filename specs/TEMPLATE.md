---
status: draft
---

# <Capability>

<!--
Spec template. Copy to specs/<domain>/<capability>/spec.md.

Anatomy is asdlc.io/patterns/the-spec: Blueprint, then Contract. One deliberate
local deviation, and only one — ours run shorter. Upstream is content at 200
lines and splits past 500; ours are 75-130. If anything else here looks like a
departure, upstream wins and this file is the bug.

Do not write a spec for a bug fix, a configuration change, a dependency bump, or
a one-off task. A spec that adds nothing the codebase already expresses is
maintenance burden.

A spec anchors. It does not model. It holds in place what would otherwise drift,
and is legitimately silent about everything else — most things do not drift, and
of those that do, a compiler or a test catches most.

The test for every line: can an agent derive this from the code? If the code can
say it, do not. What survives is the rationale first, then the rule. A section the
code fully expresses states `(implicit)` — an empty slot is an answer, not a gap
to fill.

A spec states decisions, not their history: no datelines, no provenance, no
narrative of how a decision was reached — git carries all three. It does not
announce its own authority ("the set is closed; a step is added by changing this
spec"), and it does not restate AGENTS.md or another spec.

Authoring procedure and the review gate: .agents/skills/spec/SKILL.md.
-->

## Blueprint

### Context

The standing capability: its goal, and its conflict rules — what wins when goals
collide. Never the world before the work; a context describing what does not
exist yet is false the day the work lands. One paragraph, not a product brief.

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
