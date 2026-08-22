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

### Architecture

`packages/design-system/styles/dividers.css` holds the rule, and it reaches both
applications through the stylesheet entry point.

The mark is a hairline border on the block-start edge. A hairline is a device length
rather than a reader-scaled one, because a divider holds the same weight whatever text
size the reader has set. `<hr>`'s browser presentation is an inset border on every edge,
so the rule clears them and states the one it wants.

The mark takes the `--cn-color-border` semantic role.
`specs/design-system/color-system/spec.md` governs what a semantic role is and how a
consumer takes one.

### Documentation

The Dividers book, `apps/design/src/content/base/dividers.mdx`.

### Constraints

- The mark carries no margin of its own. The space around a divider is the rhythm the
  area holding it states, under
  `specs/design-system/content-container-layouts/spec.md`.
- The mark spans the width it is given and states no width of its own.
- Dividers publishes the element and nothing else. A component that draws the same
  hairline inside its own box states it there.

## Contract

### Definition of Done

- A thematic break in rendered Markdown is visible to a reader in both applications and
  both colour schemes.
- A divider between two blocks in a content area sits at the area's rhythm, with no
  space the divider added.

### Regression Guardrails

- The mark is the block-start edge alone, and the element's other three edges stay
  cleared. Uncleared, the browser's own inset border returns beside the hairline and the
  divider paints two device pixels in two colours.

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
