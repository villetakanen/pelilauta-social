---
status: live
---

# CnToggle

## Blueprint

### Context

`CnToggle` flips one boolean setting and applies it the moment it is flipped,
with no submit step. The model is Material 3's switch.

### Architecture

`CnToggle.svelte` is a Svelte 5 component with no custom element or Shadow DOM.
It renders a label and a native checkbox announcing as a switch. Toggling,
keyboard operation, focus, the disabled state, and the `change` event come from
the input; the component adds no listeners, roles, or tabindexes to rebuild
what the input already carries.

The component holds no state of its own: the consumer supplies the current
value through the `checked` prop, the input carries it, and the consumer reads
it back from the `change` event.

The checked thumb reads `--chroma-primary-70` directly rather than through a
semantic role: the checked track already carries the primary accent through
`--cn-button-light`, and the thumb's step is a private contrast expression local to
this component.

### Documentation

The CnToggle Component book, `apps/design/src/content/components/cn-toggle.mdx`.

### Constraints

- Every toggle takes its accessible name from the `label` prop; there is no
  unlabelled variant.
- The control is a row spanning its container: the label leads and the switch
  trails at the row's end, so the switches in a settings pane align on one
  edge.

## Contract

### Definition of Done

- Both applications receive `CnToggle` from the design system's components.
- The Component book renders unchecked, checked and disabled toggles, stacked
  as one pane, in both themes.
- Every scenario below runs as a check in `apps/design`.
- Human review accepts both states in both themes.

### Regression Guardrails

- The switch stays a native checkbox; a host that re-implements its state,
  keyboard, or focus behaviour has defeated the component's purpose.
- The state reaches assistive technology as a switch carrying the label's
  name.
- Checked and unchecked stay distinguishable by thumb position, not by colour
  alone.

### Scenarios

```gherkin
Given an unchecked toggle
When the user activates it with the pointer
Then the toggle is checked
And a change event reaches the consumer
```

```gherkin
Given a focused toggle
When Space is pressed
Then the toggle's state flips
And a change event reaches the consumer
```

```gherkin
Given a disabled toggle
When the user activates it
Then the state does not change
And no change event is emitted
```
