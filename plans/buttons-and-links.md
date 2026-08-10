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

- None

### Done

- Capability contracts: `specs/design-system/{actions,fab-tray,components/cn-loader}`,
  and the v20 label, motion, focus, surface, geometry, shadow, icon and loader token
  dependencies closed in `units.css`, `color-theme.css` and `buttons.css`
- CnLoader, its Component book, and Pelilauta's loader migration with its bridge retired
- Native links, and the deprecated `.no-decoration`, `.no-underline` and
  `.hover-underline` atomics gone without replacement
- Native and link buttons, their variants, states and composition, with Pelilauta's
  legacy button vocabulary migrated by deletion
- Floating action buttons, and the tray placed against a local viewport-sized container
  (`AppChrome.astro`) rather than by Cyan
- The **Links, Actions and Buttons** Base book, including the tray demonstrated in a
  window-sized and a handheld-sized shell

## Outscoped

- Toggle, reaction, tray, avatar and share custom elements
- Chips, tags and other controls with their own interaction language
- Toolbars and non-FAB action-row layout
- Navigation, ordinary trays and application-shell layout beyond the container the FAB
  tray pins to
- Cyan's deprecated global `.secondary` surface atomic
- Form fields other than their native submit, reset and action buttons
- Application commands, mutations, routing and authorization behaviour
