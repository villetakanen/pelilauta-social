---
status: draft
provenance:
  - <source of authority: v18 file/behavior, immutable upstream commit, approved spec, or human decision>
---

# <Capability>

<!--
Intent spec template. Copy to specs/<domain>/<capability>/spec.md.
Authoring rules live in .agents/skills/spec/SKILL.md; this file defines the
required anatomy. Keep the spec small enough to guide decisions (target well
under 300 lines). Blueprint detail — file layouts, framework choices, task
sequencing — belongs in the linked plan, not here.
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
owned by tokens, parent specs, or upstream contracts as their owner's
decision, keeping observed values in provenance as evidence.

## Non-Goals

What this capability deliberately does not do, so scope cannot silently grow
back in through implementation.

## Contract

The verification half of the spec. Everything here must be checkable.

### Definition of Done

Observable, measurable conditions under which the capability is complete.

### Regression Guardrails

Invariants that must survive future changes to this and neighboring
capabilities. When a guardrail is retired, strike it through with a date
rather than deleting it.

## Acceptance

Concrete, observable acceptance criteria a human or agent can verify against
the running product and the design-system book. Each criterion should map to
a deterministic check or a named human review step.
