---
status: draft
provenance:
  - "Parent rendering contract: specs/design-system/components/cn-icon/spec.md (the Icon component owns sizes, contextual colour, the size-standardization mechanism, missing-glyph rendering, and the assistive-technology noun announcement; this spec anchors to it and does not restate those values)"
  - "Human design decision 2026-07-21: the iconography book is a usage/design-principles page — why icons are used, when an icon may stand alone vs. carry a label, accessibility-in-use, and the vocabulary grouped by purpose — not a technical catalog dump. Informed by an agent-drafted principles page reviewed by the human and by the Pelilauta RPG-community context (threads, character sheets, forums)."
  - "Human decision 2026-07-21: adding a community icon noun is a human-approved change recording the artwork's source in PROVENANCE.md and confirming it is project-licensable; community-tier membership confers project licensing; community artwork is monochrome, authored to render with the surrounding foreground (currentColor). Formalizes the practice already applied for fox and search."
  - "Human decision 2026-07-21: the managed (myrrys) tier is enumerable, so the book lists all managed icons when the submodule is present (not merely by example). Community icons are ported from the existing pelilauta application decisively, one at a time — each an individual human-approved admission, not a bulk import — so the catalog grows alongside the per-consumer Cyan migrations."
  - "Human decision 2026-07-21: noun aliases are deferred out of scope until a real consumer need appears (distinct nouns only); the design-system book IS required for this capability to be Done (governance-only work is not exempt from the CLAUDE.md Delivery-Contract book rule) and is the deliverable."
  - "Tier model and precedence (ported from the v20 target model at immutable commit 02880fbc995b45d459ce4f264b29d5283b1d8ced): trusted registries, community→managed→fallback precedence, server-rendered markup, source-owned colour. Bundled fallback: packages/design-system/components/icon-fallback.ts (essential UI symbols + missing glyph, MIT). Managed optionality: packages/design-system/components/managed-tier.ts; absent-submodule builds verified in the cn-icon cycle (docs/lessons/feat-cn-icon.md)."
  - "Community catalog and current practice: packages/design-system/icons/community/ + PROVENANCE.md (fox, search); packages/design-system/scripts/generate-icon-registry.mjs. Cross-cycle: docs/lessons/feat-cn-icon.md; docs/practices/consumer-migration.md."
---

# Iconography

## Intent

In a text-rich RPG community — discussion threads, character sheets, the shared
library — icons are functional UI tools, not decoration. They let players and
game masters find actions and navigation quickly (wayfinding and scannability),
they keep a given meaning looking the same everywhere it appears (semantic
consistency — a recurring action carries one mark wherever it shows up), and
they reinforce the visual hierarchy of a dense interface.

This capability owns the icon **vocabulary and the design principles for using
it**: why and when an icon is used, when it may stand alone, how it pairs with
labels, and which semantic nouns exist and what they mean. It also owns the
governance that keeps the vocabulary trustworthy. It does *not* own how a single
icon renders — sizes, contextual colour, the size-standardization mechanism, the
missing glyph, and the assistive-technology announcement are the Icon
component's contract (`specs/design-system/components/cn-icon/spec.md`), which
this spec anchors to as their owner.

The observable deliverable is a design-system book page where a consumer can
**read how to use icons in Pelilauta**: the principles, the do's and don'ts, and
the available vocabulary grouped by purpose.

## Usage Principles

### Clarity over decoration

- Use an icon only when it aids understanding or visually anchors an
  interaction. If an icon makes an element ambiguous, omit it or pair it with a
  visible label.
- Icon-only controls are reserved for near-universal actions (close, search,
  menu, settings). Complex or domain-specific actions (*Publish campaign*,
  *Archive thread*) always carry a visible text label.

### Accessibility in use

- An icon-only control always has an accessible name that states its action,
  not its picture; a standalone (non-control) icon conveys its noun's meaning to
  assistive technology. Either way the *mechanism* is the Icon contract's; this
  principle governs that consumers provide a name for icon-only controls.
- An icon is never the only signal of a state; colour or shape change is paired
  with text or another structural indication.

### Consistency of size and alignment

- Use the design system's standard icon sizes rather than arbitrary values; a
  context that needs one size standardizes the icons within it (mechanism owned
  by the Icon contract).
- When an icon sits beside text, it aligns to the text rather than floating; the
  consuming layout owns that alignment, matching legacy behaviour.

### Do and don't

- **Do** pair an unfamiliar or domain icon with a visible label; **don't** ship
  an ambiguous icon alone.
- **Do** keep icon sizing uniform within a list or navigation group; **don't**
  mix sizes or pull in ad-hoc external SVGs inline.
- **Do** give interactive icons an adequate click/touch target; **don't** attach
  actions to a bare inline glyph with no target padding.

## Vocabulary

- Every icon is identified by a semantic noun from the approved catalog. Nouns
  describe meaning (`search`, `fox`), not appearance, so artwork can be revised
  without renaming the noun.
- The book presents the available vocabulary **grouped by the purposes the
  catalog actually serves** (for example navigation & system, community &
  interaction, tabletop/gaming tools), each noun with its meaning and typical
  context, so a consumer chooses by intent rather than by guessing a name. A
  purpose group appears only when the catalog contains icons for it; the book
  never names an empty group or an icon that does not exist.
- The book enumerates the community nouns in full and the managed (myrrys) icons
  in full when the managed submodule is present, with the bundled fallback shown
  as the always-available safety net. The managed tier is enumerable, so its
  icons are listed, not merely exemplified.
- Within the tier that resolves it, one noun maps to exactly one piece of
  artwork, whether statically authored or supplied from data.
- Aliases (one noun pointing at another's artwork) are deliberately out of scope
  until a real consumer need appears; the capability governs distinct nouns
  only.

## Where Icons Come From (governance)

Supporting detail behind the vocabulary; the principles above are the primary
content.

- The catalog is repository-owned, reviewed artwork. Adding, removing, or
  re-pointing a noun is a human-approved product decision, never an incidental
  effect of a surface migration.
- **Admission.** A community noun is added by a human-approved change that
  records the artwork's source in the community `PROVENANCE.md` and confirms it
  is project-licensable. Community-tier membership confers project licensing;
  the row records the source, not a per-row licence string. Community artwork is
  monochrome and authored to inherit the surrounding foreground.
- **Porting is one at a time.** Community icons are ported from the existing
  pelilauta application decisively, one at a time — each an individual
  human-approved admission, never a bulk import — so the catalog grows alongside
  the per-consumer Cyan migrations rather than ahead of a real need.
- **Source tiers** resolve in precedence **community → managed → bundled
  fallback → missing glyph** (ported from v20 `02880fbc`): community
  (project-licensed monochrome, in-repo, with provenance), managed (proprietary
  branded artwork from `@myrrys/proprietary`, optional at build and runtime —
  absent degrades through the remaining tiers rather than failing), bundled
  fallback (`packages/design-system/components/icon-fallback.ts`, MIT, always
  available), and the missing glyph for an unknown, empty, or absent noun.
- Proprietary artwork is never stored in this repository; it lives only in the
  managed submodule. Public SVGs under `apps/pelilauta/public/icons/` are
  retained at their current URLs while any legacy Cyan `cn-icon` consumer still
  fetches `/icons/{noun}.svg`.

## Non-Goals

- Does not define the Icon rendering contract — sizes, the size-standardization
  mechanism, colour resolution, missing-glyph rendering, and the
  assistive-technology announcement are owned by the `cn-icon` spec.
- Does not redesign existing artwork or rename persisted or dynamic nouns.
- Does not invent artwork or aliases for nouns absent from every approved
  source, nor promise icons the catalog does not contain; the book documents the
  vocabulary that actually exists.
- Does not introduce new registry, build-orchestration, or catalog automation
  beyond the existing generator.
- Does not decide whether the book content extends the existing Icon book page
  (`packages/design-system/pages/components/IconPage.astro`) or is a new page —
  that is a plan decision. It requires only that the content above is readable,
  without duplicating the Icon component's existing size, colour, and fallback
  demonstrations.

## Contract

### Definition of Done

- **The design-system book makes icon usage readable on
  `design.pelilauta.social`.** A consumer can read the usage principles (clarity
  over decoration, accessibility in use, size & alignment) with concrete do's
  and don'ts, and the available vocabulary grouped by the purposes the catalog
  serves — the community nouns and the managed (myrrys) icons enumerated in full
  (managed when its submodule is present), with the bundled fallback shown as
  the safety net, and only populated purpose groups shown. This is the
  capability's observable deliverable; the spec is its intent.
- Every noun in `packages/design-system/icons/community/` is project-licensable
  artwork with a `PROVENANCE.md` row recording its source, and no proprietary
  artwork is committed to this repository.
- Each Acceptance item below maps to a deterministic check or a named human
  review.

### Regression Guardrails

- No community-tier artwork is present without a `PROVENANCE.md` row naming its
  source, and no row names a noun with no artwork file.
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

- **Icon usage is readable from the DS book (human, primary).** On
  `design.pelilauta.social`, a consumer can read the usage principles and do's
  and don'ts, and the available vocabulary grouped by purpose (community nouns
  and managed (myrrys) icons enumerated in full — managed when its submodule is
  present — bundled fallback as the safety net; only populated purpose groups
  shown). The page is legible in both Light and Dark. (Icon rendering across
  modes is the Icon contract's acceptance, not re-verified here.)
- **Catalog ↔ provenance parity (deterministic).** Every artwork file under
  `packages/design-system/icons/community/` has exactly one `PROVENANCE.md`
  row, and every row (other than the header) names an existing artwork file;
  each row records a source.
- **Absent-submodule resolution (deterministic).** Building both apps with the
  `@myrrys/proprietary` submodule absent completes, and the managed-only probe
  noun `dd5` resolves to the missing glyph rather than failing.
- **Community authoring (deterministic).** Every SVG under
  `packages/design-system/icons/community/` declares `fill="currentColor"`.
- **Governance review (human).** A human review confirms the admission rule and
  tier assignment match the artwork and provenance actually present, and that
  the book reflects them.
