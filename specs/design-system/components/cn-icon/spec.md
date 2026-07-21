---
status: approved
provenance:
  - "v18 icon contract: @11thdeg/cyan-lit@4.0.0-beta.30 cn-icon (noun attribute, xsmall/small/large/xlarge with medium default, /icons/{noun}.svg#icon, empty noun renders the design icon, unknown noun renders a blank sized box, SVG title announces the noun)"
  - "v20 target model: immutable commit 02880fbc995b45d459ce4f264b29d5283b1d8ced (trusted registries, precedence, server-rendered markup, source-owned color, missing glyph)"
  - "Current-only compatibility assets: apps/pelilauta/public/icons/ (search, bsky, label-tag, undo, pbta-logo)"
  - "Findings and decisions: docs/lessons/feat-cn-icon.md"
  - "Human decisions 2026-07-20: empty noun treated as unknown; missing-icon fallback accepted as deliberate change; v18 assistive-technology noun announcement retained"
  - "Human decision 2026-07-21: the five icon sizes are all legitimately used, so an icon renders at its selected size by default. A context that needs one icon size standardizes every icon within it to that context's size regardless of the icon's own selection — buttons and fabs render icons at the button icon size — as a design-system rule resolving against the local component, not per-consumer hardcoding. Intended mechanism is that the context sets the public --cn-icon-size-* tokens within its scope, refining v20 packages/cyan/src/core/buttons.css and fab.css at 02880fbc, which force the component's private --icon-dim with !important. Legacy Cyan CSS expressed these rules against the cn-icon element, which the migrated class-based markup does not match (docs/lessons/feat-cn-icon.md finding 20)"
  - "Established v18 sizing evidence: 16, 24, 36, 72, 128 px at default root font size (@11thdeg/cyan-css@4.0.0-beta.39 dist/tokens/units.css)"
---

# Icon

## Intent

Icons give familiar actions, objects, systems, and identities a compact visual
form within Pelilauta. They support surrounding content and controls; they do
not replace understandable labels where a label is needed.

The goal is a stable icon vocabulary that renders consistently in the initial
page, participates naturally in its surrounding color, and preserves
intentional artwork across Light and Dark modes.

## Vocabulary

- Each icon is identified by a semantic noun from the approved Pelilauta icon
  catalog. The catalog is repository-owned, reviewed artwork; adding a noun,
  artwork, or alias is a human-approved product decision.
- A noun resolves deterministically to one piece of artwork, whether the noun
  is statically authored or supplied from data.
- Unknown nouns render the approved missing-icon glyph and retain their layout
  space. This is a deliberate change from v18, which rendered a blank sized
  box for an unknown noun.
- An empty or absent noun is treated as unknown. This is a deliberate change
  from v18, which rendered the default design icon when the noun was empty.
- Monochrome and branded artwork belong to the same vocabulary but have
  different color behavior.

## Visual Behavior

- Icons are square inline-level boxes. Vertical alignment against adjacent
  text and controls is owned by the consuming layout, matching legacy
  behavior; the icon itself imposes no alignment rule.
- The supported sizes are extra small, small, medium, large, and extra large.
  Medium is the default.
- Each size takes its dimensions from the design-system icon sizing tokens;
  the icon does not define or promise the values itself. The established v18
  values are recorded in this spec's provenance as compatibility evidence.
- All five sizes are legitimately used across the application, so an icon
  renders at its selected size by default, medium when unspecified.
- A context that requires a single icon size standardizes every icon it
  contains to that context's size, regardless of each icon's own size
  selection — for example, icons inside buttons and fabs render at the button
  icon size. The intended mechanism is that the context sets the icon-size
  tokens within its own scope; because the icon resolves its size from those
  tokens, every icon inside then renders at the context's size without reading
  each icon's selection. This is a design-system rule that resolves against the
  local icon component, so it applies equally to migrated icons; sizing an icon
  for a context is not each consumer's responsibility.
- Monochrome artwork inherits the surrounding foreground color, including
  link, button, selected, status, hover, active, and disabled states. Current
  production deviates from this because a global theme property overrode the
  contextual fallback; restoring inheritance is part of this capability's
  intent, not a new behavior.
- Branded artwork preserves its approved internal colors, strokes, and
  opacity, as encoded in the reviewed source artwork.
- Icon geometry and color do not shift when client-side behavior becomes
  ready.

## Accessibility

- An icon exposes its noun to assistive technology through its artwork title,
  preserving observed v18 behavior. Making icons decorative by default is an
  explicit future product decision, not part of this capability.
- An icon that is the sole content of a control does not provide the
  control's accessible name; the consuming control supplies one from visible
  text or an explicit label.
- An icon must not be the only means of communicating a state when text or
  another accessible indication is required.

## Product Goals

- Common icon nouns look the same across server-rendered and client-hydrated
  surfaces.
- Contextual color works in both Light and Dark modes without per-instance
  corrective styling.
- Missing artwork is visible and diagnosable instead of silently collapsing.
- The catalog can retain Pelilauta-specific and approved brand artwork while
  the legacy Cyan icon mechanism is retired incrementally.
- The design-system book makes the vocabulary, sizes, color behavior,
  fallback, and accessibility intent reviewable.

## Non-Goals

- This capability does not redesign existing artwork or rename persisted and
  dynamic nouns as part of an unrelated surface migration.
- It does not touch the SVG files served under the public `/icons/` path.
  Remaining legacy Cyan icons fetch their artwork from those URLs in the
  browser, so the files stay in place until the last legacy consumer is
  migrated.
- It does not invent artwork or aliases for nouns that are absent from both
  approved sources; such nouns remain explicit product decisions.
- It does not require importing every possible icon before a current product
  consumer needs it.
- It does not require removing other Cyan Lit components when the first local
  icon consumers ship.

## Contract

### Definition of Done

- The selected production surfaces render their icons from the local
  capability in the initial server response.
- The design-system book demonstrates every supported size, monochrome and
  branded color behavior, and the missing-icon fallback in both modes.
- The acceptance criteria below each pass a deterministic check or the named
  human review.

### Regression Guardrails

- A legacy Cyan icon consumer's visible color resolves to its contextual
  foreground; no global theme property may re-break that inheritance.
- Every SVG under the public `/icons/` path stays available at its current
  URL for as long as any legacy Cyan icon consumer remains in the
  application.
- An unknown, empty, or absent noun never silently collapses its layout
  space.
- Contextual size standardization (for example, icons inside buttons and fabs
  rendering at the button icon size regardless of their own size selection)
  resolves against the local icon component. When a surface migrates off a
  legacy Cyan `cn-icon` element-scoped size or layout rule, the equivalent
  standardization is re-expressed against the local component so the context
  behavior survives; it is not left to per-consumer hardcoding or silently
  dropped.

## Acceptance

- A monochrome icon's visible color follows its surrounding foreground
  through normal and interactive states in both modes, verified by a
  computed-color assertion from parent to icon.
- Approved branded icons retain the colors encoded in their reviewed source
  artwork in both modes.
- Every supported size renders square, with computed width equal to height at
  the dimension its sizing token defines.
- Known nouns render the artwork the approved catalog assigns them; unknown,
  empty, and absent nouns render the approved missing-icon glyph with
  preserved layout space.
- Initial server-rendered content includes the icon markup before any
  client-side script runs.
- Assistive technology continues to receive the icon's noun as in v18.
- A human review confirms the design-system book's size, color, and fallback
  examples match the migrated production surfaces in both modes.
