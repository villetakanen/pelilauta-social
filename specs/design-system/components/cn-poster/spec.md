---
status: approved
---

# CnPoster

## Blueprint

### Context

`CnPoster` replaces the application ground plane behind one page's content with a single decorative image of the page's subject. The artwork is user material of unknown colour and contrast. Where recognisability and legibility collide, legibility wins.

### Architecture

`CnPoster` is an Astro component (`CnPoster.astro`) emitting `<div id="cn-poster">` with a nested `<picture>` and a decorative `<img>`. It renders on the server, needs no script, and is never hydrated.

A page mounts one poster through the `app-background-poster` layout slot, as a direct child of `body`. A page with no artwork mounts none.

`src` is the artwork URL. `md` is a wider candidate, selected at 960px. `pinned` fixes the poster to the viewport instead of scrolling with the page. `src` and `md` are v20's names; `pinned` is new to v21, as v20 ships the scrolling placement only.

A companion global stylesheet (`poster.css`) attenuates the artwork. While a poster paints, it makes the chrome and the ground plane transparent: `--cn-app-bar-background-sticky`, `nav#rail`, `nav#tray`, and `.elevation-0` at 80% opacity. The id differs from v20's `cn-background-poster` because Cyan still styles that one.

### Constraints

Each colour scheme attenuates with its own opacity, tint and blend mode, following v20's `CnBackgroundPoster`. No filter reaches the artwork in either scheme.

The wash and the 80% ground plane keep body text readable. Over artwork the design system does not control, WCAG 2.2 AA is the target they are tuned to, not a guarantee. They hold it with no artwork at all, since a failed load is undetectable without script, and a pinned poster holds it without the lower-edge dissolve.

Elevations 1 through 4 remain opaque over a poster.

Below the spatial system's small-screen breakpoint and in print, the poster paints nothing and its overrides are inactive. Under `prefers-reduced-transparency` and under `forced-colors`, the poster paints nothing, the sticky application bar takes its surface back, and the remaining cessions resolve to the plain surface with nothing painting beneath them. The preferences hide the poster rather than gate it: a browser that cannot parse a preference cannot honour it either, and shows the poster.

The artwork is decorative and has no alternative text. The consuming application decides which pages carry a poster and supplies their artwork.

## Contract

### Definition of Done

- `CnPoster.astro` renders `div#cn-poster` containing a picture and a decorative image, on the server, with no client-side JavaScript.
- `pinned` switches between the scrolling and the fixed placement.
- `poster.css` reaches both applications through the design system's stylesheet entry point.
- `.elevation-0` is 80% opaque while a poster paints and opaque otherwise.
- The poster and its overrides are absent below the small-screen breakpoint and in print. Under `prefers-reduced-transparency` and under `forced-colors`, the poster paints nothing, the sticky bar recovers its surface, and the remaining cessions are inert.
- Body text over the poster meets WCAG 2.2 AA in both schemes on the near-white, near-black and no-artwork cases.
- The **CnPoster** Component book renders both placements across Light and Dark, over near-white artwork, near-black artwork and none, with content resting on the ground plane.

### Regression Guardrails

- Id `cn-poster` is preserved on the root element so the chrome and ground-plane rules match.
- The image's computed style carries no `filter` in either colour scheme.
- The chrome and ground-plane overrides apply only on a page that mounts a poster; where a preference stops the poster painting, what they touch renders as the plain surface.
- Nothing but a mounted poster makes `.elevation-0` transparent; it is the only override of a level `specs/design-system/surface/spec.md` defines.
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
Given a page mounting a poster over near-white or near-black artwork
When content resting on the ground plane renders in Light and in Dark
Then the ground plane is 80% opaque
And the inherited body foreground meets WCAG 2.2 AA
```

```gherkin
Given a page mounting a poster whose artwork does not load
When content resting on the ground plane renders in Light and in Dark
Then the inherited body foreground meets WCAG 2.2 AA
```

```gherkin
Given a page mounting a pinned poster over near-white or near-black artwork
When the reader scrolls to any position
Then the poster remains under the content with no dissolved lower edge
And the inherited body foreground meets WCAG 2.2 AA
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
