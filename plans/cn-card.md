# cn-card

## Goal

At the end of this epic cycle, the v20 card is a specified, documented and
operational v21 design-system component, and every Pelilauta card that depends on
Cyan 4's `cn-card` uses it instead. The front page adopts the v20 card hierarchy
without losing the v18 application behaviour carried by its thread and site cards
or the neighboring onboarding callout.

## Success criterion

1. The design system owns a tested, server-renderable Svelte CnCard and its approved
   specification; its structure, states and visual language follow v20
2. A component book explains CnCard's public API and renders its variants from source
3. Every current `cn-card` consumer in Pelilauta uses the local CnCard, with existing
   application behaviour and link destinations preserved unless the approved spec
   records an intentional v20 change
4. Thread and site cards plus the onboarding callout on the front page form the epic's visual
   acceptance surface across narrow and wide containers, authenticated and anonymous
   sessions, covers, no covers and unreachable covers, and light and dark themes
5. Pelilauta no longer contains a `cn-card` call site, a `CnCard` type dependency, or
   a Cyan light-DOM bridge whose only reader is `cn-card`

## Known scope

Decisions live in the specs these stories deliver: `specs/design-system/surface/spec.md`
and `specs/design-system/components/cn-card/spec.md`.

### Open

- **Character and keeper library cards** — the character and keeper cards move together so
  their listings stay coherent
- **Workflow and status cards** — thread information, Bluesky sharing, character creation,
  keeper empty and error states, and admin sheet tooling adopt CnCard without changing the
  workflows they host
- **CnCard containment acceptance** — waits on the remaining consumers; real cards at the
  containers the application renders them in
- **Cyan `cn-card` retirement** — waits on the remaining consumers; card-only light-DOM
  rules, type imports and legacy selectors go, and the remaining layout bridges name their
  owner and deletion condition

### Done

- **Surfaces and elevation**
- **Call-site classification**
- **CnCard capability contract** — one approved spec
- **CnCard foundation**
- **Surfaces and elevation book**
- **CnCard component book**
- **Front-page onboarding callout** — a Surface, not a card
- **Site cards** — every site listing
- **Unreachable cover** — falls back to the system artwork
- **Front-page thread cards** — and the profile listing
- **Read-state integration** — through CnCard's state classes

## Outscoped

- ReactionButton's Cyan element and its Firestore writes
- Loader elements rendered inside card content
- `content-cards` and other application-wide listing layouts
- Subscription, profile, site, character and admin business logic
- The 41 `.surface` compositions that never consumed `cn-card`
- Spacing between cards
