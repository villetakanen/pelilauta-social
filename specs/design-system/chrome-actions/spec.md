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
treatment, colour-role rules and transitions; those apply wherever this spec states
nothing else.

Compact and labelled are presentations of one control, not two controls. The element,
its destination or command, and its accessible name are the same in both.

A helper fixes one chrome action's glyph, semantics and report so an application composes
it rather than rebuilding it, and publishes no variants: a consumer chooses neither its
glyph, its element nor its event. Each carries a sub-spec, and states only what this one
does not: `back-action/spec.md`, `share-action/spec.md`,
`../components/cn-theme-switch/spec.md`.

A subtype states what it adds to a chrome action, and no measurement this one gives:
`notification-action/spec.md`.

A container declares which presentation its chrome actions take by setting the
inherited `--cn-chrome-presentation` to `compact` or `labelled`; how the container
decides — its own width, a reader's action, or a fixed choice — is the container's
business. Any other value, and no value at all, is compact. A chrome action reads that
declaration and never inspects its ancestors. Bars, rails and trays place chrome
actions and allocate the inline size a labelled action fills. They do not resize the
target's block size, the state surface or the Icon.

### Documentation

- `apps/design/src/content/base/chrome-actions.mdx`

### Constraints

A chrome action composes with no Actions button variant. Measurements consume
`--cn-grid` from `specs/design-system/spatial-system/spec.md`:

| Part | Compact | Labelled |
| :--- | :--- | :--- |
| Target | A `7 × --cn-grid` square. | Its container's inline size, `7 × --cn-grid` in block size. |
| State surface | A centred circle `6 × --cn-grid` in diameter. | A centred pill, `6 × --cn-grid` in block size, filling the target's inline size. |
| Content | The Icon alone, centred. | The Icon, `--cn-gap`, then the label, from the inset that centres the Icon in the compact target. |

The target takes hit testing and layout; the state surface carries the resting and
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
target.

A disabled chrome action is announced as disabled, and does not act. A command carries
`disabled`. A destination keeps its `href` and carries `aria-disabled="true"` and
`tabindex="-1"`, and the class suppresses its pointer events. Neither takes hover or
active feedback.

`[aria-current]` displaces that transparent rest with `--cn-indicator`, and the
foreground becomes `--cn-on-indicator` in every state. The indicator and the transient
wash occupy separate paint channels on the one surface, so neither suppresses the
other. `aria-current="false"` is not a current destination; every other value presents
the same. A `button` carries a command and takes no indicator, whatever `aria-current`
it declares. The state adds no class, attribute or accessible state of its own.

The foreground identifies the state and the surface reinforces it. `--cn-on-indicator`
is opaque and meets AA against the surfaces a chrome action stands on, and is
distinguishable from a non-current action's foreground. `--cn-indicator` is a tint of
the same family, quiet enough that chrome does not read as a slab of brand colour, and
therefore not asked to carry identification on its own. Both are declared in
`packages/design-system/styles/color-theme.css`.

## Contract

### Definition of Done

- One public design-system class renders both presentations on a native button and on
  a native anchor, outranking the default Actions button and link presentations.
- `--cn-indicator` and `--cn-on-indicator` resolve in both schemes.
- A book specimen renders both presentations and both elements, forcing rest, hover,
  active, keyboard focus, a disabled button beside a disabled anchor, and a current
  destination beside a non-current one, in Light and Dark.
- Human review accepts that a chrome action reads as chrome rather than as a content
  button, and that a label truncates legibly, at default and enlarged browser text
  sizes.

### Regression Guardrails

- A chrome action carries no selector that references a bar, rail or tray ancestor.
- A container does not resize the compact target, and does not redefine the labelled
  target's block size, the state surface or the Icon.
- Changing presentation does not replace the element, its destination or command, or
  its accessible name, and does not move the Icon.
- The compact target remains square, and the state surface centred within it, in every
  state.
- Hover, active and focus presentation does not change the action's footprint or move
  neighbouring content.
- A toggle and a disclosure control keep their own persistent states; the current
  destination is the only one this capability carries.
- Hover and active feedback never replaces the indicator, and the indicator never
  suppresses hover or active feedback.
- `--cn-indicator` remains distinct from `--cn-hover` and `--cn-active` in both schemes.
- A disabled command and a disabled destination present the same, and each stays in
  the accessibility tree.

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

```gherkin
Given an anchor chrome action with aria-current, beside one without
When the pointer rests on each in turn, and each is then activated
Then the current destination carries --cn-indicator and --cn-on-indicator throughout
And its resting, hovered and active surface paints are three distinct values
And its target, state surface and bounding box match the other's
```

```gherkin
Given a disabled anchor chrome action beside a disabled button chrome action
When the pointer rests on each in turn, and each is then activated
Then the two present the same, at rest and under the pointer
And each is announced as disabled
And neither navigates nor runs a command
```

```gherkin
Given an anchor chrome action with aria-current="false"
And a button chrome action with aria-current
When each renders at rest
Then neither carries the indicator
And the button remains a command
```
