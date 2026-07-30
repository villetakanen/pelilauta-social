---
status: approved
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
  the icon does not define or promise the values itself. The values are
  `specs/design-system/design-tokens/spec.md`'s to set.
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
- Icon does not own the surrounding control, layout, or typography rules that
  establish that context. While migrated icons coexist with Cyan contexts,
  reached cross-capability selectors must be preserved by minimal application
  migration helpers, not by intrinsic Icon styling. The relevant local Button,
  Fab, layout, or typography capability must absorb the behavior and remove its
  helper when that context migrates.
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
- The icon carries an `aria-label` for assistive technology that defaults to
  its noun. A consumer may supply an explicit `aria-label` that overrides the
  noun as the icon's aria-label, for cases where the technical noun is not the
  meaning to convey (for example a brand mark). This affects ARIA only; the
  artwork title (tooltip) stays the noun. This preserves the intent of v18
  consumers that set an accessible label on the legacy element.
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
  URL for as long as any legacy Cyan icon consumer remains in the application,
  **except** for a noun the project has explicitly decided to retire. A
  human-approved retirement may delete the public SVG even while legacy Cyan
  consumers still reference it, accepting that those consumers render the
  missing/blank glyph in the interim until they migrate to the local component.
  Each retirement is recorded (source removed, decision, and the affected
  legacy consumers) so the transitional blank is a known, deliberate state, not
  a silent regression.
- An unknown, empty, or absent noun never silently collapses its layout
  space.
- Contextual size standardization (for example, icons inside buttons and fabs
  rendering at the button icon size regardless of their own size selection)
  resolves against the local icon component. When a surface migrates off a
  legacy Cyan `cn-icon` element-scoped size or layout rule, the equivalent
  standardization is re-expressed against the local component so the context
  behavior survives; it is not left to per-consumer hardcoding or silently
  dropped.
- Until the owning local context exists, required cross-capability behavior is
  isolated in an application migration helper. It does not enter stable Icon
  CSS, and the helper is removed when its named local capability takes
  ownership.

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
- Assistive technology continues to receive the icon's noun as in v18 through
  its aria-label; an explicit aria-label, when supplied, overrides the noun.
- A human review confirms the design-system book's size, color, and fallback
  examples in both modes. Application consumer migrations separately review
  their rendered-in-context size, spacing, and layout in one theme unless the
  slice changes the color or theming capability.
