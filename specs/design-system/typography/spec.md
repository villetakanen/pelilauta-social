---
status: approved
---

# Typography

## Blueprint

### Context

Pelilauta needs a professional, well formed typography system. This system is built
on a well functioning font pairing — Lato for human conversation, Roboto Mono for
machine text — and a functional, but elegant Augmented Fourth (1.414) scale.

Where the scale and accessibility are in conflict, the conflict is manually
resolved.

### Architecture

**Roboto Mono** sets machine text: code, and the label step, where systemic data
must read as machine text. Face loading and family delivery are decided in
`specs/design-system/fonts/spec.md`.

The scale is built on a 17px reading size, set for Lato's proportions:

| step | size | line | weight | tracking |
| :--- | ---: | ---: | ---: | ---: |
| title | 96px | 120px | 200 | -0.02em |
| h1 | 68px | 96px | 300 | -0.02em |
| h2 | 48px | 72px | 400 | -0.01em |
| h3 | 34px | 48px | 400 | 0.01em |
| h4 | 24px | 48px | 400 | normal |
| text | 17px | 24px | 400 | 0.03em |
| small | 15px | 24px | 400 | 0.03em |
| caption | 12px | 24px | 500 | 0.05em |

Sizes are proportions of the reader's default text size, shown against a 16px
default. Weights are those in the table, plus 700 for emphasis.

Small is not on the scale: the mathematical step is adjusted for legibility.

Tracking is v20's for the steps v20 states; the steps v20 lacks derive from a
neighbour — title takes h1's, small takes text's.

### Constraints

Line height is the smallest visually satisfying multiple of `--cn-line`
(`specs/design-system/spatial-system/spec.md`). For h1 it is one step larger than
the mathematical optimum used for the rest of the styles.

HTML document text size is not set. The values presented here, and in
documentation, expect the 16px default. This is an intentional decision on
accessibility; see `specs/design-system/design-tokens/spec.md` for more.

Every heading from h1 to h4 renders one step down when its container is narrower
than the small-screen breakpoint — 38.75rem, 620px at a 16px root. 

CSS cannot read a token inside a `@container` query, so the stylesheet hardcodes
`38.75rem` into the query.

h4 is the smallest heading, so its step down is reading size at weight 700. The title
step does not downshift.

Every element step ships a mirror class that renders identically to its element,
downshift included.

`.text-label` is intended for caption-sized data whose casing carries meaning; a
Finnish compound loses its word shape in capitals.

Not decided here yet: link styling, heading wrap, and table typography. The
boundaries in `specs/design-system/preflight/spec.md` assign them to this
capability.

## Contract

### Definition of Done

- A principles book teaches the pairing and the scale, and renders what ships from
  source — every step as a live specimen with its values, and the reading baseline
  in both themes — so the scale is evaluated on the page that teaches it. The
  compositions the applications will need arrive with the work that ships them.
- A lexicon book lists every step the system publishes.
- Every heading, paragraph, caption, label, input and code block in `apps/pelilauta`
  renders on this system.
- The design site's editorial text renders on it too, stating no size or leading of
  its own.
- No text styling reaches either application from the package v21 removes.
- Human review accepts how both running applications look.

### Regression Guardrails

- Nothing sets the document's text size. One declaration re-pins the system and
  defeats the reader's preference silently. v20's own `typography.css` comments that a
  canonical size is set on `html`; no such rule exists anywhere in its package, so the
  comment is not a thing to port.
- A step resized without recomputing its line breaks the rhythm wherever it appears.
- A downshift driven by window width instead of container width renders card and
  list-row headings at page sizes.
- `container-type: inline-size` also applies layout containment, making the container
  a containing block for absolutely and fixed positioned descendants, and a new
  stacking context. A FAB, tray or dock positioned against the viewport inside one
  renders against the container instead: visible, correctly styled, wrongly placed.

### Scenarios

```gherkin
Given an h1, h2, h3 or h4 in a container narrower than small-screen width
When the page renders
Then it renders one step down the scale
```

```gherkin
Given an h4 in a container narrower than small-screen width
When the page renders
Then its step down is reading size at the emphasis weight
```

```gherkin
Given a reader who has enlarged their browser's default text size
When any page renders
Then every step grows in proportion and none is pinned
```

```gherkin
Given a code block
When it renders
Then it is set in Roboto Mono
```

```gherkin
Given a caption and a label with the same content
When both render
Then the caption is uppercased and the label keeps the casing it was given
```
