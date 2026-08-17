# Chrome Actions

A plan coordinates an active epic. Its entries exist to make the work and what
remains legible, not as a delivery record. It may be deleted after the epic closes;
deletion is not a closeout requirement.

## Goal

The design system provides one coherent interactive vocabulary for application
chrome before the app bar, rail and tray containers are built. Bar actions, tray
controls, rail destinations and expanded-tray destinations share intentional target
sizes, icon geometry and state feedback while preserving their native semantics.

## Success criterion

1. A chrome action reads as part of application chrome rather than as a content
   button, in Light and Dark and at every supported browser text size.
2. Bar actions and tray destinations align to a declared grid, target and icon-size
   system, whether the tray shows labels or has narrowed to a rail.
3. Hover, press, keyboard focus and current destination are distinguishable without
   changing an action's footprint.
4. Anchors remain destinations, buttons remain commands, and current-route state is
   not represented as a pressed command.
5. The theme, profile, search, share, back and tray controls can adopt the vocabulary
   without private geometry in their containing bar, rail or tray.
6. Human UAT accepts bounded bar, rail and expanded-tray compositions before a
   responsive chrome container is specified.

## Design basis

Material 3 separates [icon buttons](https://developer.android.com/develop/ui/compose/components/icon-button),
which expose momentary and toggle actions, from
[navigation rail items](https://developer.android.com/develop/ui/compose/components/navigation-rail),
which expose top-level destinations and selected state. The current Compose
[navigation-rail implementation](https://android.googlesource.com/platform/frameworks/support/+/15ccca2bd51eab204fbee3c140a3076621e8ea61/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/NavigationRail.kt)
keeps the item and its indicator as separate geometry. Pelilauta follows that
division while deriving its measurements and appearance from the local grid, colour,
type and action systems.

The shared vocabulary does not imply one component. Native semantics and state decide
whether a consumer renders an icon action, a navigation destination, a tray toggle or
an identity action.

## Known scope

### Open

- **Composition UAT** — publish bounded bar, compact-rail and labelled-tray specimens;
  accept alignment, density, affordance and every interaction state in both themes.
- **Container handoff** — amend `plans/chrome.md` with the approved item measurements
  and state contracts that AppBar, rail and tray may compose but not redefine.

### Done

- The chrome action class shipped: both presentations, on button and anchor.
- `CnThemeSwitch` composes the chrome action and supplies its change event.
- Navigation destination: the `aria-current` indicator shipped in the class.
- Back, share, identity and notification actions shipped, specs approved.
- The tray toggle shipped as `CnRailAction`, governed by the rail spec.
- `CnRailAction`'s trigger composes the chrome action instead of restating it.
- `docs/ARCHITECTURE.md` names interaction states after the platform selector that
  switches them on, and reserves `--cn-indicator` for persistent state.
- `specs/TEMPLATE.md` defines how one capability extends another.

## Outscoped

- App-bar title, elevation, placement and scroll behavior.
- Rail, tray, scrim and responsive container geometry.
- Pelilauta route hierarchy and authorization rules.
- Account-backed theme persistence and initial theme paint.
- Content buttons, floating actions and form controls.
