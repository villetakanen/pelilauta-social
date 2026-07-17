---
name: ds-doc-page-writer
description: Use when writing or updating one design-system living-book page after its behavior is implemented. Produces a package-owned Astro page or demo from the current spec, implementation, and DTCG data, with only a thin apps/design route when needed.
---

# DS Documentation Page Writer

Document one implemented design-system surface without inventing behavior or duplicating token data.

## Workflow

1. Confirm the assignment.
   - Read the assigned issue, root `AGENTS.md`, relevant spec, and target route.
   - Identify the documented surface, intended audience, and required examples.
   - Confirm the implementation exists before describing it as available.

2. Establish factual sources.
   - Read the spec for intended behavior.
   - Read implementation and tests for actual behavior and supported states.
   - Read canonical DTCG files for token names, types, and values.
   - Hand spec disagreements to `ds-spec-writer`.
   - Hand missing implementation to `ds-developer`.

3. Plan the page.
   - Explain the surface's purpose and when to use it.
   - Include only relevant usage, states, variants, API, accessibility, keyboard behavior, tokens, and constraints.
   - Use static Astro examples by default.
   - Use a Svelte demo harness only when interaction must be demonstrated.
   - Follow the current design-site heading and page-layout conventions.

4. Write the page.
   - Put page implementations and documentation-only demos under `packages/design-system/pages/**`.
   - Add or update `apps/design/src/pages/**` only as a thin route adapter.
   - Import real design-system implementation rather than recreating examples.
   - Derive token tables and values from canonical DTCG data.
   - Use existing documentation framing primitives instead of local design-system overrides.
   - Keep examples focused enough to function as review and regression surfaces.

5. Verify and report.
   - Run the narrow design-app check and build.
   - Verify the rendered route and heading hierarchy.
   - Verify interactive examples with keyboard behavior when applicable.
   - Confirm examples do not hide missing tokens behind fallback values.
   - Report the route, source implementation, checks, and remaining visual acceptance.

## Target Architecture

- Page implementations: `packages/design-system/pages/**`
- Documentation demos: package-owned and documentation-only
- Route adapters: `apps/design/src/pages/**`
- Token data: canonical DTCG `.tokens.json`
- Static structure: Astro
- Interactive demonstrations: Svelte only when required

## Handoffs

- Hand missing or changed intent to `ds-spec-writer`.
- Hand implementation gaps or reusable demo primitives to `ds-developer`.
- Hand deployment and public-route decisions to the human.

## Boundaries

- Do not change design-system behavior while documenting it.
- Do not duplicate token values in page source.
- Do not patch package gaps with app-local CSS or components.
- Do not describe planned behavior as implemented.
- Do not add dependencies or change public routes without approval.
- Do not commit unless explicitly requested.
