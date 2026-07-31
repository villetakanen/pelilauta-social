---
status: draft
---

# <Capability>

<!--
Spec template. Copy to specs/<domain>/<capability>/spec.md.
Authoring rules live in .agents/skills/spec/SKILL.md; this file defines the
required anatomy. Keep the spec small enough to guide decisions (target well
under 300 lines).
-->

## Intent

Why this capability exists and what users and consumers can rely on.
One to three short paragraphs; state the problem, not the solution mechanics.

## <Behavior sections as needed>

Observable behavior stated as facts of the system: vocabulary, visual
behavior, accessibility, compatibility intent. Use as many focused sections
as the capability needs. Be explicit — agents don't infer. Frame constraints
positively (what the system does), not as prohibitions where avoidable.
Anchor, don't model: promise only what this capability owns; reference values
owned by tokens, parent specs, or upstream contracts by linking their owner,
never by restating them here.

## Blueprint

The shape of the thing: its parts, how they relate, and what a reader or consumer
encounters. Enough that two people building it independently would produce
recognisably the same artifact, and that a reviewer can tell a departure from a
variation.

## Non-Goals

What this capability deliberately does not do, so scope cannot silently grow
back in through implementation.

## Regression Guardrails

Invariants that must survive future changes to this and neighboring
capabilities.

## Acceptance

Concrete, observable acceptance criteria a human or agent can verify against
the running product and the design-system book.
