---
status: approved
---

# Design-System Tokens

Parent: [Design System](../spec.md)

## Context

Design tokens give v21 a platform-neutral vocabulary for visual decisions. The first token scope contains only context-free references derived from reviewed v20 design work. Semantic roles and component decisions evolve later with the surfaces that need them.

Specs record token intent and provenance. Canonical DTCG files contain the executable paths, types, aliases, and values; generated CSS is their checked web representation.

## Architecture

### Standard

- Canonical token data conforms to the stable DTCG 2025.10 [Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), [Color](https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/), and [Resolver](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/) reports.
- Planned canonical source uses `.tokens.json` files under `packages/design-system/tokens/`.
- Planned generated web output is committed under `packages/design-system/styles/` and is never edited independently.
- Living-book token tables and examples consume canonical token data rather than duplicating values.

### Reference Scope

The initial reference layer contains:

- Primary, surface, error, warning, info, and love color scales.
- Base grid, gap, and line spatial references.
- One reviewed radius scale.
- Font-family, font-size, font-weight, line-height, and letter-spacing references.

Semantic color roles, interaction states, component dimensions, component colors, layout breakpoints, ratios, z-index roles, global element styling, and typography utility classes are outside this reference layer.

### Naming

- Canonical platform-neutral paths use category-first DTCG groups, such as `color.primary.70`, `space.grid`, and `font.size.body`.
- DTCG types are explicit and are not inferred from token names.
- A deterministic projection maps canonical paths one-to-one to the public web namespace, such as `--cn-color-primary-70`, `--cn-space-grid`, and `--cn-font-size-body`.
- Public ordinal size names use `xs`, `sm`, `md`, `lg`, and `xl`; `radius.full` identifies the non-ordinal fully rounded endpoint; numeric color steps identify tonal references.
- Generated names that collide after projection are invalid.
- Cyan 4 names remain outside canonical token data and map to generated v21 names through a separate opt-in compatibility stylesheet.

The naming decision requires a human-approved ADR before token implementation.

### Provenance

- v20 design provenance is the [`pelilauta-20` token source at commit `02880fb`](https://github.com/villetakanen/pelilauta-20/tree/02880fbc995b45d459ce4f264b29d5283b1d8ced/packages/cyan/src/tokens).
- Each token-family implementation records the exact repository-relative source file it reviewed.
- The exact `@11thdeg/cyan-css@4.0.0-beta.39` artifact used by v18 defines legacy compatibility names, not canonical v21 values.
- Token values remain in canonical code and are not copied into this spec.

## Acceptance

### Deterministic Verification

- Every canonical token has a valid DTCG type and value or resolvable alias.
- Token aliases and group resolution contain no unresolved or circular references.
- Canonical token paths are unique and map one-to-one to unique `--cn-*` properties.
- Regenerating CSS produces no diff from committed web output.
- Canonical token code never references Cyan 4 compatibility names.
- Living-book token data agrees with canonical DTCG files.

### Probabilistic Review

- Review confirms each token remains a context-free reference rather than a semantic or component decision.
- Review confirms v20 provenance is exact and stale v20 specs or documentation have not overridden reviewed source evidence.
- Review confirms names remain understandable without encoding current implementation mechanics.

### Human Acceptance

- Humans approve the naming ADR before the first canonical token implementation.
- Humans approve exact values and precision one token family at a time.
- Humans decide whether font assets belong in the typography slice after licensing and loading are established.
