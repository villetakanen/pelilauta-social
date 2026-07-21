---
status: draft
provenance:
  - "Parent rendering contract: specs/design-system/components/cn-icon/spec.md (Icon component owns sizes, contextual color, fallback rendering, and the assistive-technology noun announcement; this spec anchors to it and does not restate those values)"
  - "Existing tier model (evidence of current practice this spec codifies): packages/design-system/components/managed-tier.ts (managed tier optional at build+runtime), packages/design-system/icons/community/ + PROVENANCE.md (community catalog + provenance rows for fox, search), packages/design-system/scripts/generate-icon-registry.mjs (registry generation)"
  - "Precedence and source-owned color: v20 target model at immutable commit 02880fbc995b45d459ce4f264b29d5283b1d8ced (trusted registries, precedence, server-rendered markup, source-owned color)"
  - "Human decision 2026-07-21: adding a community icon noun is a human-approved change that records the artwork's source and license and its tier; community-tier artwork is project-licensed, monochrome, and renders with the surrounding foreground (currentColor). Formalizes the practice already applied for fox and search."
  - "Findings and cross-cycle decisions: docs/lessons/feat-cn-icon.md; docs/practices/consumer-migration.md"
  - "OPEN human decisions (unresolved at draft): noun alias policy; whether the design-system book must demonstrate governance for the capability to be Done"
---

# Iconography

## Intent

Pelilauta needs one governed icon vocabulary rather than an accumulation of
per-surface artwork. Icons must look the same across server-rendered and
client-hydrated surfaces, carry known provenance and licensing, and let the
legacy Cyan icon mechanism retire one surface at a time without the vocabulary
drifting.

This capability owns the *vocabulary and its governance*: which semantic nouns
exist, where their artwork comes from, how a noun is added, and how the icon
tiers are assigned and licensed. It does not own how a single icon renders —
sizes, contextual color, and the missing-icon fallback are the Icon component's
contract (`specs/design-system/components/cn-icon/spec.md`), which this spec
anchors to as their owner.

## Usage Principles

- An icon supports surrounding content or a control; it does not replace an
  understandable label where a label is needed.
- An icon that is the sole content of a control does not supply that control's
  accessible name; the control supplies one from visible text or an explicit
  label. (Rendering-level accessibility is owned by the Icon contract.)
- An icon is never the only means of communicating a state when text or another
  accessible indication is required.
- Every icon is identified by a semantic noun from the approved catalog. Nouns
  describe meaning (`search`, `fox`), not appearance, so artwork can be revised
  without renaming the noun.

## Vocabulary And Catalog Governance

- The catalog is repository-owned, reviewed artwork. Adding, removing, or
  re-pointing a noun or its artwork is a human-approved product decision, never
  an incidental side effect of a surface migration.
- **Admission.** A community noun is added by a human-approved change that
  records, in the community `PROVENANCE.md`, the artwork's source (an immutable
  upstream commit or a current-only asset path) and its license. Community-tier
  artwork is project-licensed, monochrome, and authored to render with the
  surrounding foreground (`currentColor`).
- **Determinism.** Within the tier that resolves it, one noun maps to exactly
  one piece of artwork, whether the noun is statically authored or supplied from
  data.
- **Proprietary artwork is never stored in this repository.** Branded,
  non-project-licensed artwork lives only in the `@myrrys/proprietary` managed
  submodule and is consumed through the optional managed tier.
- Public SVGs under `apps/pelilauta/public/icons/` are retained at their current
  URLs for as long as any legacy Cyan `cn-icon` consumer still fetches
  `/icons/{noun}.svg`; the catalog does not remove them.

## Source Tiers

A noun resolves through governed tiers in the precedence the Icon capability
defines (community → managed → bundled fallback → missing glyph). Each tier has
distinct ownership, licensing, and colour behaviour:

- **Community** — project-licensed monochrome artwork in
  `packages/design-system/icons/community/`, with a `PROVENANCE.md` row.
  Inherits the surrounding foreground.
- **Managed** — proprietary branded artwork from `@myrrys/proprietary`,
  optional at build and runtime (an absent submodule degrades to the fallback,
  never a build or runtime failure). Preserves the colours encoded in its
  reviewed source.
- **Bundled fallback** — a small set of essential UI symbols bundled with the
  design system and guaranteed available regardless of the other tiers.
- **Missing** — an unknown, empty, or absent noun renders the approved
  missing-icon glyph and keeps its layout space. (The glyph and its rendering
  are the Icon contract's; governance only guarantees a miss is visible, never
  silently collapsed.)

## Non-Goals

- Does not define the Icon rendering contract — sizes, the contextual
  size-standardization mechanism, colour resolution, fallback rendering, and
  the assistive-technology noun announcement are owned by
  `specs/design-system/components/cn-icon/spec.md`.
- Does not redesign existing artwork or rename persisted or dynamic nouns.
- Does not invent artwork or aliases for nouns absent from every approved
  source; such nouns remain explicit product decisions.
- Does not introduce new registry, build-orchestration, or catalog automation
  beyond the existing generator; the catalog is small and governance is a human
  review, not a pipeline.
- Does not require importing every possible icon before a product consumer needs
  it, nor removing other Cyan Lit components.

## Contract

### Definition of Done

- A separate iconography spec states the usage principles, the catalog-admission
  rule, tier assignment, and licensing, anchored to (not duplicating) the Icon
  component contract.
- The community `PROVENANCE.md` records source and license for every community
  noun the catalog contains.
- Each Acceptance item below maps to a deterministic check or a named human
  review.

### Regression Guardrails

- No community-tier artwork is present without a `PROVENANCE.md` row naming its
  source and license.
- No proprietary or non-project-licensed artwork is committed to this
  repository; branded artwork is consumed only through the optional managed
  tier.
- An absent managed submodule never causes a build or runtime failure; it
  degrades to the bundled fallback then the missing glyph.
- Every SVG under `apps/pelilauta/public/icons/` stays available at its current
  URL for as long as any legacy Cyan `cn-icon` consumer remains.
- A noun is not renamed or re-pointed as an incidental effect of a surface
  migration.

## Acceptance

- Every artwork file under `packages/design-system/icons/community/` has a
  matching `PROVENANCE.md` row with a source and a license. (Deterministic
  check: catalog-vs-provenance parity.)
- Building both apps with the `@myrrys/proprietary` submodule absent completes,
  and a managed-only noun resolves to the bundled fallback or missing glyph
  rather than failing. (Deterministic check: absent-submodule build, per the
  cn-icon cycle's verified negative state.)
- Community artwork declares `currentColor` (or equivalent inherit-foreground
  authoring) so it follows its surrounding context, consistent with the Icon
  contract's contextual-colour acceptance.
- A human review confirms the usage principles and catalog-governance rules in
  this spec match the artwork and provenance actually present in the catalog.
