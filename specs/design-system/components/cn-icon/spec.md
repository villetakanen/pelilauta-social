---
status: draft
provenance:
  - "v18 icon contract: @11thdeg/cyan-lit@4.0.0-beta.30 cn-icon (noun attribute, xsmall/small/large/xlarge with medium default, /icons/{noun}.svg#icon)"
  - "v20 target model: immutable commit 02880fbc995b45d459ce4f264b29d5283b1d8ced (trusted registries, precedence, server-rendered markup, source-owned color)"
  - "Current-only compatibility assets: apps/pelilauta/public/icons/ (search, bsky, label-tag, undo, pbta-logo)"
  - "Findings and decisions: docs/lessons/feat-cn-icon.md"
---

# Icon

## Intent

Icons give familiar actions, objects, systems, and identities a compact visual
form within Pelilauta. They support surrounding content and controls; they do
not replace understandable labels where a label is needed.

The goal is a stable icon vocabulary that renders consistently in the initial
page, participates naturally in its surrounding color and typography, and
preserves intentional artwork across Light and Dark modes.

## Vocabulary

- Each icon is identified by a semantic noun from the approved Pelilauta icon
  catalog.
- A noun resolves deterministically to one piece of artwork.
- Unknown nouns use a recognizable missing-icon fallback and retain their
  layout space.
- Monochrome and branded artwork belong to the same vocabulary but have
  different color behavior.

## Visual Behavior

- Icons are square and align naturally with adjacent text and controls.
- The supported sizes are extra small, small, medium, large, and extra large.
- Medium is the default.
- Established target sizes are 16, 24, 36, 72, and 128 pixels at the default
  root font size.
- Monochrome artwork inherits the surrounding foreground color, including
  link, button, selected, status, hover, active, and disabled states.
- Branded artwork preserves its approved internal colors, strokes, and opacity.
- Icon geometry and color do not shift when client-side behavior becomes ready.

## Accessibility

- Icons are decorative by default and are hidden from assistive technology.
- A control or meaningful icon receives an accessible name from visible text or
  its containing control, not from an internal technical noun.
- An icon must not be the only means of communicating a state when text or
  another accessible indication is required.

## Product Goals

- Common icon nouns look the same across Astro and Svelte surfaces.
- Contextual color works in both Light and Dark modes without per-instance
  corrective styling.
- Missing artwork is visible and diagnosable instead of silently collapsing.
- The catalog can retain Pelilauta-specific and approved brand artwork while the
  legacy Cyan icon mechanism is retired incrementally.
- The design-system book makes the vocabulary, sizes, color behavior, fallback,
  and accessibility intent reviewable.

## Non-Goals

- This capability does not redesign existing artwork or rename persisted and
  dynamic nouns as part of an unrelated surface migration.
- It does not make every decorative icon independently announce itself.
- It does not require importing every possible icon before a current product
  consumer needs it.
- It does not require removing other Cyan Lit components when the first local
  icon consumers ship.

## Acceptance

- A monochrome icon's visible color follows its surrounding foreground through
  normal and interactive states in both modes.
- Approved branded icons retain their intended colors in both modes.
- Every supported size has stable square geometry and alignment.
- Known nouns render their intended artwork and unknown nouns render the stable
  fallback.
- Initial server-rendered content includes the icon without waiting for a
  custom-element upgrade.
- Assistive technology does not announce technical noun identifiers by default.
- The production slice and design-system book demonstrate the same approved
  intent.
