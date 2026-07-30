# ADR 0002 — Abandon DTCG as the token source format

- **Status:** accepted
- **Date:** 2026-07-30
- **Decided by:** Ville Takanen

## Context

The v21 design system wanted one platform-neutral source of truth for tokens,
authored as data and projected into CSS rather than hand-maintained in both places.
DTCG (Design Tokens Community Group format) was the obvious candidate and was tried:
ADR 0001, 2026-07-17, adopted DTCG `.tokens.json` files as canonical with generated
CSS names.

DTCG does not support all the token types this design system needs. The format
covers the token kinds it was designed for and leaves the rest unexpressible, so a
DTCG-canonical source could not describe the whole system — which defeats the point
of having one.

ADR 0001 never reached `main`. It lived on `feat/core-design-tokens`, which was
abandoned and deleted, so 0001 is a deliberate gap in this sequence rather than a
missing file.

## Decision

DTCG is not the token source format, and no DTCG token data is introduced.

Tokens are hand-authored CSS under `packages/design-system/styles/`, which is what
ships today. The CSS custom property is the token's real name: the grid token is
`--cn-grid`, not a projection of a `space.grid` path. ADR 0001's path grammar and
its generated `--cn-space-grid` style of naming are both rejected.

The underlying intent survives: a JSON-shaped token source generating the CSS, with
TypeScript-typed values rather than DTCG's type system. That is a later concern with
no current work attached, and nothing in the design system should be arranged in
anticipation of it.

## Consequences

Hand-authored CSS stays the only definition, so a value and its documentation can
drift, and the guard against that is a test asserting the value — as
`packages/design-system/test/units.test.ts` does — not a generator.

Anyone proposing DTCG again should read this first; the format was evaluated
against real needs and found insufficient, so re-proposing it needs new evidence
about the missing token types, not a fresh argument for data-driven tokens.

Deferring the JSON-and-TypeScript source means accepting that token families are
added by hand for now. The cost is per-family effort; the benefit is that no
generation machinery sits on the critical path of any delivery.
