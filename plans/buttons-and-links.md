# Links, Actions and Buttons

## Goal

At the end of this epic cycle, the v21 design system owns the links and buttons
Pelilauta renders from native anchors and buttons, including anchors presented as
buttons and floating action buttons placed in a FAB tray. Pelilauta no longer
depends on Cyan for their appearance, interaction states or FAB placement, and
navigation remains semantically distinct from actions.

## Success criterion

1. Approved design-system specifications define native links, native action
   buttons, link buttons, floating action buttons and the FAB tray, their shared
   states, and the semantic boundary between navigation and commands
2. The design-system CSS entry point styles those elements and the FAB tray without
   a component wrapper or hydration, using v21-owned tokens and preserving v20's
   button and FAB visual language
3. The design system owns v20's accessible, reduced-motion-aware Svelte CnLoader,
   including its inline button state and its standalone loading state, and Pelilauta
   no longer renders Cyan's `cn-loader` element
4. A Base book named **Links, Actions and Buttons** teaches the semantic choice and
   renders links plus v20's regular and floating button materials from source in
   Light and Dark
5. Pelilauta's native link, button and FAB call sites use the approved elements,
   classes and tray without changing their destinations, commands, form behaviour,
   disabled behaviour, accessible names or contextual availability
6. Pelilauta has no live dependency on Cyan's link, core button, FAB or FAB-tray
   selectors, tokens, type roles, icon and loader hooks, or application bridge rules
7. The temporary link and button rules have left `docs.css`, and the deprecated
   `.no-decoration`, `.no-underline` and `.hover-underline` atomics have left
   Pelilauta without being ported or replaced

## Known scope

Decisions belong to the capability specifications this epic delivers. The Base book
is an intentional departure from v20's standalone **Buttons** core book: it combines
links, the distinction between navigation and actions, and the same regular and
floating button material under **Links, Actions and Buttons**.

### Open

- **Capability contracts** — links, actions, button and FAB presentation, and FAB-tray
  placement, including which concerns remain owned by Typography, Icon, Preflight,
  App Shell and the colour and spatial systems
- **Interaction and type inputs** — close the v20 button label, motion, focus, surface,
  foreground, geometry, shadow, icon, loader and FAB token dependencies in v21
- **CnLoader capability** — port v20's specification, Svelte component, tokens,
  Component book, accessibility, reduced-motion and standalone and inline states
- **Pelilauta loader migration** — replace Cyan loader elements in button
  micro-transactions and standalone loading states before retiring their bridge rules
- **Native links** — resting, visited where applicable, hover, active and
  keyboard-focus states
- **Deprecated link atomics** — remove `.no-decoration`, `.no-underline` and
  `.hover-underline` from Pelilauta without porting or replacing them
- **Native and link buttons** — raw `button` and `a.button`, default, text, CTA and
  `.button.secondary` variants, disabled and loading states, focus and pointer feedback
- **Button composition** — labelled, leading-icon and icon-only controls, forced-small
  icons and loaders, grid-aligned touch area, intrinsic and stretched layout
- **Floating action buttons** — `button.fab`, `a.fab` and `a.button.fab`, including
  default, CTA, secondary and small variants, icon and loader composition, and their
  interaction and disabled states
- **FAB tray** — v21-owned fixed viewport placement, stacking, spacing, z-index and
  mobile-rail avoidance for the single `nav#fab-tray` exposed by Pelilauta's page layouts
- **Links, Actions and Buttons book** — a Base book with semantic guidance, live links,
  every v20 regular and floating button variant and state, CnLoader micro-transactions,
  link buttons, FAB-tray composition, icon sizing, stretching and token roles
- **Design-site cleanup** — remove the temporary link and button presentation from
  `docs.css` once the package-owned capability replaces it
- **Pelilauta call-site classification** — reconcile bare elements and legacy `button`,
  `link`, `text-link`, `cyan-button`, `primary`, `outlined`, `call-to-action`, `fab`
  and deprecated link-atomic vocabulary
- **Pelilauta link migration** — content, navigation and component-owned links retain
  their destinations and accessible identity while Cyan's global link rules become unused
- **Pelilauta action migration** — commands and form controls retain their handlers,
  submission semantics, disabled state, progress feedback and accessible identity
- **Pelilauta FAB migration** — contextual actions retain their availability, order and
  meaning while their buttons and page-layout trays move to the local design system
- **Cyan independence sweep** — remove reached link, button, FAB and FAB-tray bridges,
  then prove the applications and the Base book render the capability from the local
  design system alone

### Done

- None

## Outscoped

- Toggle, reaction, tray, avatar and share custom elements
- Chips, tags and other controls with their own interaction language
- Toolbars and non-FAB action-row layout
- Navigation, ordinary trays and application-shell layout outside the FAB tray
- Cyan's deprecated global `.secondary` surface atomic
- Form fields other than their native submit, reset and action buttons
- Application commands, mutations, routing and authorization behaviour
