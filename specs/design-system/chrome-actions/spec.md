---
status: approved
---

# Chrome Actions

## Blueprint

### Context

Application chrome — bars, rails and trays — presents its commands and destinations
as one control that shows its label or collapses to its icon. A tray shows labels
while it is open and icons once it narrows to a rail; an application bar shows icons
only. Their structure follows Material Design's icon button: a target, a state
surface centred within it, and a state layer that composes over that surface. Material
supplies that structural model; the measurements, the states and their appearance are
local. A chrome action reads as part of the application frame rather than as a content
button.

### Architecture

A chrome action is an Actions presentation. `specs/design-system/actions/spec.md`
governs its elements, semantics, accessible naming, disabled contract, focus
treatment, colour-role rules and transitions; those apply unchanged and are not
restated here.

Compact and labelled are presentations of one control, not two controls. The element,
its destination or command, and its accessible name are the same in both.

A container declares which presentation its chrome actions take by setting the
inherited `--cn-chrome-presentation` to `compact` or `labelled`; how the container
decides — its own width, a reader's action, or a fixed choice — is the container's
business. Any other value, and no value at all, is compact. A chrome action reads that
declaration and never inspects its ancestors. Bars, rails and trays place chrome
actions and allocate the inline size a labelled action fills. They do not resize the
target's block size, the state surface or the Icon.

### Constraints

A chrome action composes with no Actions button variant. Measurements consume
`--cn-grid` from `specs/design-system/spatial-system/spec.md`:

| Part | Compact | Labelled |
| :--- | :--- | :--- |
| Target | A `7 × --cn-grid` square. | Its container's inline size, `7 × --cn-grid` in block size. |
| State surface | A centred circle `6 × --cn-grid` in diameter. | A centred pill, `6 × --cn-grid` in block size, filling the target's inline size. |
| Content | The Icon alone, centred. | The Icon, `--cn-gap`, then the label, from a `--cn-grid` inline inset at the start edge. |

The target owns hit testing and layout; the state surface owns the resting and
transient surfaces. The Icon changes neither measurement, and a label truncates rather
than wrapping.

A chrome action is an icon-size context resolving to the medium step.

The label is present in both presentations and names the control in both. Compact
hides it from view without hiding it from assistive technology, so a chrome action
needs no separate accessible name. v20 hides the same label from both, and this
capability does not.

A chrome action takes its foreground from the container that places it, so the class
displaces the default link colour and underline and the default button surface.

The state surface is transparent at rest and carries the transient feedback;
activation replaces hover rather than compounding it. The focus outline follows the
target. A chrome action has no persistent state.

## Contract

### Definition of Done

- One public design-system class renders both presentations on a native button and on
  a native anchor, outranking the default Actions button and link presentations.
- A book specimen renders both presentations and both elements, forcing rest, hover,
  active, keyboard focus and the disabled button, in Light and Dark.
- A browser check sets `--cn-chrome-presentation` on a plain wrapper of known inline
  size and asserts the native element, the computed target and state-surface geometry
  in each presentation, the compact result for an absent and an unrecognised value, an
  identical foreground on both elements, an unchanged accessible name across
  presentations, the Icon's resolved size, and an unchanged block size and bounding
  box across states.
- Human review accepts that a chrome action reads as chrome rather than as a content
  button, and that a label truncates legibly, at default and enlarged browser text
  sizes.

### Regression Guardrails

- A chrome action carries no selector that references a bar, rail or tray ancestor.
- A container does not resize the compact target, and does not redefine the labelled
  target's block size, the state surface or the Icon.
- Changing presentation does not replace the element, its destination or command, or
  its accessible name.
- The compact target remains square, and the state surface centred within it, in every
  state.
- Hover, active and focus presentation does not change the action's footprint or move
  neighbouring content.
- A chrome action acquires no persistent state; a toggle, a disclosure control and a
  current destination belong to their own capabilities.

### Scenarios

```gherkin
Given a chrome action whose container declares no presentation
When it renders at rest
Then it takes the compact presentation
And its target is seven grid units square
And its circular state surface is six grid units in diameter
And its state surface is transparent
```

```gherkin
Given a labelled chrome action in an open tray
When its container declares the compact presentation
Then the same element remains, with the same destination or command
And its label is no longer visible
And its accessible name is unchanged
And its target is seven grid units square
```

```gherkin
Given a chrome action rendered as a button and as an anchor
When each renders at rest
Then their foregrounds are identical
And neither carries a link underline or a button surface
```

```gherkin
Given a chrome action in either presentation
When it receives hover, then activation, then keyboard focus
Then the focus outline follows the target
And its footprint does not change
```
