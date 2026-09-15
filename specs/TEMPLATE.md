---
status: proposed
---

# <Capability>

<!--
Spec template. Copy to:
- Design system: specs/design-system/<category>/<capability>/spec.md (e.g. specs/design-system/components/cn-chat-bar/spec.md)
- Application:   specs/pelilauta/<sub-app>/<capability>/spec.md (e.g. specs/pelilauta/threads/reply-authoring/spec.md)


status is a process gate, not protection: `proposed` — the text carries a new,
material or unsettled amendment the operator has not cleared. A task starts from
it only when the operator explicitly asks. For a minor, settled amendment to a
live spec, show an unapplied diff and its reason in chat. Apply an accepted
amendment while retaining `live`. `live` — an operator has read it through; it
portrays how the capability is supposed to work. `deprecated` — kept for its
context or architecture as a lesson or example.

A material amendment created during implementation becomes `proposed` without
stopping that task. Run the spec review and flag the amendment for operator review.

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
1. Component placement: The component's mounting slot or parent layout using `@package` aliases (e.g. `@pelilauta/threads/client/ThreadChatBar.svelte`, `@design-system/components/CnChatBar.svelte`).
2. State coordination: Reactive stores or event channels connecting this capability across islands.
3. Execution path: Handlers or API endpoints that perform the writes.

Do not describe what neighboring components or streams render; describe only this capability's wiring.
When a capability extends another, name the spec it extends and state only what differs.
-->

### Documentation

<!--
(Design System specs only)
The books that carry this capability. Omit this entire section in application/sub-app specs.
-->

### Constraints

<!--
Invariants, data-loss protection rules, concurrency boundaries, and validation limits that govern the implementation.
Do not write basic conditional rendering rules here; specify observable UI behaviors in Scenarios instead.

Do not copy values defined elsewhere. Link to them instead.
-->

## Contract

### Definition of Done

<!--
Observable product completion criteria:
- State what the user can accomplish when complete.
- Do not name test file paths, test runners, or test suites.
- Do not list historical migration cleanup items.
-->

### Regression Guardrails

<!--
Silent failure modes and accessibility/state traps (e.g. keyboard focus lost to hidden elements, state overwrite on unmount).
Do not use this section to argue or defend design decisions.
-->

### Scenarios

<!--
Observable behavioral specification in standard Gherkin.
One scenario is one distinct behavior.
-->

```gherkin
Feature: <Capability Name>

  Scenario: <Descriptive Scenario Name>
    Given <state>
    When <action>
    Then <observable outcome>
```
