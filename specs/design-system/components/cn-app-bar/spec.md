---
status: live
---

# CnAppBar

## Blueprint

### Context

An application bar carries a page's context and the commands that reach past it. Where the
context and the commands compete for inline space, the context yields: the title truncates,
and a small screen swaps it for a shorter form, while the actions keep their targets.

### Architecture

An Astro component, `packages/design-system/components/CnAppBar.astro`, rendering a
`banner` landmark. Its own layout and paint need no client-side script.

Every action it places or a consumer supplies is a chrome action per
`../../chrome-actions/spec.md`. The bar declares the compact presentation and states no
target, state surface or Icon size of its own.

The bar does not place itself. Where it sits, and what cedes space to it, are the
application chrome container's.

The bar spans the whole inline size and cedes nothing to a rail standing beside the
page; only the main region does, per `../../rail/spec.md`. So the bar keeps the corner
for the page's identity: the logomark, or the context noun, begins where a reader's eye
does.

The leading region's reserved slot and the title's short form answer the `app-chrome`
container's inline size, not the window, so a bar mounted outside one keeps neither.

### Constraints

Three regions in inline order: a leading region, the title, then the actions a consumer
supplies.

The leading region carries the page's context noun as a decorative Icon, and the product's
logomark where a page states none. That glyph and the wordmark beside it are one region,
and given a destination they are one link to the root of whatever the bar names — one
link, because a reader pressing either half wants the same place, and two would be
announced twice. The link takes the bar's foreground and never underlines: the bar is
chrome, not running text. Where the region leads somewhere, the wordmark names the link,
so the logomark names nothing of its own. A small screen carries neither: no rail holds
the navigation trigger there, so the bar reserves `8 × --cn-grid` at its start edge and the
trigger stands among the bar's items rather than over them.

Wider than the small band, whichever glyph the leading region carries stands on the
rail's axis, so it, the rail's trigger and every entry beneath fall on one vertical
line.

A modal bar replaces the leading region with the back action and renders no actions. It is
the bar's only variant.

The title is not a heading — the document's outline is the page's. It renders at the h3
step and truncates rather than wrapping, and a shorter form replaces it below
`--cn-breakpoint-small`.

The bar paints nothing while the page is at its top, so a poster or the page itself reads
through it. A veil fades in as content passes beneath: `16 × --cn-grid` deep, twice the
bar, so text dissolves before it reaches the title, and its own lower edge ends fully
transparent, so it leaves no seam across the page. Scroll position drives it, without
script. Firefox ships no scroll timeline and shows the veil at rest, losing the fade and
nothing else. A modal bar rests at elevation 3 and carries no veil: it stays over the
page's content, and level 4 belongs to the transient covers the application puts in
front of a reader.

The bar is `8 × --cn-grid` in block size, which admits a chrome action's target and
centres it, so half of what the bar is deeper than that target stands as padding at each
of its edges. A rail beneath the bar begins where that padding ends rather than where the
bar's box does, per `../../rail/spec.md`.

## Contract

### Definition of Done

- The design site's shell mounts the bar, so every book page is a live composition.
- A **CnAppBar** Component book renders the default and modal bars, with and without a
  context noun, in Light and Dark.
- A browser check asserts the landmark; the reserved slot and absent glyph below
  `--cn-breakpoint-small`, and neither above it; the leading glyph standing on the rail's
  axis above it; the shorter title across that threshold; the modal bar's back action and
  absent actions; the veil absent at rest and present once scrolled; and a block size
  unchanged by either.
- A bar bounded in a composition takes the form that composition's inline size calls for,
  whatever size the window is.
- A bar given a destination carries one link, named by its wordmark.
- Human review accepts that the bar reads as the application's frame at every band, over a
  poster and over plain content, and that a truncated title stays legible at enlarged
  browser text sizes.

### Regression Guardrails

- The bar's layout and paint need no client-side script.
- The title is never a heading element.
- The bar redefines no chrome-action geometry, and carries no navigation of its own beyond
  the back action a modal bar places.
- A veil never renders over an opaque bar, and never both with an elevation shadow.

### Scenarios

```gherkin
Given a bar below the small breakpoint
When it renders
Then its start edge reserves eight grid units
And it shows no context glyph
And its shorter title is displayed
```

```gherkin
Given a modal bar
When it renders
Then its leading region carries the back action
And it renders no actions
And it carries no veil
```

```gherkin
Given a bar with content beneath it
When the page is at its top, and then scrolled
Then the veil is absent, and then present
And the bar's block size is unchanged
```

```gherkin
Given a bar on a page stating no context noun
When it renders
Then its leading region carries the product's logomark
```

```gherkin
Given a bar stating where its identity leads
When it renders
Then its logomark and its wordmark are one link
And that link is named by the wordmark
```

```gherkin
Given a bar bounded below the small breakpoint
And a window wider than it
When it renders
Then it takes the form its own container calls for
```
