# Chrome

A plan coordinates an active epic. Its entries exist to make the work and what
remains legible, not as a delivery record. It may be deleted after the epic closes;
deletion is not a closeout requirement.

## Goal

Pelilauta replaces Cyan's v18 application bar, rail and contextual tray with local
v20 chrome. One chrome container holds the application controls without taking over
document scrolling, and every page's main region cedes the space occupied by the
responsive chrome. The chrome also provides a theme switch whose authenticated value
persists on the Pelilauta account.

## Success criterion

1. No Pelilauta layout renders `cn-app-bar`, `cn-navigation-icon`, `cn-tray-button`,
   `nav#rail` or `nav#tray`, or depends on Cyan's chrome styles.
2. The application bar and navigation occupy one viewport-sized chrome container;
   document scrolling remains on the document and chrome does not intercept pointer
   input outside its controls and open pop-overs.
3. Mobile has no block-end navigation bar. Its navigation control opens the full tray
   as a pop-over, as it does on tablet.
4. The collapsed tablet and desktop navigation is a rail. An open desktop tray takes
   an inline layout track; pop-over trays do not change the document's available
   inline size.
5. Main and document spacing follows the chrome's occupied block and inline edges at
   every responsive mode, including app-bar, rail, tray and footer clearance.
6. Primary and contextual navigation follow the v20 hierarchy, preserve v18 route and
   authorization behaviour, expose the current destination, and remain keyboard and
   screen-reader operable.
7. An authenticated theme change updates the document immediately and persists the
   canonical account theme field; a later document renders the stored theme without
   a wrong-theme paint.

## Navigation model

v20 replaces v18's independent global rail and right-side contextual tray with one
adaptive leading navigation surface. Primary destinations are tray buttons. A
destination's subordinate routes form labeled link groups that are present in the
full tray and absent from its rail form.

Pelilauta states the destination set, order, active-route rules, authorization and
contextual groups. The design system provides the rail, tray, trigger, scrim, responsive
presentation, focus handling and navigation-item presentation.

The responsive model is:

- mobile: no persistent navigation surface; the trigger opens the full tray as a
  pop-over over a scrim;
- tablet: a persistent rail opens the full tray as a pop-over over a scrim;
- desktop: a persistent rail expands into a tray that takes an inline layout track
  and moves the main region; no scrim is shown.

## Blocking sub-epic

[Chrome Actions](chrome-actions.md) specifies and ships the clickable items used by
the application bar, rail and tray. Its composition UAT completes before container
specifications or implementations proceed, so containers compose settled targets,
indicators and interaction states without redefining their geometry.

## Required specifications

These specifications are approved before the implementation slice that consumes
them.

- `specs/design-system/application-chrome/spec.md` — what the chrome container holds,
  occupied-edge contract, responsive shell geometry, document scroll, pointer input,
  stacking and poster interaction.
- `specs/design-system/components/cn-app-bar/spec.md` — local application bar regions,
  view and modal modes, title behaviour, actions and responsive geometry.
- `specs/design-system/chrome-actions/spec.md` — the shared chrome target, state
  surface and foreground for a native button and anchor, extending Actions.
- `specs/design-system/components/cn-theme-switch/spec.md` — controlled theme state,
  accessible label and indication, public component API and the change event emitted
  for a host application to handle.
- `specs/design-system/application-navigation/spec.md` — tray, rail, trigger, scrim,
  primary item and subordinate group semantics; pop-over and push modes; focus,
  escape and state behaviour.
- `specs/pelilauta/navigation/spec.md` — destination order, route matching,
  contextual hierarchy, authenticated and administrator visibility, inbox status and
  layout variants.
- `specs/pelilauta/theme-preference/spec.md` — initial theme resolution, anonymous
  fallback, handling the design-system change event, account persistence, legacy
  `lightMode` compatibility, failure handling and view-transition behaviour.

## Required architecture note

Before changing the account schema, add a Theme preference subsection to
`docs/ARCHITECTURE.md`. It names the canonical field and values, default and read
precedence, write path, legacy `lightMode` compatibility and why the additive field
remains compatible with v18. Optional fields that select user-facing presentation are
UX state Pelilauta chrome keeps: they do not change business logic or make the
shared account document incompatible with live v18. The note also records whether any
Firestore rule change is needed; no destructive data migration is implied.

## Known scope

Outcomes, not steps, in two lists. The set grows as the work finds more.

### Open

#### Phase 1 — Contracts and design-system chrome

- **Chrome actions** — complete `plans/chrome-actions.md` before specifying or shipping
  the application bar, adaptive navigation or application chrome geometry.
- **Chrome specifications** — approve the required contracts above before their
  implementation slices begin.
- **Icon alt text** — an Icon announces and titles its noun, an untranslated internal
  name, wherever a consumer does not pass `decorative`. Chrome is icon-dense and its
  glyphs stand for actions, destinations and the brand, so the noun stops standing in for
  alt text before the bar, rail and tray ship.
  `plans/debt/loader-icon-announces-its-noun.md` records the same defect in the loader.
- **Account theme compatibility note** — record the additive account field and v18
  compatibility boundary in `docs/ARCHITECTURE.md` before changing the schema.
- **Application bar** — ship and book the local `CnAppBar`, including standard and
  modal compositions, without changing Pelilauta call sites.
- **Theme switch** — ship and book the `CnThemeSwitch` component and its public state
  and event contract without reading application stores or persistence, and mount it
  in the temporary application bar so a theme change repaints the current document.
- **Adaptive navigation** — ship and book the local tray, rail, trigger, primary item
  and subordinate-link components with automated responsive and accessibility checks.
- **Application chrome geometry** — ship and book the standalone chrome container and
  its occupied-edge interface with bounded and viewport-sized specimens.

#### Phase 2 — Shell and simple-page migration

- **Pelilauta navigation composition** — assemble the shared v20 hierarchy from v18's
  routes and authorization rules, including active states, inbox count and profile or
  login destination.
- **Standard page shell** — migrate `Page.astro` to the local bar and chrome container;
  remove the mobile bottom bar and make `.app-main` cede only persistent chrome space.
- **Modal and editor shells** — the modal shell is migrated. The editor shell waits for
  the editor's content layout to state where a fixed bar's clearance sits, and for a
  decision on leaving with unsaved work:
  `plans/debt/editor-page-keeps-the-cyan-bar.md`. Where a route reached from a shared
  link returns to is still open; none states a destination yet.
- **Poster and FAB integration** — keep poster attenuation and FAB placement scoped to
  the new chrome container without moving document scroll or intercepting empty space.

#### Phase 3 — Contextual navigation migration

- **Library and docs hierarchy** — move their contextual links beneath the matching
  primary destinations in the full tray and retire their legacy tray markup.
- **Site hierarchy** — move site, page, asset and authorized management links into the
  full tray while preserving anonymous rendering and client authorization islands.
- **Administration hierarchy** — move administrator destinations and tools into the
  full tray while retaining server authorization and client visibility rules.
- **PageWithTray retirement** — move every remaining consumer to the common page shell
  and remove the independent right-side tray layout.

#### Phase 4 — Account theme

- **Account theme schema** — add the canonical optional preference to the account
  schema and write path, retaining the architecture note's legacy read fallback and
  requiring no destructive migration.
- **Shared write contract** — verify the existing account write and Firestore rule
  paths accept the additive UX field and include any required preference-field
  allowlist change without altering authorization or business rules.
- **Initial theme paint** — resolve the canonical preference before themed content
  paints, with the specified legacy, anonymous and unavailable-account fallbacks
  across full page loads and Astro view transitions.
- **Chrome theme switch** — add the theme action to Pelilauta chrome, update the
  document when `CnThemeSwitch` emits its change event and persist the authenticated
  choice to the canonical account field.
- **Theme failure states** — keep the last confirmed theme and expose persistence
  failure through the established feedback path without corrupting account state.

#### Phase 5 — Terminal chrome sweep

- **Layout and spacing sweep** — verify chrome clearance, document padding, footer
  reachability and pop-over behaviour across every layout and responsive mode.
- **Cyan chrome removal** — delete migrated bridges and remove remaining chrome custom
  elements, selectors, tokens and Lit registration only when no other surface reads
  them.
- **Media-query theme holdouts** — `NounSelect` and `AlgoliaSearchApp` theme themselves
  from `prefers-color-scheme`, directly and through Cyan's `.light-only` and
  `.dark-only`, so they keep the operating system's theme while the rest of the
  document follows the switch. Move them onto the document's colour scheme.
- **Navigation verification** — exercise anonymous, authenticated and administrator
  route sets, active hierarchy, theme reload, keyboard traversal and reduced-motion
  behaviour against the approved specifications.

### Done

## Outscoped

- Changing public route URLs or route purposes.
- Destructive account migration or removal of v18-readable fields.
- Authentication behaviour unrelated to the theme preference.
- Persisting navigation state on the shared account.
- Migrating page-specific FAB contents or business rules.
- Redesigning footer content or page content-container modes.
