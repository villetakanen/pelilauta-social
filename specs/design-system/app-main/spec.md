---
status: proposed
---

# App Main

## Blueprint

### Context

The document's main element does two jobs at once. It stands clear of the app chrome,
which is fixed and paints over the page, and it is the container the application's
content containers read their width from. Both jobs need spacing stated on that one
box. A bare `main` selector cannot state it, because a layout may place its own
geometry instead — `apps/pelilauta/src/layouts/EditorPage.astro` does — so the frame
is a class a page opts in with.

### Architecture

The frame is one class, `.app-main`, in `packages/design-system/styles/app-main.css`.
Apply it to the page's `<main>`, and to nothing else: `<main>` is the document's
landmark for the page body, and the frame is that landmark's geometry. Nothing matches
a bare `<main>`.

`../content-container-layouts/spec.md` governs what a content container does inside
the frame. The frame establishes the containment context those containers resolve
against, and states nothing else about them.

`../rail/spec.md` states how the frame gives inline space to a rail.
`../../editor/shell/spec.md` governs the editor shell, which sets its own position.

Not governed here: which elements an application puts in the frame.

### Documentation

No book page documents the frame yet. The Content Container Layouts book references it
for the width the frame offers a container.

### Constraints

`.app-main` establishes an inline-size containment context, so a content container
placed in the frame resolves against the frame width. The containment also makes the
frame the containing block for absolutely and fixed positioned descendants.

The frame insets the page by `--cn-gap` on each inline edge, as padding. A child
therefore takes the width the frame offers.

The frame clears `--cn-app-bar-height` at the block start. Chrome is fixed and paints
over the document. `../app-chrome/spec.md` governs the chrome.

Make the children of the frame content containers, or `astro-island`s rendering one.
The frame states no separation between them; each content container carries the
separation that follows it. A child that is neither has no layout guarantee.

## Contract

### Definition of Done

- A frame begins one `--cn-app-bar-height` below its block start and one `--cn-gap`
  from each of its inline edges.
- A `<main>` that does not carry the class takes no inset, no clearance and no
  containment context.

### Regression Guardrails

- The frame stylesheet supplies the containment context, the inline inset and the bar
  clearance, and nothing else. The separation between the children of the frame
  stays on the containers.
- Every rule in the frame stylesheet sits below `.app-main`;
  `packages/design-system/test/app-main.test.ts` reads the stylesheet to check that.
- The frame element remains the containing block for absolutely and fixed positioned
  descendants, so a part that must position against the viewport stays outside it.

### Scenarios

Run by `apps/design/e2e/app-main.spec.ts`.

```gherkin
Given a page whose main element carries app-main
When the page renders
Then the content begins one --cn-app-bar-height below the frame's block start
And the frame insets the content by --cn-gap from each of its inline edges
```

```gherkin
Given a page whose main element does not carry app-main
When the page renders
Then it takes no inset, clearance or containment context
```

```gherkin
Given a content container as a direct child of app-main
When the container queries inline size without naming a container
Then the query resolves against the frame content-box width
```
