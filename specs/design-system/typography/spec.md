---
status: draft
---

# Typography

## Blueprint

### Context

Nothing in v21 defines Pelilauta's text styles. Every heading and paragraph is
styled by the package v21 removes, and the two systems v21 draws from disagree about
what text should look like, so there is no version to copy. The scale here is
decided, and appearance changes where it has to.

The system gives a reader hierarchy they can scan, on a rhythm that agrees with the
layout around it, at whatever text size they asked their browser for.

### Architecture

**Lato** sets Pelilauta's text. **Roboto Mono** is its monospace, used for code.

Where else monospace applies — a form value, an identifier, a slug — is not decided
here. Which family loads a face, and how either reaches an application, is
`specs/design-system/fonts/spec.md`'s.

The scale is an Augmented Fourth (1.414) from the reading size.

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
default. Small is in the table but not on the scale: it is not an Augmented Fourth
from anything, and it exists for prose too secondary for reading size and too long
for caption. A lexicon publishes it with the rest.

Weights are those in the table, plus 700 for emphasis.

Tracking is v20's, for the steps v20 states. The steps v20 does not have derive:
title takes h1's, and small takes text's. The caption's 0.05em is v20's own
`.text-caption` treatment. A step's downshift takes the lower step's tracking with
its size and line.

### Constraints

A line is a multiple of the layout's line unit and taller than the text it holds. The
unit is defined in `specs/design-system/spatial-system/spec.md`. The table states
which multiple each step takes: the smallest that clears the text, except h1, which
takes four units rather than three because 68px text on a 72px line leaves 4px of
leading and the same line as h2.

Nothing in the system sets the document's text size. This is the reader-preference
guarantee in `specs/design-system/design-tokens/spec.md`.

Every heading from h1 to h4 renders one step down at small-screen width — 38.75rem,
620px at a 16px root — measured against its container rather than the window, so a
heading in a card or a list row steps down when that card is as narrow as a small
screen, whatever the page around it is doing. The threshold is the small-screen
breakpoint, not the reading measure: the measure is 67 characters of prose and moves
for reasons that have nothing to do with screen size.

A container query cannot read a custom property, so this threshold is the one value
this system states as a literal rather than reading from a token. A test pins the
literal to the published small-screen breakpoint.

h4 is the smallest heading, so its step down is reading size at weight 700. The title
step does not downshift.

The step classes carry v20's own names. Each heading step ships its mirror class —
`.text-h1` through `.text-h4`, v20's "utilities mirroring semantic tag behaviors" —
for text that renders at a heading step without opening a section. A mirror renders
identically to its element, downshift included, and the element is preferred where
the text is a heading. The text step's mirror is `.text-body`: it renders any
element at the text step, a heading visually as prose among them.

Caption and label share the caption size and line. `.text-caption` is v20's:
uppercased at weight 500 with 0.05em tracking, the metadata register the
application already writes. `.text-label` is an approved exception to v20
(human decision 2026-08-04): it keeps the casing it is given at the text weight and
tracking, because some captions are labels — content whose casing carries
meaning — and Finnish compounds lose their word shape in capitals.

The step set is closed. A step is added by changing this spec.

Headings, prose and links take the colour roles defined in
`specs/design-system/design-tokens/spec.md`.

## Contract

### Definition of Done

- A principles book teaches the pairing and the scale, and renders the combinations
  the applications compose — a title over a lede, headings over paragraphs and
  lists, a definition list between headings, label and caption against real
  content — so the scale is evaluated on the page that teaches it.
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
