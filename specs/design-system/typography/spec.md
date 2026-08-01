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

Two families carry two registers. **Lato** sets what is written for a person: prose,
headings, labels, buttons. **Roboto Mono** sets the technical register: form inputs,
code, and machine-facing values such as identifiers and slugs. The register follows
the role, not the tag. Which of them loads a face, and how either reaches an
application, is `specs/design-system/fonts/spec.md`'s.

The scale is an Augmented Fourth (1.414) from the reading size.

| step | size | line | weight |
| :--- | ---: | ---: | ---: |
| title | 96px | 120px | 200 |
| h1 | 68px | 96px | 300 |
| h2 | 48px | 72px | 400 |
| h3 | 34px | 48px | 400 |
| h4 | 24px | 48px | 400 |
| text | 17px | 24px | 400 |
| small | 15px | 24px | 400 |
| caption | 12px | 24px | 400 |

Sizes are proportions of the reader's default text size, shown against a 16px
default. Small is in the table but not on the scale: it is not an Augmented Fourth
from anything, and it exists for prose too secondary for reading size and too long
for caption. A lexicon publishes it with the rest.

Weights are those in the table, plus 500 for labels and buttons and 700 for emphasis.

### Constraints

A line is a multiple of the layout's line unit and taller than the text it holds. The
unit is defined in `specs/design-system/spatial-system/spec.md`. The table states
which multiple each step takes.

Nothing in the system sets the document's text size. This is the reader-preference
guarantee in `specs/design-system/design-tokens/spec.md`.

Every heading from h1 to h4 renders one step down in a column narrower than the
reading measure, defined in `specs/design-system/content-containers/spec.md`, so a
heading in a card or a list row is sized by that card. A container query cannot read a
custom property, so the threshold is the only value this system copies rather than
links; a test asserts the copy still equals the measure. h4 has
no heading step below it; its step down is reading size at weight 700. The title step
does not downshift.

h4 is the smallest heading. The step below it is reading size.

Label and caption share the caption size and line. A label is uppercased at weight
500; a caption keeps the casing it is given at weight 400. Content whose casing
carries meaning is technical register.

The step set is closed. A step is added by changing this spec.

Headings, prose and links take the colour roles defined in
`specs/design-system/design-tokens/spec.md`.

## Contract

### Definition of Done

- A principles book teaches the two registers and the scale; a lexicon book lists
  every step the system publishes.
- Every heading, paragraph, caption, label, input and code block in `apps/pelilauta`
  renders on this system.
- The design site's editorial text renders on it too, stating no size or leading of
  its own.
- No text styling reaches either application from the package v21 removes.
- Human review accepts how both running applications look.

### Regression Guardrails

- Nothing sets the document's text size. One declaration re-pins the system and
  defeats the reader's preference silently.
- A step resized without recomputing its line breaks the rhythm wherever it appears.
- A downshift driven by window width instead of column width renders card and
  list-row headings at page sizes.

### Scenarios

```gherkin
Given an h1, h2, h3 or h4 in a column narrower than the reading measure
When the page renders
Then it renders one step down the scale
```

```gherkin
Given an h4 in a column narrower than the reading measure
When the page renders
Then its step down is reading size at the emphasis weight
```

```gherkin
Given a reader who has enlarged their browser's default text size
When any page renders
Then every step grows in proportion and none is pinned
```

```gherkin
Given a form input, a code block, or an identifier
When it renders
Then it is set in the technical family
```

```gherkin
Given a label and a caption with the same content
When both render
Then the label is uppercased and the caption keeps the casing it was given
```
