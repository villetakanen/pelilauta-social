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

- **Surfaces and elevation** — delivered; `elevation-0`–`4` and the relative-nesting
  engine ship in `packages/design-system/styles/surface.css` with `.surface` as the
  padded, contained default at level 1, under an approved spec. The three deferred
  decisions are recorded: elevation is background and shadow paired into five levels,
  all five roles are kept, and Surface sets no foreground, so a level-4 consumer picks
  a role that clears AA there. `--cn-border-radius-card` is untouched — Surface sets no
  radius, and the alias is now the CnCard capability contract's decision. Settles
  `plans/debt/book-vocabulary-classes.md` for `.elevation-1` and `.surface`
- **Call-site classification** — open; every `cn-card` consumer and card-shaped
  composition is classified: a CnCard, a plain surface, or removed. A v18 card that is
  a static box moves to the elevation utilities, not to CnCard
- **CnCard capability contract** — open, waits on the classification; reverse-specifies
  the Cyan element and the consumers classified as CnCards, then resolves them against
  v20's CnCard API, semantics, responsive containment, elevation, indicators, links,
  cover treatment and action composition. Anything v21 omits from either source is
  recorded in the spec
- **CnCard foundation** — open, waits on the capability contract; the local Svelte
  component, component tests and public styles implement the approved contract
  without reading Cyan component rules
- **Surfaces and elevation book** — delivered; `/principles/color-system` is Colour &
  Surface and carries the elevation model rendered from the utilities in both themes,
  `/base/surface` is the utility API, and Spatial System takes the `.surface` padding
  role and the grid derivation of the shadows
- **CnCard component book** — open, waits on the foundation; the API, content guidance,
  states, covers, links, actions and narrow-container behaviour render through focused
  specimens on the design site
- **Front-page thread cards** — open, waits on the foundation; the v20 hierarchy lands
  while rich previews, author and channel links, reaction writes, unread indication,
  reply counts and unread-jump destinations keep their shipped v18 behaviour
- **Front-page onboarding callout** — delivered; the anonymous login invitation is an
  application-owned elevation-4 system Surface rather than a preview card. Its
  client-owned session visibility, localization, artwork, login destination and
  existing Cyan Button remain unchanged while the surrounding `cn-card` dependency is
  removed
- **Site cards** — implemented, pending acceptance; one application-owned Svelte
  SiteCard now composes the local CnCard across the front page, public and profile
  listings, the site library, character views and the site-theme preview. It preserves
  responsive images, links, activity time, loading content and each existing consumer's
  owner/player indication
- **Unreachable cover** — delivered; a cover that cannot load falls back to the design
  system's own cover artwork, painted behind the image so the region keeps its geometry,
  tint and noun without a script or hydration. The artwork moved out of the design app's
  `public/` directory into the capability, so the specimen that demonstrates a working
  cover and the fallback are one source. A cover with transparency now composites over
  the artwork rather than the card surface — the accepted cost of a fallback that works
  in a CnCard that is never hydrated
- **Character and keeper library cards** — open, waits on the foundation; reusable
  character and keeper cards move together so their links, membership markers, child
  content and supplied actions remain coherent in card listings
- **Workflow and status cards** — open, waits on the foundation; thread information,
  Bluesky sharing, character creation, keeper empty and error states, and admin sheet
  tooling adopt CnCard without changing the workflows hosted inside them
- **Read-state integration** — open, waits on the front-page thread cards; imperative
  `CnCard` assumptions are removed while authenticated unread signalling continues to
  react to the existing subscription store
- **CnCard containment acceptance** — open, waits on all consumer migrations; real cards
  exercise the typography downshift, long and rich content, action rows, optional
  covers and nested controls at the containers in which the application renders them
- **Cyan `cn-card` retirement** — open, waits on all consumer migrations; card-only
  light-DOM rules, type imports and legacy selectors are removed, and the remaining
  shared layout bridges name their future owner and deletion condition

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
