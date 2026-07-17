---
name: ds-developer
description: Use when implementing one approved design-system issue in packages/design-system, including tokens, generated styles, tests, page infrastructure, or reusable components. Keeps apps/design as a thin host and requires explicit compatibility scope before touching apps/pelilauta.
---

# DS Developer

Implement one bounded design-system change in its owning package and add only the host wiring required by the assigned issue.

## Workflow

1. Confirm the assignment.
   - Read the assigned issue, root `AGENTS.md`, linked spec, plan, and ADRs.
   - Identify intended behavior, allowed paths, acceptance evidence, and human gates.
   - Hand missing or contradictory intent to `ds-spec-writer` or the human before editing.

2. Assign file ownership.
   - Put reusable components, tokens, styles, page implementations, generators, and package tests under `packages/design-system/**`.
   - Limit `apps/design/**` to deployment configuration, Astro integration, and thin route adapters.
   - Touch `apps/pelilauta/**` only when the assigned issue explicitly includes compatibility integration backed by a v18 spec.

3. Implement the smallest complete change.
   - Use DTCG files as canonical token data and generated CSS as checked web output.
   - Use Svelte for reusable interactive components.
   - Use Astro for structural shells, page composition, and thin route adapters.
   - Keep reusable behavior SSR-compatible.
   - Keep app routes free of reusable implementation and app-local design-system overrides.
   - Preserve existing public behavior unless the assigned issue contains an approved exception.

4. Verify the implementation.
   - Run package-local tests and generation checks first.
   - Confirm generated output is current and references resolve without cycles.
   - Run the design-app check or build when integration paths changed.
   - Run Pelilauta compatibility checks only when that application was explicitly in scope.
   - Record deterministic results and identify remaining probabilistic or human acceptance.

5. Report the handoff.
   - Report package files changed, host-app files changed, checks run, compatibility assumptions, and unresolved gates.
   - Hand living-book prose and demos to `ds-doc-page-writer`.
   - Hand newly discovered intent or compatibility questions to `ds-spec-writer` or the human.

## Target Architecture

- Canonical implementation: `packages/design-system/**`
- Design-site host: `apps/design/**`
- Thin routes: `apps/design/src/pages/**`
- Product integration: `apps/pelilauta/**`, only when explicitly assigned
- Canonical token data: DTCG `.tokens.json`
- Web token output: generated `--cn-*` CSS
- Interactive components: Svelte
- Structural composition: Astro

## Boundaries

- Do not add dependencies, change deployment configuration, or alter public URLs without approval.
- Do not alter Firebase, authentication, authorization, or persisted data.
- Do not resolve missing intent by inventing behavior.
- Do not patch package gaps with app-local CSS or duplicate reusable code in an app.
- Do not write specs or living-book prose while acting as this skill.
- Do not commit unless explicitly requested.
