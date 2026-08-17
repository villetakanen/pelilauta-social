---
status: approved
---

# Back Action

## Blueprint

### Context

Pelilauta presents modals both as dialogs and as pages standing in for them. The back
action is the default button for exiting the modal.

### Architecture

A Svelte 5 component, `packages/design-system/components/CnBackAction.svelte`. It is a
command: it navigates nothing, and is never a destination.

### Constraints

Activation dispatches `cn-back`, which bubbles. The control changes neither the document
nor the session history, and knows nothing of the reader's unsaved work.

The glyph is the `arrow-left` Icon.

`label` defaults to `<`, which names the control for nobody. The default is deliberate:
`<` reads as a placeholder, where an English name would read as a finished label.

## Contract

### Definition of Done

- The chrome actions book renders the control, in Light and Dark, beside a specimen that
  shows each activation's `cn-back` event.
- A browser check asserts that pointer and keyboard activation each dispatch `cn-back`,
  that the event reaches a listener above the control, that the accessible name is the
  label, and that an activation changes neither the document nor the session history.
- Human review accepts that the control reads as closing the modal at every browser text
  size.

### Regression Guardrails

- One activation dispatches one event.

### Scenarios

```gherkin
Given a back action
When the reader activates it
Then cn-back is dispatched
And neither the document nor the session history changes
```

```gherkin
Given a back action with a label
When it renders
Then its accessible name is that label
```
