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

Svelte's scoped styles do not cross a child-component boundary. Where a consumer owns
the layout around a local component, target the child's public class with `:global(…)`
rather than moving consumer-specific layout into the component to avoid the boundary.

## Temporary bridges have a home

While an unmigrated capability still owns legacy behaviour, keep the smallest bridge
under `apps/pelilauta/src/styles/migrations/`, recording where the behaviour came from,
what still reads the bridge, which capability takes it over, and what has to be true to
delete it. Nothing temporary becomes intrinsic to a migrated component.

## v18 failed invisibly; v21 does not

A v18 SVG 404 painted nothing. A local missing-glyph fallback is visible, so an input
that was quietly absent now shows. Exercise the real missing and optional states: a
build-time resolver can eagerly resolve a dynamic import, so source syntax alone does
not prove an input is optional.

## The terminal sweep

One repository-wide sweep when the migration is believed complete. Resolve every
remaining Cyan reference, or record why it stays and what still needs it. Remove the
compatibility assets no remaining consumer reads, and delete this file.
