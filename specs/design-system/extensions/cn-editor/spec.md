---
status: live
---

# CnEditor

## Blueprint

### Context

A member writing long-form markdown — a thread, a site page, a handout — gets an
editor instead of a bare textarea: the document shows its structure while it is
written, and content pasted from a rich source lands as markdown rather than as
markup to clean up. The editor is a canvas that takes the space it is given and
scrolls its own document; where writing and page layout compete, writing wins.

### Architecture

The editor lives in `packages/editor`, a workspace package outside
`packages/design-system`, so a page without an editor ships none of CodeMirror's
weight and the design system stays free of it. It is a design-system component
filed under the extensions category: specified and booked as a component, carried
in a package of its own.

A framework-agnostic factory, `createEditor`, holds everything the editor is —
configuration, theme, paste contract — and returns a handle of semantic
operations. A host holds only a lifecycle: `CnEditor.svelte` mounts the factory
and syncs its props onto the handle. The package exports no way to alter the
extension set; publishing it would hand the configuration back to the views,
which is the arrangement this package replaced.

The editor is the field `specs/design-system/fields/spec.md` governs, rather than
a surface holding one: it reads that spec's colour roles, type size and
indicator — in the mono face `specs/design-system/fonts/spec.md` decides — so
the surface a reader types into is one surface across the system.
Markdown structure is painted from the typography tokens, so a heading in the
editor and a heading on the page agree. Selection paints
`--cn-color-selection`, because the editor draws its own selection layer and the
browser's default cannot reach it.

Every module in the package is import-safe on a server; only calling
`createEditor` needs a browser. A consumer mounts it client-only.

### Documentation

- `apps/design/src/content/extensions/editor.mdx`

### Constraints

The syntax is markdown, and nothing else: no code-block language loading, no
other grammars. A new syntax is a change to this spec.

The value contract is external write as prefill or reset: setting the bound
value replaces the whole document and collapses the selection to its start,
and setting it to what the document already reads dispatches nothing. Streaming into a document
while the reader types is not a case this answers.

Pasted HTML is sanitised, then converted to GFM markdown; plain text pastes as
it is.

The theme variant is resolved from the mount target's computed `color-scheme`,
once, at mount; a stated `dark` prop overrides it. A reader switching theme
mid-edit is not a case this answers.

Disabled is read-only with the field's disabled treatment, mirrored onto the
host as `aria-disabled` because CodeMirror's read-only facet renders and
announces nothing. The fill dims by `--cn-disabled-opacity` while
`--cn-color-field-disabled` has no value, as `fields.css` does.

The host fills the column it is given and scrolls internally; the consumer owns
giving it a height-bounded column. Given a `name`, the host renders a hidden
input so a form reads the document from `FormData`.

The gutter is line numbers for a document long enough to navigate by them. It is
chrome beside the field, not part of the fill: a surface step, closed against
the content by the field's resting indicator.

## Contract

### Definition of Done

- The editor renders as the field: fill, indicator, mono face and states are
  the ones `fields.css` paints on a textarea, in both applications.
- Every view with an editor resolves one shared, content-hashed chunk; a
  production page without an editor contains no `@codemirror` module.

### Regression Guardrails

- `packages/design-system` contains no CodeMirror.
- Every `--cn-*` token the theme or the host stylesheet references is declared
  in `packages/design-system/styles/` — a token spelled right and declared
  nowhere renders as nothing. `packages/editor/test/tokens.test.ts` holds this.
- The package's public surface is the factory, its types and the Svelte host;
  nothing that carries the extension set crosses it.
  `packages/editor/test/createEditor.test.ts` asserts the barrel whole.

### Scenarios

Checks live in `packages/editor/test/`.

```gherkin
Given a mounted editor
When the reader types
Then the bound value and onChange carry the document
```

```gherkin
Given a mounted editor holding a document
When the consumer sets the bound value to what the document already reads
Then no transaction is dispatched
```

```gherkin
Given a mounted editor
When HTML is pasted
Then the document gains its markdown, sanitised
```

```gherkin
Given a root forced to light on a machine preferring dark
When an editor mounts under it
Then the light theme is built
```

```gherkin
Given a mounted editor whose document changed while focused
When focus leaves it
Then onBlur fires with the document; unchanged, it does not fire
```

```gherkin
Given a disabled editor
When the reader attempts to type
Then the document does not change, and the host reads aria-disabled
```
