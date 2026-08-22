# A content area collapses a replaced child to zero width

Status: Recorded 2026-08-22, found by giving Golden and Triad regions the rhythm
Prose already had, in the deprecate-cyan epic

## What is wrong

`content-containers.css:82` gives every direct child of a Prose flow root
`container-type: inline-size`, so a component inside one queries the item rather than
the page. `container-type` applies size containment, and a size-contained element is
sized as if it had no contents — which for a replaced element discards the intrinsic
width the element exists to carry.

Measured in the browser: the syndicate poster on the front page resolves to `0px` wide
and `388px` tall under the rule, and to its natural `690px` with `container-type:
normal`. The image loads; it paints nothing.

`SyndicateStream.astro` works around it with a wrapping `div`, which takes the boundary
so the image keeps its width.

## Why it stays open

The boundary on each flow item is intended, and the spec states it: a component asks
about the area holding it, and the nearest boundary answers. The defect is that a
replaced element has no contents to query, so the boundary is useless there as well as
harmful — but CSS has no `:replaced` selector, so excluding them means naming them, and
`img, picture, video, canvas, svg, iframe, embed, object` is a list that needs editing
whenever a surface uses one it has not used before.

`specs/design-system/content-container-layouts/spec.md` justifies the per-item boundary,
so a fix is a Constraints question, not a stylesheet edit.

The same mechanism is already documented one rule below, for breakouts: an inline-size
container is sized independently of what it holds, so a fit-content breakout would
measure zero. That rule answers it with `stretch`. A replaced child has no equivalent.

## What done looks like

A replaced element placed directly in a content area keeps its intrinsic width, and
`SyndicateStream.astro` drops the wrapping div.
