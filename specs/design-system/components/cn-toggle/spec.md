---
status: approved
---

# CnToggle

## Blueprint

### Context

`CnToggle` flips one boolean setting and applies it the moment it is flipped,
with no submit step. The model is Material 3's switch. The settings surfaces —
site options, site settings, the player tool, the create form and the admin
user pane — are the consumers, replacing Cyan's `cn-toggle-button`.

### Architecture

`CnToggle.svelte` is a Svelte 5 component with no custom element or Shadow DOM.
It renders a label and a native checkbox announcing as a switch. Toggling,
keyboard operation, focus, the disabled state and the `change` event come from
the input; the component adds no listeners. Cyan's element rebuilt all of these
on its host — a button role, a tabindex, a keydown handler — and the rebuild is
what the migration retires, not the tag alone.

The component holds no state of its own: the consumer supplies the current
value through the `checked` prop, the input carries it, and the consumer reads
it back from the `change` event.

### Documentation

The CnToggle Component book, `apps/design/src/content/components/cn-toggle.mdx`.

### Constraints

- Every toggle takes its accessible name from the `label` prop; there is no
  unlabelled variant. The v18 admin freeze toggle rendered nameless, and its
  migration adds the name.
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
  keyboard or focus behaviour is the Cyan element back under a new name.
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
