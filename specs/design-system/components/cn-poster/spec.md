---
status: live
---

# CnPoster

## Blueprint

### Context

`CnPoster` replaces the application ground plane behind one page's content with a single decorative image of the page's subject. The artwork is user material of unknown colour and contrast. Where recognisability and legibility collide, legibility wins.

### Architecture

`CnPoster` is an Astro component (`CnPoster.astro`) emitting `<div id="cn-poster">` with a nested `<picture>` and a decorative `<img>`. It renders on the server, needs no script, and is never hydrated.

A page mounts one poster through the `app-background-poster` layout slot, as a direct child of `body`. A page with no artwork mounts none.

`src` is the artwork URL. `md` is a wider candidate, selected at 960px. `pinned` fixes the poster to the viewport instead of scrolling with the page. `src` and `md` are v20's names; `pinned` is new to v21, as v20 ships the scrolling placement only.

A companion global stylesheet (`poster.css`) attenuates the artwork. While a poster paints, it makes the chrome — `--cn-app-bar-background-sticky`, `nav#rail`, `nav#tray` — and the levels that stand on the artwork transparent. The id differs from v20's `cn-background-poster` because Cyan still styles that one.

### Constraints

Each colour scheme attenuates with its own opacity, tint and blend mode, following v20's `CnBackgroundPoster`. No filter reaches the artwork in either scheme. The tint gradients reference `--chroma-primary` and `--chroma-surface` steps directly: they attenuate decorative artwork of unknown colour, a purpose no semantic role names.

The wash and the ceding surfaces keep body text readable. Over artwork the design system does not control, WCAG 2.2 AA is the target they are tuned to, not a guarantee: no share can promise a ratio against an image the system has never seen, and the only one that could is opacity, which is what the cession removes. They hold it with no artwork at all, since a failed load is undetectable without script, and a pinned poster holds it without the lower-edge dissolve.

A poster changes the levels that stand on the artwork. The ground plane cedes at
`--cn-transparency-6`, because a page standing over artwork is meant to show it; payload
at levels 1 and 2 cedes at `--cn-transparency-2`, letting enough of the artwork through
to place it on the page while staying legible. A ceding level takes the share against
the colour its own level states, so ceding moves no level to another's colour. Levels
3 and 4 are unchanged: they float over content rather than over the page, so a share
there would show what they cover rather than the artwork. The ladder the shares come from
is `specs/design-system/color-system/spec.md`.

Below the spatial system's small-screen breakpoint and in print, the poster paints nothing and its overrides are inactive. Under `prefers-reduced-transparency` and under `forced-colors`, the poster paints nothing, the sticky application bar takes its surface back, and the remaining cessions resolve to the plain surface with nothing painting beneath them. The preferences hide the poster rather than gate it: a browser that cannot parse a preference cannot honour it either, and shows the poster.

The artwork is decorative and has no alternative text. The consuming application decides which pages carry a poster and supplies their artwork.

## Contract

### Definition of Done

- `CnPoster.astro` renders `div#cn-poster` containing a picture and a decorative image, on the server, with no client-side JavaScript.
- `pinned` switches between the scrolling and the fixed placement.
- `poster.css` reaches both applications through the design system's stylesheet entry point.
- `.elevation-0`, `.elevation-1` and `.elevation-2` cede their share while a poster paints, and are opaque otherwise; a `.surface` at its default level cedes with level 1. `.elevation-3` and `.elevation-4` are opaque throughout.
- The poster and its overrides are absent below the small-screen breakpoint and in print. Under `prefers-reduced-transparency` and under `forced-colors`, the poster paints nothing, the sticky bar recovers its surface, and the remaining cessions are inert.
- Body text over the poster is legible in both schemes on the near-white, near-black and no-artwork cases. With no artwork it meets WCAG 2.2 AA, which is the case the design system controls.
- The **CnPoster** Component book renders both placements across Light and Dark, over near-white artwork, near-black artwork and none, with content resting on the ground plane.

### Regression Guardrails

- Id `cn-poster` is preserved on the root element so the chrome and ground-plane rules match.
- The image's computed style carries no `filter` in either colour scheme.
- The chrome and ground-plane overrides apply only on a page that mounts a poster; where a preference stops the poster painting, what they touch renders as the plain surface.
- Nothing but a mounted poster makes a level cede.
- The accessibility preferences appear only in queries that hide the poster, never in the guard that shows it.
- The poster takes no pointer events and adds no focus stop.
- Cyan's poster, gradient and `nav#rail` blend rules do not participate.

### Scenarios

```gherkin
Given a page mounting a poster with src and no md
When the initial document renders without client-side JavaScript
Then div#cn-poster contains the decorative image beneath the page content
And the image is absent from the tab order and the accessibility tree
```

```gherkin
Given a page mounting a poster with src and md
When the viewport is at least 960px wide
Then the browser loads the md candidate
```

```gherkin
Given a page mounting a poster
When content resting on the ground plane renders in Light and in Dark
Then the ground plane and payload each cede their share of the transparency ladder
And levels 3 and 4 stay opaque
```

```gherkin
Given a page mounting a poster whose artwork does not load
When content resting on the ground plane renders in Light and in Dark
Then the inherited body foreground meets WCAG 2.2 AA
```

```gherkin
Given a page mounting a pinned poster
When the reader scrolls to any position
Then the poster remains under the content with no dissolved lower edge
```

```gherkin
Given a page mounting a poster
When it renders below the small-screen breakpoint or in print
Then the poster paints nothing
And the application bar, the navigation and the ground plane render as they do without a poster
```

```gherkin
Given a page mounting a poster
When it renders under prefers-reduced-transparency or under forced-colors
Then the poster paints nothing
And the sticky application bar recovers its surface
And the navigation and the ground plane render on the plain surface
```

```gherkin
Given a page mounting a poster
When it renders in a browser that does not recognise prefers-reduced-transparency or forced-colors
Then the poster paints as it does with no preference expressed
```
