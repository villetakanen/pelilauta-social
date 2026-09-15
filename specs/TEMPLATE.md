---
status: proposed
---

# <Capability>

<!--
Spec template. Destination paths:
- Design system: specs/design-system/<category>/<capability>/spec.md (e.g. specs/design-system/components/cn-chat-bar/spec.md)
- Application:   specs/pelilauta/<sub-app>/<capability>/spec.md (e.g. specs/pelilauta/threads/reply-authoring/spec.md)


The status field acts as a process gate:
- `proposed`: The text carries a new, material, or unsettled amendment the operator has not cleared. A task starts from it only when the operator explicitly requests.
- `live`: An operator cleared the spec; it portrays intended capability operation. For a minor, settled amendment to a live spec, show an unapplied diff and rationale in chat. Apply the accepted amendment while retaining `live` status.
- `deprecated`: Retained for historical context or architectural reference.

A material amendment created during implementation becomes `proposed` without stopping that task. Run the spec review and flag the amendment for operator review.

Follow the prose rules in docs/WRITING.md. Delete any line an agent can derive from the code. Name the mistake a sentence prevents; delete a sentence if it prevents no mistake or if another source already prevents it. A section that the code fully expresses states `(implicit)`.

A spec defines what the capability does. It cannot bind another capability; sentences describing other capabilities govern nothing and become stale when those capabilities change. Where the boundary matters, name the governing spec of the other capability and stop there.

Do not write datelines, provenance, or decision narratives; git carries them. Do not announce the authority of the spec.

.agents/skills/spec/SKILL.md defines the authoring procedure and review gate.
-->

## Blueprint

### Context

<!--
State the baseline and capability purpose in 1–2 direct sentences:
1. Baseline: The existing page or parent domain context this capability attaches to.
2. Purpose: The specific user action or capability it introduces.

State facts without philosophical justifications, metaphors, or defensive "X, not Y" rhetoric.

Example:
> Pelilauta threads display discussion topics and their chronological replies. Reply authoring
> provides the docked chrome composer for signed-in members to post and edit replies on a
> thread, while anonymous visitors receive a sign-in prompt at the end of the discussion.
-->

### Architecture

<!--
State the structural wiring and cross-boundary coordination:
1. Component placement: The component mounting slot or parent layout using `@package` aliases (such as `@pelilauta/threads/client/ThreadChatBar.svelte` or `@design-system/components/CnChatBar.svelte`).
2. State coordination: Reactive stores or event channels connecting this capability across islands.
3. Execution path: Handlers or API endpoints that perform writes.

Do not describe what neighboring components or streams render; describe only the wiring for this capability.
When a capability extends another, name the extended spec and state only what differs.
-->

### Documentation

<!--
Design System specs only.
List the books that carry this capability. Omit this section in application specs.
-->

### Constraints

<!--
State invariants, data-loss protection rules, concurrency boundaries, and validation limits that govern the implementation.
Do not write basic conditional rendering rules here; specify observable UI behaviors in Scenarios instead.

Do not copy values defined elsewhere; link to them instead.
-->

## Contract

### Definition of Done

<!--
Define observable product completion criteria:
- State what the user can accomplish upon completion.
- Do not name test file paths, test runners, or test suites.
- Do not list historical migration cleanup items.
-->

### Regression Guardrails

<!--
List silent failure modes and accessibility or state traps, such as keyboard focus lost to hidden elements or state overwrite on unmount.
Do not use this section to argue or defend design decisions.
-->

### Scenarios

<!--
Specify observable behavior in standard Gherkin.
Each scenario defines one distinct behavior.
-->

```gherkin
Feature: <Capability Name>

  Scenario: <Descriptive Scenario Name>
    Given <state>
    When <action>
    Then <observable outcome>
```
