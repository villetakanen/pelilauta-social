# Replacing v18's UX

v21 replaces Pelilauta v18's user experience with the v20 design system. It is a
breaking change, not an update: screens change shape, and what v18 renders today is not
a target. Business logic, persisted data and the Firebase contract are not part of it.

What follows is what the source cannot tell you. When the migration is done, this file
goes.

## The cascade restyles the application before you touch a call site

v20 and Cyan 4 name the same tokens. Declaring a family's v20 values restyles the
running application the moment they land: cyan-css reads those names and the design
system loads after it. Appearance is therefore accepted twice per family — when the
values land, and again when cyan's remaining rules for that family are removed. Colour
worked this way, typography does, and layout will, where it also means rewriting most
screens.

## `.surface` and `.elevation-*` are shipped, and cyan still declares them

The design system now declares `.surface` and `.elevation-0` through `.elevation-4`
(`packages/design-system/styles/surface.css`). Cyan 4 declares a `.surface` and an
`.elevation-1` to `.elevation-4` of its own at the same specificity, so which one wins
is decided by import order alone: `@11thdeg/cyan-css` first, `@design-system/styles/ds.css`
second, as both `BaseHead.astro` and `EditorHead.astro` do it. Reorder those two imports
and the application silently reverts to Cyan's rules.

These differences land in `apps/pelilauta` the moment the stylesheet ships, without a
call site moving:

- A `.surface` renders at elevation 1, not the ground plane. In Dark it lightens from
  surface-20 to surface-30; in Light it goes from surface-99 to white.
- A `.surface` keeps `--cn-gap` of padding below 620px, where Cyan dropped it to
  `--cn-grid`.
- The design-system `.surface` loads after Cyan's atomic spacing classes at equal
  specificity. Existing compositions such as `.surface.p-1` therefore receive the
  forced Surface inset until the capability that governs them migrates them.
- Cyan's `.surface` still sets `color: var(--color-on-surface)`, because the design
  system's Surface sets no foreground. That declaration disappears with Cyan, and the
  components on those surfaces then own their text colour.
- Nested elevations now show only their rise above the nearest elevated ancestor. A
  one-level rise is shadowless, including an elevation-2 child inside elevation 1.

The remaining call sites are migration inputs, not a stable inventory. The terminal
sweep classifies every use before Cyan's declarations are removed.

## A native dialog arrives in the corner, collapsed

Two design-system rules take away what the UA stylesheet gives a `dialog`, and a
component that renders one sees neither of them.

`styles/preflight.css` zeroes the margin of every element, which removes the
`margin: auto` that centres a modal dialog against its zero inset.

`.surface` is an inline-size query container, so it applies inline-size
containment, which collapses a `fit-content` box, and anything sized against it,
to nothing.

A dialog therefore restates `position: fixed`, `inset: 0`, `margin: auto` and
`fit-content` on both axes, and composes an elevation utility for its surface
rather than `.surface`. `packages/design-system/components/CnLightbox.svelte` is
the worked example.

Both traps survive every check that reads the DOM instead of the rendered box. A
dialog's checks assert its geometry.

## The inherited e2e suite is not evidence

`apps/pelilauta/e2e` came from v18. It is ad hoc, depends on emulator and historical
setup, and is not part of the repository gate, so it cannot be cited as acceptance. Its
selectors read Cyan element tags and go stale as source migrates: inspect a test only
where the change relies on it, and leave the rest to the terminal sweep.

## A local element does not inherit a legacy tag rule

A class-bearing local element does not match a Cyan custom-element tag selector, so
size, margin and layout that arrived through a tag rule have to be re-expressed against
the component. Record what the legacy rule established — properties, values,
specificity and rendered outcome — rather than translating its selector. Icon sizing
comes from the public `--cn-icon-size-*` tokens, never from the component's private
variables.

Svelte's scoped styles do not cross a child-component boundary. Where a consumer carries
the layout around a local component, target the child's public class with `:global(…)`
rather than moving consumer-specific layout into the component to avoid the boundary.

## Temporary bridges have a home

While an unmigrated capability still governs legacy behaviour, keep the smallest bridge
under `apps/pelilauta/src/styles/migrations/`, recording where the behaviour came from,
what still reads the bridge, which capability takes it over, and what has to be true to
delete it. Nothing temporary becomes intrinsic to a migrated component.

## v18 failed invisibly; v21 does not

A v18 SVG 404 painted nothing. A local missing-glyph fallback is visible, so an input
that was quietly absent now shows. Exercise the real missing and optional states: a
build-time resolver can eagerly resolve a dynamic import, so source syntax alone does
not prove an input is optional.

## 21.0.0 actions

- Export `characters` and `charsheets` as Markdown to their authors, then delete both
  collections and clear `useCharacters`, `useCharacterKeeper` and
  `characterKeeperSheetKey` from site documents (ADR 0003).

## Cyan adds eighteen pixels to a chat bar's row

`CnChatBar` stands seven grid units at one line in `apps/design`, and 74px in
`apps/pelilauta`, with the same markup. Removing `@11thdeg/cyan-css` from the page
returns it to 56, so the difference is Cyan's and not the component's.

Measured on a page mounting the bar with a leading menu action and a trailing send
action: the mirror and both buttons stay at 56, and `.cn-menu` — the wrapper around the
menu's trigger — measures 74 while the trigger inside it measures 56. The wrapper is a
flex container in both applications, so a display change is not what does it.

The bar is not chased further while Cyan is loaded, because the row is right where the
stylesheet is not. The terminal sweep re-measures it: a bar whose row is not 56 once
Cyan is gone is the component's defect, and the eighteen pixels are a real finding either
way.

## The terminal sweep

One repository-wide sweep when the migration is believed complete. Resolve every
remaining Cyan reference, or record why it stays and what still needs it. Remove the
compatibility assets no remaining consumer reads, and delete this file.
