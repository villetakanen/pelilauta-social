---
status: live
---

# Actions

## Blueprint

### Context

Links take a reader to a destination. Actions submit data or run a command in the
current task. Element semantics take precedence over presentation: the capability's
presentations — the default link, the button, and the floating action button — share
one grammar of variants, states and composition, and none of them changes what the
element underneath is.

### Architecture

The design-system CSS entry applies every action presentation to native elements: the
default link to anchors with destinations, button presentation to `button` and
`a.button[href]`, FAB presentation to `button.fab`, `a.fab[href]` and
`a.button.fab[href]`. No component or client-side behaviour mediates the contract, so
both applications receive the same presentation from `packages/design-system`.

Each presentation's base selector states its geometry, type, surface, foreground and
interaction states; variant classes modify that base directly. A component with its
own action language may replace a presentation within its scope; toggle buttons,
reaction buttons and tray buttons remain separate capabilities. Placement of floating
actions is the tray's, defined by `specs/design-system/fab-tray/spec.md`; a FAB never
positions itself.

`styles/buttons.css` publishes the button type role — `--cn-font-size-button` and its
weight, line-height and letter-spacing companions — as semantic aliases onto the
typography scale. Every action presentation consumes the role; none restates its
relationship to the scale. Each control is an icon-size context: an Icon or inline
CnLoader in the leading position, or standing alone, resolves to the small step
through the contextual sizing contract in
`specs/design-system/components/cn-icon/spec.md`, and CnLoader keeps the progress
contract in `specs/design-system/components/cn-loader/spec.md`.

### Documentation

- `apps/design/src/content/base/links-actions-buttons.mdx`

### Constraints

#### Semantics

Navigation that occurs only after a successful command does not turn its initiating
button into a link. An anchor without an `href` receives no action presentation. A
native button declares the appropriate `type`; consumers do not depend on the implicit
`submit` default.

Consumers select the native element before applying a presentation class.

A Cancel control that leaves an edit form for its view URL is an anchor presented as
a button, with the explicit view URL as its `href`; it does not traverse browser
history. A Cancel control that only dismisses an interface or resets local state is a
button.

#### Shared grammar

Every state preserves the chosen variant's surface and foreground identity; hover
and active feedback composes over the surface without a brightness filter. State
transitions use the shared UI duration and easing roles and resolve without motion
when the reader requests reduced motion. Keyboard focus adds `--cn-color-focus-ring`
without depending on colour change alone.

A disabled control renders at `--cn-disabled-opacity`.

A command in flight is a disabled native control containing an inline CnLoader, alone
or before its label, and retains an accessible name describing the command. This
capability publishes no disabled presentation for an anchor: availability is a
navigable destination, or no control.

An icon-only or loader-only control has equal inline and block sizes and takes its
accessible name from the control, never from the child. Truncation targets the text
label node so a leading icon or loader keeps its fixed square size.

Presentations read semantic colour roles; they do not select reference palette steps
to reconstruct them, introduce a legacy token, a literal colour or a
component-private icon size.

#### The default link

| State | Presentation |
| :--- | :--- |
| Resting | Underlined, using `--cn-color-link`. |
| Visited | The resting presentation; browsing history is not disclosed globally. |
| Hover | Underlined, using `--cn-color-link-hover`. |
| Active | Underlined, using `--cn-color-link-active`. |
| Keyboard focus | A visible outline using `--cn-color-focus-ring`, in addition to the current colour and underline. |

Link presentation does not introduce another colour value or change typography
metrics. A component may replace the resting underline or colour when its
specification defines a contextual treatment and preserves visible hover and
keyboard-focus feedback. This capability publishes no class for removing or
conditionally restoring link decoration.

#### The button

A button's surface is v20's gradient between the variant's pair of colour roles; the
`text` variant carries no background image and washes on interaction. The variants
are mutually exclusive:

| Variant | Intended prominence | Roles |
| :--- | :--- | :--- |
| Default | Standard action or navigation. | `--cn-color-button-light`, `--cn-color-button`, `--cn-color-on-button`. |
| `.text` | Secondary or low-prominence action or navigation. | A translucent `--cn-color-button` wash and `--cn-color-on-surface`. |
| `.cta` | The single most important action or destination in the current composition. | `--cn-color-button-cta`, `--cn-color-button`, `--cn-color-on-button-cta`. |
| `.secondary` | The v20 alternate chroma treatment where that palette is explicitly required. It does not mean low prominence. | A colour pair scoped to the variant, and the shared `--cn-color-on-button` foreground. |

The `secondary` modifier applies only to the control itself; an unrelated
`.secondary` ancestor does not recolour descendants. The scoped pair preserves
v20's theme mapping: the light stop resolves to primary 40 in Light and primary 80 in
Dark, the other stop to primary 60 in Light and primary 95 in Dark.

Button geometry is grid-derived:

| Measurement | Requirement |
| :--- | :--- |
| Visible block size | `4.75 × --cn-grid`. |
| Occupied row | `7 × --cn-grid`, with the visible control centred in the row. |
| Pointer target | `6 × --cn-grid` in both axes, centred on the visible control. |
| Inline padding | `--cn-gap`. |
| Content gap | `--cn-grid`. |
| Radius | Half the visible block size. |

Every control has a pointer target, and the target is not the visible control: where a
control paints smaller than the target in either axis, the target extends past what it
paints. A control's own spacing is not its target, because margin receives no pointer
events. The target fits within the occupied row, so a control's target does not decide
the row it sits in.

An icon-only or loader-only button renders as a circle. A labelled button may size
intrinsically or stretch when its containing layout stretches it. Hover adds the
button elevation and hover wash; active uses the stronger active wash.

#### The floating action button

A FAB carries an Icon or an inline CnLoader in the leading position, and may carry a
visible text label in a trailing `span`. It keeps its label on one line. A FAB may
lose its visible label and keep its accessible name; the trigger for that omission is
the tray's, defined by `specs/design-system/fab-tray/spec.md`.

A FAB's surface is v20's gradient between the variant's pair of colour roles, scoped
to the FAB presentation and named for it rather than published as a `--cn-*`
contract. The `secondary` surface follows v20 in running its gradient against the
default angle. The variants are mutually exclusive:

| Variant | Intended prominence | Colour pair |
| :--- | :--- | :--- |
| Default | The view's prominent contextual action. | Primary 70 blending to surface 50, with a surface-100 foreground. |
| `.cta` | The contextual action requiring the strongest attention. | Error 60 blending to surface 50, with a surface-100 foreground. |
| `.secondary` | A supporting action shown beside the prominent action. | The shared `--cn-color-button` blending toward `--cn-color-on-surface`, with the shared `--cn-color-on-button` foreground. |

The standard FAB has a minimum inline size and a fixed block size of seven grid
units; the `small` modifier uses the regular button size for both measurements. A
labelled FAB grows intrinsically in the inline direction with grid-derived inline
padding and content spacing. Both sizes use the large radius and never stretch to
consume flex or grid space.

The resting FAB uses `--cn-shadow-elevation-1`; hover lifts to
`--cn-shadow-elevation-4` and active settles at `--cn-shadow-elevation-2`.

## Contract

### Definition of Done

- Both applications receive link, button and FAB presentation from the design-system
  CSS entry without a wrapper or hydration.
- Every variant of every presentation renders the v20 visual language in Light and
  Dark, as native buttons and as anchors with destinations.
- Labelled, leading-icon, icon-only, labelled-loading and loader-only compositions
  retain their accessible names and grid-derived geometry.
- Hover, active, keyboard-focus, disabled, loading and reduced-motion states are
  observable in the applicable native elements.
- The **Links, Actions and Buttons** Base book explains element and variant
  choice and renders every presentation, variant, composition and applicable
  state from shipped source in Light and Dark.
- Action presentation no longer comes from the design site's editorial stylesheet,
  Cyan, or an application migration bridge.
- Human review accepts the presentations, interaction feedback, label truncation,
  icon sizing, and disabled and loading emphasis in both colour schemes.

### Regression Guardrails

- Presentation never converts navigation into a command or a command into
  navigation, and never removes anchor behaviour.
- The global presentation does not disclose whether a destination was visited.
- A global rule for one presentation does not become a rule for anchors without a
  destination or for component-specific action languages, and a component-specific
  link treatment does not become a global utility.
- A `.secondary` ancestor does not recolour a descendant control; the alternate
  treatment requires the direct modifier.
- Hover and active feedback do not alter the control's foreground through a filter,
  and keyboard focus remains visible without colour perception.
- Geometry continues to derive from the design-system spatial and icon roles when
  the reader changes the default text size; FAB geometry remains fixed against flex
  and grid growth, and a label changes intrinsic inline size without changing block
  size.
- A state, variant or composition does not introduce a legacy token, literal colour
  or component-private icon size.
- The disabled state's only paint change is opacity from the shared token.
- An icon-only or loader-only control never depends on its child for the control's
  accessible name.
- A control that paints smaller than the pointer target keeps the full target in both
  axes, an icon-only control and a small FAB included.

### Scenarios

```gherkin
Given an anchor with a destination and no presentation class
When it renders in either colour scheme
Then it is underlined and uses the resting link role
And hover, active and keyboard focus are visibly distinct
```

```gherkin
Given a previously visited anchor with a destination
When it renders
Then it uses the same presentation as an unvisited anchor
```

```gherkin
Given a button that submits data or runs a command
When successful completion redirects to another page
Then the initiating control remains a button
```

```gherkin
Given an edit form whose Cancel control returns to its view URL
When the control renders
Then it is an anchor presented as a button
And its destination is the explicit view URL
And activating it does not submit the form
```

```gherkin
Given a native control and an anchor twin with a destination
And both use the same presentation, variant and content
When they render in either colour scheme
Then their geometry, typography, surface, foreground and interaction feedback match
```

```gherkin
Given each variant of the button and FAB presentations
When each renders at rest, on hover, while active, and with keyboard focus
Then each state is visibly distinct where applicable
And each state preserves the chosen variant's surface and foreground identity
And keyboard focus includes a visible focus ring
```

```gherkin
Given a control containing a leading Icon and a visible label
When it renders
Then the Icon uses the small contextual size
And the content gap is one grid unit
And the control's accessible name describes its action or destination
```

```gherkin
Given a button and a FAB containing only an Icon
When they render in a flex or grid composition
Then each retains equal inline and block sizes for its chosen presentation and size
And neither stretches into the available space
And each has an accessible name describing its action or destination
```

```gherkin
Given a native control whose command is in flight
When it renders an inline CnLoader alone or before its label
Then the control is disabled and cannot be activated or focused
And the loader uses the small contextual size and exposes progress
And the control retains an accessible name describing the command
```

```gherkin
Given a default control inside an ancestor with class secondary
When the control does not itself have the secondary modifier
Then it retains its default presentation
```

```gherkin
Given a component whose specification replaces the resting link presentation
When its link receives hover or keyboard focus
Then the component provides visible feedback for both states
```

```gherkin
Given a reader who requests reduced motion
When a control changes between interaction states
Then its state feedback appears without a transition
```
