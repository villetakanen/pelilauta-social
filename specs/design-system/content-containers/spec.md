---
status: approved
---

# Content Containers

## Blueprint

### Context

The design site's books render edge to edge with no space between blocks: nothing
owns a content width, and the preflight removed the element margins that stood in
for one. This adds the container that fixes it — a single centred column — and
leaves the rest of v20's family unbuilt.

### Architecture

`packages/design-system/styles/content-containers.css`, reached through
`styles/ds.css` rather than imported by name.

An application opts in with `cn-app-main` on its `<main>`; direct `section` and
`article` children are then containers. No wrapper element, no component.

The `<main>` is the grid and a container is a cell in it. The alternative — a
full-width container whose middle track holds the content — centres the same way
but leaves the container element page-wide, and a container query reports its
own border box, so every query would be answered with the page's width. v20 has
that shape.

`--cn-measure` is declared in this stylesheet, not in `styles/units.css`, which
`test/units.test.ts` asserts is identical to the Cyan 4 file it shadows. It is
therefore documented in this capability's book and not in the units lexicon.

### Constraints

The measure is 67 characters of the base paragraph, expressed as a multiple of
`--cn-grid` and re-measured when the base font or its size changes.

A container is `cn-content` and reports the column's width, so a component inside
one measures the column and not the page.

The two modes are one track expression, not a breakpoint: the measure and the
width remaining after a gutter each side, whichever is smaller. They are equal
exactly where the measure and its gutters fit, so there is no threshold to state
and none to keep in step.

Spanning the page is a property of a whole container, not of something inside
one. A child cannot escape its container, because the container is exactly as
wide as the column and holds no wider box to reach for.

Rhythm between containers and between the blocks inside one is `--cn-line`. The
inside case is the spacing `specs/design-system/preflight/spec.md` assigns to each
container until the type ramp owns it.

Not owned here: two-column, three-column and card layouts; Cyan's
`content-cards`, `content-listing`, `content-editor` and `content-sheet`; nested
containers; typography inside the container. `apps/pelilauta` keeps Cyan's
`.content-columns`, and its container surfaces are inventoried in
`docs/MIGRATION.md`.

## Contract

### Definition of Done

- Every prose book in `apps/design` renders in the container, and is readable at
  a wide and a narrow window.
- The capability's book is published in the `base` group.

### Regression Guardrails

- The container element is the column. Anything that makes it wider — a width, an
  inline-size, moving `cn-content` to an ancestor — silently answers every query
  against it with the page's width.
- The modes stay one expression. Split into a query and a stated breakpoint, the
  two can drift apart and the content jumps.
- Every rule is scoped below the opt-in class, so the stylesheet cannot reach a
  page that has not adopted the container.

### Scenarios

Run by `apps/design/e2e/content-container.spec.ts`.

```gherkin
Given a book page whose main is wider than the measure plus two gaps
When it renders
Then the content is one centred column at the measure
And the leftover width is split evenly on both sides
```

```gherkin
Given a book page whose main is narrower than the measure plus two gaps
When it renders
Then the content has a --cn-gap gutter on each side
And it fills the width between them
```

```gherkin
Given a page crossing the width where the measure and its gutters fit
When the window resizes across it
Then the content width does not jump
```

```gherkin
Given an element inside a container
When it is styled by a query against cn-content
Then the query resolves against the column and not against the page
```

```gherkin
Given a container marked full width
When the page renders
Then it spans the page instead of sitting in the column
```

```gherkin
Given two stacked containers
When the page renders
Then they are one --cn-line apart
```

```gherkin
Given a reader who enlarges the browser's default text size
When a book renders
Then the column widens proportionally
```

```gherkin
Given a main element without the opt-in class
When the stylesheet is loaded
Then no rule in it matches any element on the page
```
