---
status: proposed
---

# Dice

## Blueprint

### Context

A reader of tabletop-rules text sees a die's denomination, result or target as
a compact visual notation that remains part of the text line.

### Architecture

Dice is a CSS design-system extension in `packages/dice`, beside
`packages/editor`. `specs/pelilauta/wiki-dice-notation/spec.md` governs the
server span Dice consumes. The extension defines no custom element, client code
or hydration boundary.

`apps/pelilauta`'s two wiki-rendering surfaces — the page article and the page
sidebar — import `packages/dice/styles/dice.css` directly;
`packages/design-system/styles/ds.css` does not import it.

### Documentation

- `apps/design/src/content/extensions/dice.mdx`

### Constraints

The span carries its face text as a text node; Dice styles that text and never
generates it. Dice sizes the face text to fit the silhouette from the span's
stated `data-length`. Dice draws a target's `+`, carried in `.dice-plus`,
outside the silhouette.

Each admitted side count has a die silhouette: d2 uses the round coin
silhouette; d4 uses a triangle; d6 uses a plain square with no rounding; d8
uses a diamond; d10 uses a six-sided face; d12 uses a ten-sided face; d20
uses a tall diamond. Every silhouette but d20 carries a 2.25° tilt; d20 is
rotated 35°. Dice ports these shapes from `cn-dice`, the standalone Lit
element it replaces; upstream is the authority on each silhouette's
geometry, and `packages/dice/test/geometry.test.ts` pins it. d2 has no
upstream counterpart — `cn-dice` has no two-sided die — and is this port's
own addition.

Dice is a decorative, extension-private direct-chroma consumer with a
colour mapping unrelated to upstream's palette. It draws from
`--chroma-warning-*`, not the primary family — a departure from the semantic
layer, taken because the primary family could not hold seven distinct faces
inside a band that reads on both a light and a dark page. `color-mix(in
oklch, …)` sets each die's colour between the declared endpoints
`--chroma-warning-90` (d2) and `--chroma-warning-40` (d20), at one of five
equidistant lightness steps between them. This is a licensed deviation from
the rule that a direct-chroma consumer's colour is an exact declared step,
taken so each die gets a distinct colour inside that band. Text is black on
d2, d4 and d6; white on d8, d10, d12 and d20. Every text-and-face pair meets
WCAG 2.2 AA contrast except d8's: white on d8 measures 3.37:1, below the
4.5:1 floor. This is an operator-ruled exception, not an oversight;
`packages/dice/test/contrast.test.ts` pins the ratio, so drift in either
direction fails. The band sits mid-tone so every face also separates from
both a light and a dark page. A replacement theme does not inherit either
guarantee.

A die is a square inline box, `calc(var(--cn-line) * 7 / 6)` — a touch
larger than the line, matching `cn-dice`'s inline default (28px against
a 24px line). Its number baseline matches adjacent text, and it adds no
spacing beyond the source text's normal whitespace. The number glyph is at
least as large as surrounding prose and bold on every die, and stays legible
where it crosses the silhouette's edge.

## Contract

### Definition of Done

- A rendered page shows every admitted Dice span as a CSS-drawn face.
- The Dice book shows every admitted side count, including a d20 result and
  target, in both colour schemes.
- The Dice book shows glyph legibility against the tightest silhouettes, d2
  and d10.
- The Dice book states that its contrast guarantee applies to the default
  warning family alone, and names d8 as an exception below the AA floor.
- Human review accepts the silhouette, colour separation and text legibility,
  including a d20 target's `20+`, in both colour schemes.
- Every declared text and face pair measures at least 4.5:1 in the default
  warning family, except d8's operator-ruled exception.

### Regression Guardrails

- Dice declares text-and-face contrast that holds only for the default warning
  chroma family; a theme that replaces that family drops the guarantee, and
  nothing catches the drop automatically. `packages/dice/test/contrast.test.ts`
  checks the default family alone, and pins d8's exception to its exact ratio
  so drift in either direction fails.
- `packages/dice/styles/dice.css` declares no `--chroma-*` step outside the
  two `--chroma-warning-*` endpoints the Constraints list.
  `packages/dice/test/tokens.test.ts` holds this.
- Every silhouette clip lives on `::before`, never the bare `.dice` element, so
  the face text is never cut. `packages/dice/test/clipping.test.ts` holds this.
- The face text stays selectable and copyable: no rule draws it with
  `content: attr(data-value)` or other generated content on the `.dice`
  element itself. `packages/dice/test/` holds this.

### Scenarios

Checks live in `packages/dice/test/`; human review verifies the rendered
scenarios below against `DiceSpecimen` in `apps/design/src/content/extensions/dice.mdx`.

```gherkin
Given a d20 die face whose value is 20
When it renders
Then its silhouette contains 20
And its number baseline matches the text beside it
```

```gherkin
Given a d6 target face whose value is 2
When it renders
Then its silhouette contains 2+
```

```gherkin
Given a d20 target face whose value is 20
When it renders
Then its number glyph contains legible 20+
```

```gherkin
Given a page that renders Dice spans
When the browser runs no client-side JavaScript
Then every die face remains visible
```

Not automated: Dice defines no script, so there is nothing a client-side check
exercises; human review is the detector.
