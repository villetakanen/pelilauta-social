---
status: proposed
---

# <Capability>

<!--
Place design-system specs at specs/design-system/<category>/<capability>/spec.md.
Place application specs at specs/pelilauta/<sub-app>/<capability>/spec.md.

Follow [AGENTS.md](../AGENTS.md) for authority and status, and the
[spec skill](../.agents/skills/spec/SKILL.md) for authoring and review.
Follow [WRITING.md](../docs/WRITING.md) for prose and
[ARCHITECTURE.md](../docs/ARCHITECTURE.md) for artifact responsibilities.

Keep required outcomes explicit. Link implementation details instead of
transcribing them.
-->

## Blueprint

### Context

<!--
State the need, intended users, and scope of the capability.
-->

### Architecture

<!--
Describe boundaries, dependencies, and required interfaces.
Link to the implementation for component placement, state coordination, and handlers.
Link to governing specs for requirements shared with other capabilities.
-->

### Documentation

<!--
List the books that carry this design-system capability.
Omit this section in application specs.
-->

### Constraints

<!--
State constraints on valid implementations, such as data-loss protection,
concurrency boundaries, and validation limits.
Link to values defined in canonical artifacts.
-->

## Contract

### Required behavior

<!--
State what users can accomplish and how the system must respond.
-->

### Regression Guardrails

<!--
State requirements that prevent silent failures, such as lost keyboard focus or
overwritten state. Include only requirements not already stated above.
-->

### Scenarios

<!--
Use concrete examples where they resolve ambiguity in the requirements.
Each scenario states starting conditions, an action or event, and an observable outcome.
-->

```gherkin
Feature: <Capability Name>

  Scenario: <Descriptive Scenario Name>
    Given <state>
    When <action>
    Then <observable outcome>
```
