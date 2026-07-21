---
status: draft
provenance:
  - "Parent rendering contract: specs/design-system/components/cn-icon/spec.md (the Icon component owns sizes, contextual colour, missing-glyph rendering, and the assistive-technology noun announcement; this spec anchors to it and does not restate those values)"
  - "Tier model and precedence (owned here, ported from the v20 target model at immutable commit 02880fbc995b45d459ce4f264b29d5283b1d8ced): trusted registries, community→managed→fallback precedence, server-rendered markup, source-owned colour"
  - "Bundled fallback tier: packages/design-system/components/icon-fallback.ts (essential UI symbols + the mandatory missing glyph, MIT-licensed artwork, ported from v20 02880fbc packages/cyan/src/components/CnIconFallback.ts)"
  - "Managed tier optionality: packages/design-system/components/managed-tier.ts (guarded dynamic import, empty when @myrrys/proprietary is unavailable at runtime); build-time survival of an absent submodule verified in both apps during the cn-icon cycle, docs/lessons/feat-cn-icon.md (verified locally; production always builds with the submodule present)"
  - "Community catalog and current practice this spec codifies: packages/design-system/icons/community/ + PROVENANCE.md (provenance rows for fox, search), packages/design-system/scripts/generate-icon-registry.mjs"
  - "Human decision 2026-07-21: adding a community icon noun is a human-approved change that records the artwork's source and confirms it is project-licensable before it enters the community tier; community-tier artwork is monochrome and authored to render with the surrounding foreground (currentColor). Formalizes the practice already applied for fox and search."
  - "Cross-cycle decisions and evidence: docs/lessons/feat-cn-icon.md; docs/practices/consumer-migration.md"
  - "Human decision 2026-07-21: noun aliases are deferred out of scope for this capability until a real consumer need appears; the capability governs distinct nouns only. The design-system book IS required for this capability to be Done — a package-owned governance page on design.pelilauta.social makes the vocabulary and its governance reviewable (per the CLAUDE.md Delivery Contract; governance-only work is not exempt from the book rule)."
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
sizes, contextual colour, and the missing-icon glyph are the Icon component's
contract (`specs/design-system/components/cn-icon/spec.md`), which this spec
anchors to as their owner.

## Usage Principles

- An icon supports surrounding content or a control; it does not replace an
  understandable label where a label is needed.
- Every icon is identified by a semantic noun from the approved catalog. Nouns
  describe meaning (`search`, `fox`), not appearance, so artwork can be revised
  without renaming the noun.
- Rendering-level accessibility — how a sole-icon control obtains its accessible
  name, the assistive-technology announcement of the noun, and not relying on an
  icon as the only signal of state — is owned by the Icon contract and is not
  restated here.

## Vocabulary And Catalog Governance

- The catalog is repository-owned, reviewed artwork. Adding, removing, or
  re-pointing a noun or its artwork is a human-approved product decision, never
  an incidental side effect of a surface migration.
- **Admission.** A community noun is added by a human-approved change that
  records the artwork's source in the community `PROVENANCE.md` (an immutable
  upstream commit or a current-only asset path) and confirms the artwork is
  project-licensable before it enters the tier. Community-tier membership is
  what confers project licensing; the row records provenance of source, not a
  per-row licence string. Community artwork is monochrome and authored to render
  with the surrounding foreground.
- **Determinism.** Within the tier that resolves it, one noun maps to exactly
  one piece of artwork, whether the noun is statically authored or supplied from
  data.
- **Aliases are deliberately out of scope** (human decision 2026-07-21) until a
  real consumer need appears; this spec governs only distinct nouns. A future
  alias will need its own provenance treatment, so absence of an alias rule here
  does not imply aliases are ungoverned.
- **Proprietary artwork is never stored in this repository.** Branded,
  non-project-licensed artwork lives only in the `@myrrys/proprietary` managed
  submodule and is consumed through the optional managed tier.
- Public SVGs under `apps/pelilauta/public/icons/` are retained at their current
  URLs for as long as any legacy Cyan `cn-icon` consumer still fetches
  `/icons/{noun}.svg`; the catalog does not remove them.

## Source Tiers

A noun resolves through the governed tiers this capability defines, in
precedence order **community → managed → bundled fallback → missing glyph**
(ported from the v20 target model at `02880fbc`). A noun present in an
earlier tier is resolved there; a later tier is reached only when the earlier
ones do not provide it. Each tier has distinct ownership, licensing, and colour
behaviour:

- **Community** — project-licensed monochrome artwork in
  `packages/design-system/icons/community/`, each with a `PROVENANCE.md` row.
  Inherits the surrounding foreground.
- **Managed** — proprietary branded artwork from `@myrrys/proprietary`, optional
  at build and runtime: a build or a running server with the submodule absent
  degrades through the remaining tiers rather than failing (verified in the
  cn-icon cycle). Preserves the colours encoded in its reviewed source.
- **Bundled fallback** — the essential UI symbols and the mandatory missing
  glyph bundled with the component in
  `packages/design-system/components/icon-fallback.ts` (MIT-licensed),
  guaranteed available regardless of the community and managed tiers.
- **Missing** — an unknown, empty, or absent noun renders the missing glyph and
  keeps its layout space. Governance guarantees a miss is visible, never
  silently collapsed; the glyph and its rendering are the Icon contract's.

## Non-Goals

- Does not define the Icon rendering contract — sizes, the contextual
  size-standardization mechanism, colour resolution, missing-glyph rendering,
  and the assistive-technology noun announcement are owned by
  `specs/design-system/components/cn-icon/spec.md`.
- Does not redesign existing artwork or rename persisted or dynamic nouns.
- Does not invent artwork or aliases for nouns absent from every approved
  source; such nouns remain explicit product decisions.
- Does not introduce new registry, build-orchestration, or catalog automation
  beyond the existing generator; the catalog is small and governance is a human
  review, not a pipeline.
- Does not require importing every possible icon before a product consumer needs
  it, nor removing other Cyan Lit components.
- Does not decide whether the book content extends the existing Icon book page
  (`packages/design-system/pages/components/IconPage.astro`) or is a new page —
  that is a plan decision. The capability requires only that the content above
  is readable, without duplicating the Icon component's existing size, colour,
  and fallback demonstrations.

## Contract

### Definition of Done

- **The design-system book makes icon usage readable on
  `design.pelilauta.social`.** A consumer can read, from the DS site, the
  available icon vocabulary — the repository-owned community nouns enumerated in
  full, with the managed and bundled-fallback tiers shown by representative
  example (the managed tier is proprietary and may be absent) — the usage
  principles, and the tier/provenance governance behind them. This is the
  capability's observable deliverable; the spec is its intent.
- Every noun in `packages/design-system/icons/community/` is project-licensable
  artwork with a `PROVENANCE.md` row recording its source, and no proprietary
  artwork is committed to this repository.
- The tier precedence and the catalog-admission rule are stated here and
  reconciled with the artwork and provenance actually present.
- Each Acceptance item below maps to a deterministic check or a named human
  review.

### Regression Guardrails

- No community-tier artwork is present without a `PROVENANCE.md` row naming its
  source, and no `PROVENANCE.md` row names a noun with no artwork file.
- No proprietary or non-project-licensable artwork is committed to this
  repository; branded artwork is consumed only through the optional managed
  tier.
- An absent managed submodule never causes a build or runtime failure; it
  degrades through the bundled fallback to the missing glyph.
- Every SVG under `apps/pelilauta/public/icons/` stays available at its current
  URL for as long as any legacy Cyan `cn-icon` consumer remains.
- A noun is not renamed or re-pointed as an incidental effect of a surface
  migration.

## Acceptance

- **Catalog ↔ provenance parity (deterministic).** Every artwork file under
  `packages/design-system/icons/community/` has exactly one `PROVENANCE.md`
  row, and every row (other than the header) names an existing artwork file;
  each row records a source.
- **Absent-submodule resolution (deterministic).** Building both apps with the
  `@myrrys/proprietary` submodule absent completes, and the managed-only probe
  noun `dd5` resolves to the missing glyph rather than failing. (Re-verifies the
  cn-icon cycle's recorded negative state.)
- **Community authoring (deterministic).** Every SVG under
  `packages/design-system/icons/community/` declares `fill="currentColor"`, the
  authoring convention by which it inherits context. (Contextual-colour
  rendering itself is verified by the Icon contract's acceptance.)
- **Icon usage is readable from the DS book (human).** On
  `design.pelilauta.social`, a consumer can read the community vocabulary (every
  repository-owned community noun), with the managed and bundled-fallback tiers
  shown by example; the usage principles; and the tier/provenance governance.
  The governance page itself is legible in both Light and Dark (icon rendering
  across modes is the Icon contract's acceptance, not re-verified here). This is
  the slice's primary acceptance.
- **Governance review (human).** A human review confirms the usage principles,
  admission rule, and tier assignment in this spec match the artwork and
  provenance actually present in the catalog, and that the book reflects them.
