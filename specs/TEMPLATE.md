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
of those that do, a compiler or a test catches most. Every section below asks
what would drift, not what the thing is like.

Test each line by deleting it. If nothing goes wrong, it was description: cut it.
If someone would re-derive it wrong in six months, it is an anchor: keep it.
Assume engineering competence — a paragraph a competent reader could have written
without this repository never survives that test.

Authoring procedure and the review gate: .agents/skills/spec/SKILL.md.
-->

## Blueprint

### Context

Why this exists, and what goes wrong without it. One paragraph, not a product
brief. This is the anchor against scope drift; everything else is measured
against it.

### Architecture

What must someone else not change? Name the paths, entry points, interfaces and
data shapes this capability owns, and which way the dependencies run. Not how it
is built — the code states that, and states it more accurately.

### Constraints

What would be re-derived wrong if it were not written here? Boundaries stated as
facts about the system, including what this capability does not own, so scope
cannot grow back in through implementation. A value owned by another spec, by
design tokens, or by an upstream contract is referenced by linking its owner,
never restated.

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
