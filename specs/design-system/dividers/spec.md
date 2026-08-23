---
status: live
---

# Dividers

## Blueprint

### Context

A writer marks a thematic break in a library page, a thread or a handout by typing
`---`, and a reader sees where one passage ends and the next begins. Pelilauta renders
that break as an `<hr>`, so the break a writer can already type is the break a reader
gets.

A layout also needs a break that carries no meaning — a decorative interval between two
sections with no shared subject. That break uses `CnSeparator`, never `<hr>`,
because there is no passage ending for a reader to be told about.

### Architecture

`packages/design-system/styles/dividers.css` holds the `<hr>` rule, and it reaches both
applications through the stylesheet entry point.

The mark is a hairline border on the block-start edge. A hairline is a device length
rather than a reader-scaled one, because a divider holds the same weight whatever text
size the reader has set. `<hr>`'s browser presentation is an inset border on every edge,
so the rule clears them and states the one it wants.

The mark takes the `--cn-color-border` semantic role.
`specs/design-system/color-system/spec.md` governs what a semantic role is and how a
consumer takes one.

`packages/design-system/components/CnSeparator.svelte` draws the ornamental mark: a
hairline, an icon, a hairline, static and never hydrated. Its icon is the product's
logomark, `noun="fox"`, and a consumer passes a different `noun` to carry the break
instead. Unlike `<hr>`, the mark is decorative: it carries no accessible role or name.

### Documentation

The Dividers book, `apps/design/src/content/base/dividers.mdx`, and the CnSeparator
component book, `apps/design/src/content/components/cn-separator.mdx`.

### Constraints

- Neither mark carries a margin of its own. The space around either is the rhythm the
  area holding it states, under
  `specs/design-system/content-container-layouts/spec.md`.
- Neither mark states a width of its own; each spans the width it is given.
- The ornamental mark's icon is one size at every use. A break is the same break
  wherever it falls, and a caller choosing its size would make one page's break
  weightier than another's.
- Dividers publishes the `<hr>` element and the `CnSeparator` component, and nothing
  else. A component that draws the same hairline inside its own box states it there.

## Contract

### Definition of Done

- A thematic break in rendered Markdown is visible to a reader in both applications and
  both colour schemes.
- A divider between two blocks in a content area sits at the area's rhythm, with no
  space the divider added.
- `CnSeparator` renders its hairlines and icon with no accessible role or name.

### Regression Guardrails

- The mark is the block-start edge alone, and the element's other three edges stay
  cleared. Uncleared, the browser's own inset border returns beside the hairline and the
  divider paints two device pixels in two colours.
- The ornamental mark's icon stays decorative. An icon is announced to assistive
  technology by default, so the mark reintroduces a role and a name the moment it stops
  saying otherwise.

### Scenarios

```gherkin
Given a document with a thematic break
When a reader opens it
Then a line marks the break
```

```gherkin
Given a divider between two blocks of a content area
When the area renders
Then the divider adds no space of its own
```

```gherkin
Given a CnSeparator with no noun given
When it renders
Then it shows the product's logomark between two hairlines
```

```gherkin
Given a CnSeparator with a noun given
When it renders
Then it shows that noun's icon between two hairlines
```

```gherkin
Given a CnSeparator
When it renders
Then it carries no accessible role or name
```
