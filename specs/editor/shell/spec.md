---
status: proposed
---

# Editor shell

## Blueprint

### Context

A member edits one markdown document — a site page, a handout, a thread — as a
whole: the body in the canvas, and where the document carries frontmatter, its
fields beside it. The shell
makes editing feel like editing the published page, because the editor
descends from Mekanismi's wiki editor and the site is served first: the
writing column stands where the page's text stands, at the page's measure.
Leaving with unsaved work is the one departure that costs the writer
something, so the shell asks before it happens.

### Architecture

A component in `packages/editor`, beside the canvas `../spec.md` governs.
The consumer — an application's editor route — supplies the frontmatter
region's fields, the save that makes the document clean, and where leaving
lands; the shell supplies the geometry and the dirty state. The document's
storage shape is the consumer's; to the shell it is one document, body and
frontmatter, whose raw markdown form exists only as a download.

The inline geometry is `content-golden`'s, taken from
`specs/design-system/content-container-layouts/spec.md` rather than restated —
the text column is the primary, the frontmatter region the secondary — with
one stated addition: the gutter stands at the text column's inline start,
outside the measure, so the canvas track is the measure plus the gutter and
the text aligns where the published page's text lands. The block axis is the
shell's: a content container sizes a region to its content, and this view
does the opposite.

The shell stands under the modal bar
`specs/design-system/application-chrome/spec.md` governs, and it is the
surface that decides the fixed bar's clearance: the view locks to the
viewport, the page never scrolls, and the canvas scrolls its document.

Dirty is the shell's: it derives the state from the document against the last
clean point, and exposes one consumer lever — marking the document clean after
a save. The document is the body and the frontmatter together: an edit in a
slotted field dirties it as a body edit does. The consumer never computes
dirtiness and the shell never saves.

### Documentation

- `apps/design/src/content/extensions/editor.mdx`

### Constraints

The frontmatter region stands beside the canvas, at the inline end, exactly
when `content-golden` composes wide; below that condition the regions stack,
frontmatter first, and the canvas takes the full inline size. The threshold is
golden's, not `--cn-breakpoint-small` — the editor stacks when the page would.
A consumer that slots no fields gets no region, and the canvas keeps its
column.

A departure while dirty through the bar's back asks on the shell's surface
before it proceeds. Departure by the browser's means — closing, reloading,
navigating away — gets the browser's native guard, whose form the shell cannot
shape. A clean departure proceeds silently either way. Editing after marking
clean makes the document dirty again.

An on-screen keyboard shortens the view, not the bar's clearance, so the
canvas stays above it.

## Contract

### Definition of Done

- At every viewport width the text stands at the published page's column —
  the measure, placed as `content-golden` places it — with the gutter outside
  it.
- A dirty document does not leave without the writer's say; a clean one leaves
  without a question.

### Regression Guardrails

- One inline-geometry source: the text column, the secondary and the stacking
  condition are `content-golden`'s, and the gutter is the only addition — the
  editor and the published page cannot drift apart width by width.
- The consumer's only dirty-state lever is marking clean; a shell change that
  lets a consumer set dirty, or saves on its behalf, breaks the split.

### Scenarios

```gherkin
Given a shell holding an edited, unsaved document
When the writer takes the bar's back action
Then the shell asks before leaving
```

```gherkin
Given a shell whose consumer marked the document clean
When the writer takes the bar's back action
Then the shell leaves without asking
```

```gherkin
Given a shell whose consumer marked the document clean
When the writer edits the document again
Then the document is dirty
```

```gherkin
Given a shell whose consumer marked the document clean
When the writer edits a slotted frontmatter field
Then the document is dirty
```

```gherkin
Given a viewport where content-golden composes wide
When an editor route renders
Then the text stands at the measure, the gutter outside it, the frontmatter
region beside them
```

```gherkin
Given a viewport below content-golden's wide condition
When an editor route renders
Then the frontmatter region stacks above the full-width canvas
```
