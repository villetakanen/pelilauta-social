---
status: approved
---

# Iconography

## Intent

Pelilauta is text-rich — discussion threads, character sheets, the shared library —
so an icon here is a tool for finding things, not decoration.

This capability decides the icon vocabulary and how to use it: when an icon is
used, when it may stand alone, how it pairs with labels, which semantic nouns
exist and what they mean, and the governance that keeps the catalog trustworthy.
How a single icon renders is `specs/design-system/components/cn-icon/spec.md` —
sizes, contextual colour, the size-standardization mechanism, the missing glyph,
and the assistive-technology announcement.

## Usage Principles

### Clarity over decoration

- Use an icon only when it aids understanding or visually anchors an
  interaction. If an icon makes an element ambiguous, omit it or pair it with a
  visible label.
- Icon-only controls are reserved for near-universal actions (close, search,
  menu, settings). Complex or domain-specific actions (*Publish campaign*,
  *Archive thread*) always carry a visible text label.

### Accessibility in use

- An icon-only control always has an accessible name that states its action, not
  its picture. A consumer supplies that name; the mechanism is the Icon contract.
- An icon is never the only signal of a state; colour or shape change is paired
  with text or another structural indication.

### Consistency of size and alignment

- Use the standard icon sizes rather than arbitrary values. A context that needs
  one size standardizes the icons within it; the mechanism is the Icon contract.
- An icon beside text aligns to that text. The consuming layout states the
  alignment.

## Vocabulary

- Every icon is identified by a semantic noun from the approved catalog. Nouns
  describe meaning (`search`, `fox`), not appearance, so artwork can be revised
  without renaming the noun.
- A consumer can find an icon by the intent it serves, without guessing a name.
- The published vocabulary is the catalog: every noun the catalog contains is
  listed, and nothing that is not in it is named.
- Within the tier that resolves it, one noun maps to exactly one piece of
  artwork, whether statically authored or supplied from data.
- Aliases (one noun pointing at another's artwork) are deliberately out of scope
  until a real consumer need appears; the capability governs distinct nouns
  only.

## Where Icons Come From (governance)

- Adding, removing, or re-pointing a noun is a product decision a human approves.
  It is never an incidental effect of a surface migration.
- **Admission.** Admitting an open-source noun records the artwork's source in the
  tier's `PROVENANCE.md` and confirms its licence permits redistribution and
  modification. Every row states which of two kinds it is: project-created
  artwork, or permissively licensed third-party artwork. A third-party row names
  the copyright holder, the licence, and the upstream repository at an immutable
  commit, and the licence text is vendored beside the artwork. Open-source artwork
  is monochrome and inherits the surrounding foreground.
- **One at a time.** Icons are admitted individually, never as a bulk import, so
  the catalog grows alongside the Cyan migration that needs each one.
- **Source tiers** resolve in precedence **open-source → managed → bundled
  fallback → missing glyph** (ported from v20 `02880fbc`): open-source
  (openly licensed monochrome, in-repo, with provenance), managed (proprietary
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
  assistive-technology announcement are the `cn-icon` spec's.
- Does not redesign or re-point artwork as an incidental effect of a consumer
  migration, or rename persisted or dynamic nouns.
- Does not invent artwork or aliases for nouns absent from every approved source,
  nor promise icons the catalog does not contain.
- Does not introduce new registry, build-orchestration, or catalog automation
  beyond the existing generator.

## Contract

### Definition of Done

- A book on `design.pelilauta.social` carries the usage principles and the
  vocabulary grouped by purpose. It is this capability's observable deliverable,
  and the first Acceptance item states what a reader must find there.
- Every noun in `packages/design-system/icons/open-source/` is openly licensed
  artwork with a `PROVENANCE.md` row recording its source, and no proprietary
  artwork is committed to this repository.
- Each Acceptance item below maps to a deterministic check or a named human
  review.

### Regression Guardrails

- No open-source-tier artwork is present without a `PROVENANCE.md` row naming its
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

- **Icon usage is readable from the book (human, primary).** A reader finds the
  usage principles, a do-and-don't summary, and every noun that resolves, grouped
  by purpose — managed nouns included when the submodule is present, and only
  populated groups shown. The page is legible in Light and Dark. Icon rendering
  across modes is the Icon contract's acceptance and is not re-verified here.
- **Catalog ↔ provenance parity (deterministic).** Every artwork file under
  `packages/design-system/icons/open-source/` has exactly one `PROVENANCE.md`
  row, and every row (other than the header) names an existing artwork file;
  each row records a source.
- **Absent-submodule resolution (deterministic).** Building both apps with the
  `@myrrys/proprietary` submodule absent completes, and the managed-only probe
  noun `dd5` resolves to the missing glyph rather than failing.
- **Open-source authoring (deterministic).** Every SVG under
  `packages/design-system/icons/open-source/` declares `fill="currentColor"`.
- **Governance review (human).** A human review confirms the admission rule and
  tier assignment match the artwork and provenance actually present, and that
  the book reflects them.
