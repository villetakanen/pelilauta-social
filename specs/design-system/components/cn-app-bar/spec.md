---
status: approved
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

### Constraints

Three regions in inline order: a leading region, the title, then the actions a consumer
supplies.

The leading region carries the page's context noun as a decorative Icon, and the mark that
stands for the site where a page states none. A small screen carries neither: no rail holds
the navigation trigger there, so the bar reserves `8 × --cn-grid` at its start edge and the
trigger stands among the bar's own items rather than over them.

A modal bar replaces the leading region with the back action and renders no actions. It is
the bar's only variant.

The title is not a heading — the document's outline is the page's. It renders at the h3
step and truncates rather than wrapping, and a shorter form replaces it below
`--cn-breakpoint-small`.

The bar paints nothing while the page is at its top, so a poster or the page itself reads
through it. A veil fades in as content passes beneath: `16 × --cn-grid` deep, twice the
bar, so text dissolves before it reaches the title. Scroll position drives it, without
script. Firefox ships no scroll timeline and shows the veil at rest, losing the fade and
nothing else. A modal bar rests at elevation 2 on an opaque surface and carries no veil.

The bar is `8 × --cn-grid` in block size, which admits a chrome action's target.

## Contract

### Definition of Done

- The design site's own shell mounts the bar, so every book page is a live composition.
- A **CnAppBar** Component book renders the default and modal bars, with and without a
  context noun, in Light and Dark.
- A browser check asserts the landmark; the reserved slot and absent glyph below
  `--cn-breakpoint-small`, and neither above it; the shorter title across that threshold;
  the modal bar's back action and absent actions; the veil absent at rest and present once
  scrolled; and a block size unchanged by either.
- Human review accepts that the bar reads as the application's frame at every band, over a
  poster and over plain content, and that a truncated title stays legible at enlarged
  browser text sizes.

### Regression Guardrails

- The bar's own layout and paint need no client-side script.
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
Then its leading region carries the mark standing for the site
```
