---
name: spec
description: Create or revise specs when defining or clarifying required behavior.
---

# Spec

A living spec explains a capability's purpose, required behavior, and constraints.

Follow [AGENTS.md](../../../AGENTS.md) for spec necessity, authority, and status.
Follow [WRITING.md](../../../docs/WRITING.md) for prose and
[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) for artifact responsibilities.
Use [TEMPLATE.md](../../../specs/TEMPLATE.md) for structure and destination paths.

Read governing specs and relevant implementation before drafting.
Use v20 for unsettled design treatments; confirm its intended purpose with the operator.
When evidence conflicts or leaves intent unclear, resolve concrete examples with
the operator: starting conditions, an action or event, and the expected outcome.

State requirements at the capability they govern; link shared requirements.
Describe observable outcomes and concrete constraints.
Link implementation details to their canonical artifacts.
When implementation disagrees with a spec, identify the mismatch before choosing a fix.

Aim for 100 lines per spec; above 120, review scope and duplication.
Split independent capabilities into child specs, preserving requirements,
review status, and incoming links. Keep shared requirements in the parent.

Before presenting a proposed spec change, run technical-writer and spec-review.
