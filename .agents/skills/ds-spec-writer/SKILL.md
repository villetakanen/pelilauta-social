---
name: ds-spec-writer
description: Use when creating, updating, or reverse-engineering one design-system spec under specs/design-system/. Produces a concise intent artifact from assigned scope, implementation evidence, and compatibility sources; hands implementation and docs work to their dedicated skills.
---

# DS Spec Writer

Produce one bounded design-system intent artifact under `specs/design-system/**`.

## Workflow

1. Confirm the assignment.
   - Identify the assigned issue, bounded surface, and target spec path.
   - Select create mode when no spec exists, update mode when approved intent or implementation evidence changes an existing spec, or reverse mode when implemented behavior lacks a spec.
   - Ask the human when the requested intent or compatibility boundary is ambiguous.

2. Load relevant context.
   - Read root `AGENTS.md`, the assigned issue, and linked plans or ADRs.
   - Read the existing spec plus relevant parent and neighboring specs.
   - Read current v21 implementation and tests. Code is authoritative for runtime behavior; tests are executable evidence.
   - For migrated behavior, inspect v18 source. Use v20 only for design provenance.

3. Establish the intended state.
   - Separate intended behavior from current behavior, anomalies, and migration debt.
   - Record unresolved disagreements as human reconciliation gates.
   - Keep the scope to one component, token group, or independently evolvable design-system surface.

4. Write the spec.
   - Follow the nearest current spec structure; include only sections relevant to this surface.
   - When no repository pattern exists, use `Context`, `Architecture`, and `Acceptance` as the minimal structure.
   - Capture context, ownership, architecture constraints, and observable quality criteria without narrating code.
   - State constraints as affirmative system behavior where practical. Use explicit prohibitions when they protect scope, compatibility, security, or data.
   - Label acceptance as deterministic verification, probabilistic review, or human acceptance as appropriate.
   - Cite external evidence with repository URL, immutable commit, and repository-relative path.

5. Validate and report.
   - Confirm every referenced repository path exists and no committed text contains workstation paths.
   - Confirm the spec does not claim behavior unsupported by code, evidence, or an explicit human decision.
   - Report the spec path, provenance used, assumptions, reconciliation gates, and required handoff.

## Handoffs

- Hand implementation or test changes to `ds-developer` after intent is approved.
- Hand living-book prose and demos to `ds-doc-page-writer` after behavior exists.
- Hand product scope, compatibility exceptions, and unresolved intent to the human.

## Boundaries

- Write only under `specs/design-system/**`.
- Do not edit implementation, tests, application code, docs pages, plans, ADRs, or tooling configuration.
- Do not invent missing v18 behavior, Firebase contracts, or design decisions.
- Do not commit; leave the spec change for review.
