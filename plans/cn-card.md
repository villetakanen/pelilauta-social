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

- **Surfaces and elevation** — delivered; the elevation utilities and the nesting engine
- **Call-site classification** — delivered; each `cn-card` consumer is a CnCard, a plain
  surface, or removed, and the migration stories below are the result. A static v18 box
  moves to the elevation utilities, not to CnCard
- **CnCard capability contract** — delivered; the Cyan element and v20's card resolved
  into one approved spec, including what v21 omits from either
- **CnCard foundation** — delivered; the local Svelte component, its styles and its tests
- **Surfaces and elevation book** — delivered; Colour & Surface, `/base/surface`, and the
  `.surface` padding role in Spatial System
- **CnCard component book** — delivered; the API and every state rendered from source
- **Front-page onboarding callout** — delivered; an application-owned system Surface, not
  a preview card
- **Site cards** — delivered; one application-owned SiteCard across every site listing
- **Unreachable cover** — delivered; the cover falls back to the capability's own artwork
- **Front-page thread cards** — delivered; also covers the profile thread listing, which
  renders the same component
- **Read-state integration** — delivered with the thread cards; unread signalling reaches
  an unhydrated card through CnCard's published state classes
- **Character and keeper library cards** — open; the character and keeper cards move
  together so their listings stay coherent
- **Workflow and status cards** — open; thread information, Bluesky sharing, character
  creation, keeper empty and error states, and admin sheet tooling adopt CnCard without
  changing the workflows they host
- **CnCard containment acceptance** — open, waits on the remaining consumers; real cards
  at the containers the application renders them in
- **Cyan `cn-card` retirement** — open, waits on the remaining consumers; card-only
  light-DOM rules, type imports and legacy selectors go, and the remaining shared layout
  bridges name their future owner and deletion condition

## Outscoped

- ReactionButton's Cyan element and Firestore write implementation — a reactions epic;
  this epic preserves and composes the existing control
- Loader elements rendered inside card content — a loader epic
- `content-cards` and other application-wide listing layouts — a layout epic; only the
  smallest bridge required by migrated CnCard consumers remains here
- Redesigning subscription, profile, site, character or admin business logic — the
  owning application capabilities; CnCard only preserves their current composition
- Migrating the application's 41 `.surface`-class compositions that do not consume
  `cn-card` — their owning component epics; the elevation utilities shipped here are
  what they will migrate onto
- Spacing between cards — a listing layout's decision; no card margin token exists
  and none is added
