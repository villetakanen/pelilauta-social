---
status: live
---

# Application Chrome

## Blueprint

### Context

An application's chrome — its bar, its navigation, its quick actions — stays where it is
while the page scrolls beneath. Chrome paints over the document and never takes it away:
where holding a control and reaching the content collide, the content wins.

### Architecture

An Astro component, `packages/design-system/components/CnAppChrome.astro`: a box the size
of the viewport, fixed, holding whatever an application places in it. It renders no bar,
no navigation and no quick actions, and paints nothing of its own.

Scrolling stays on the document. The box takes no pointer input and restores it for the
parts it holds, so a part is reachable without stating anything. A part that must stay
transparent in places takes it away again for itself, as the quick-action tray does
between its buttons.

The box is the container `specs/design-system/fab-tray/spec.md` requires, so an
application mounts one rather than building its own.

### Constraints

The box is `100dvw` by the visible block size, fixed, and establishes an inline-size
container named `app-chrome`. The visible block size is `100dvh` less the depth an
on-screen keyboard occupies, so a part at the block end stands above the keyboard rather
than behind it. A part inside the box answers that container rather than the window, so it
renders whole wherever a composition establishes one — a book specimen bounding a part at
a few hundred pixels gets the presentation that size calls for, and not the one the
reader's window happens to call for.

The box states its own stacking above the document with a published token, and each part
that must sit above or below its siblings states its own the same way. Where a part sits
does not depend on where an application writes it.

An application declares `interactive-widget=resizes-content`, so a browser that resizes
the layout viewport for the keyboard resizes the box with it and no measurement happens.
Where a browser resizes only the visual viewport, chrome measures the difference and
publishes it as `--cn-keyboard-inset`. The token is `0px` until something measures it, so
every browser, and every render before script runs, gets the full box.

Content clears chrome by the tokens that size it, never by measuring what is present:
`--cn-app-bar-height` at the block start, and at each other edge the width or depth of
whatever stands there. `specs/design-system/content-container-layouts/spec.md` states the
host's side of that.

Chrome renders on every page, including a modal one. The box paints nothing, so artwork
behind it cedes nothing to it.

## Contract

### Definition of Done

- The design site's shell and `apps/pelilauta`'s layouts both mount it, and neither keeps
  a viewport-sized layer of its own. Cyan's `nav#rail`, `nav#tray` and `cn-tray-button`
  leave with the navigation capability, not with this one.
- `packages/design-system/styles/units.css` publishes the box's stacking token beside
  `--cn-z-fab`, and `--cn-keyboard-inset` at `0px`.
- A unit test drives the keyboard measurement over the viewport figures a browser
  reports, including a browser that has already resized its layout viewport, and a
  zoomed viewport, which is shorter for another reason.
- A browser check asserts that the box spans the viewport while no keyboard stands, and
  that a published inset shortens it by that much.
- A **CnAppChrome** Component book renders it holding an application bar and a quick
  action, in Light and Dark.
- A browser check asserts that the box spans the viewport and stays put while the document
  scrolls; that a pointer reaches the document through the box and does not through a
  control inside it; that content below the bar is never covered by it; and that the box
  paints nothing.
- Human review accepts that chrome reads as one layer over the document at every band.

### Regression Guardrails

- The box never scrolls the document, and never intercepts a pointer outside its controls.
- The box paints no background, border or shadow.
- Every stacking value in chrome is a published token; no part states a literal.
- Chrome states what it occupies; a page never measures it.
- Chrome is the only thing that measures the keyboard. A part reads the token, and a
  second measurement would answer a different question in a bounded composition.
- No part inside the box asks the window its size. A part that does renders one
  presentation in an application and another in a composition that bounds it.
- The container's name is the contract each part queries; renaming it silently drops
  every rule those parts state, because a query naming no container never applies.

### Scenarios

```gherkin
Given a page with chrome and content
When the reader scrolls
Then the chrome stays where it is
And the document scrolls beneath it
```

```gherkin
Given a pointer over the chrome, away from any control
When it presses
Then the document beneath receives it
```

```gherkin
Given a page mounting chrome
When it renders
Then the content below the application bar is not covered by it
```
