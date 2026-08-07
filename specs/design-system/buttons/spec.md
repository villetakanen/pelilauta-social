---
status: draft
---

# Buttons

## Blueprint

### Context

Buttons present commands and form actions; link buttons present navigation with the
same visual language. Both use native HTML so their semantics, keyboard behaviour,
form behaviour, and destinations are available before hydration. The element choice
and the distinction between navigation and commands are defined by
`specs/design-system/links-and-actions/spec.md`; presentation never changes that
choice.

### Architecture

The design-system CSS entry styles native `button` elements and anchors with both an
`href` and the `button` class. No Button component or client-side behaviour mediates
the contract. Both applications therefore receive the same presentation from
`packages/design-system`.

The base selector owns the common geometry, type, surface, foreground, and
interaction states. The `text`, `cta`, and `secondary` classes modify that base
presentation directly. A component with its own button language may replace the
presentation within its scope; toggle buttons, reaction buttons, tray buttons, and
floating action buttons remain separate capabilities.

An Icon or inline CnLoader may occupy the leading position or stand alone. Button
context standardizes either to the small icon size through the contextual sizing
contract in `specs/design-system/components/cn-icon/spec.md`. CnLoader continues to
own its progress semantics and reduced-motion behaviour as specified in
`specs/design-system/components/cn-loader/spec.md`.

### Constraints

A link button is `a.button[href]`. It retains its destination, accessible name, and
native link attributes and behaviour. An anchor without an `href` is not a button
substitute. A native button declares the appropriate `type`; consumers do not depend
on the implicit `submit` default.

The variants are mutually exclusive:

| Variant | Intended prominence | Surface and foreground |
| :--- | :--- | :--- |
| Default | Standard action or navigation. | `linear-gradient(in oklab 137deg, var(--cn-button-light), var(--cn-button))` and `--cn-on-button`. |
| `.text` | Secondary or low-prominence action or navigation. | No background image; `color-mix(in oklab, var(--cn-button) 33%, transparent)` and `--cn-on-surface`. |
| `.cta` | The single most important action or destination in the current composition. | `linear-gradient(in oklab 137deg, var(--cn-button-cta), var(--cn-button))` and `--cn-on-button-cta`. |
| `.secondary` | The v20 alternate chroma treatment where that palette is explicitly required. It does not mean low prominence. | `linear-gradient(in oklab 137deg, var(--cn-button-secondary-light), var(--cn-button-secondary))` and `--cn-on-button`. |

The button stylesheet reads semantic button roles. It does not select reference
palette steps to reconstruct them. The `secondary` modifier applies only to
`button.secondary` and `a.button.secondary`; an unrelated `.secondary` ancestor does
not recolour descendants. The secondary-button roles preserve v20's theme mapping:
the light stop resolves to primary 40 in Light and primary 80 in Dark; the other stop
resolves to primary 60 in Light and primary 95 in Dark.

Button geometry is grid-derived:

| Measurement | Requirement |
| :--- | :--- |
| Visible block size | `4.75 × --cn-grid`. |
| Occupied row | `7 × --cn-grid`, with the visible control centred in the row. |
| Inline padding | `--cn-gap`. |
| Content gap | `--cn-grid`. |
| Radius | Half the visible block size. |
| Icon or inline-loader size | The small icon size. |

An icon-only or loader-only button has equal inline and block size and renders as a
circle. A labelled button may size intrinsically or stretch when its containing
layout stretches it. Truncation targets the text label node specifically so the
leading icon or inline loader retains its fixed square size without wrapping.

Button labels use the v20 button type role:

| Token | Relationship |
| :--- | :--- |
| `--cn-font-size-button` | Aliases `--cn-font-size-small`. |
| `--cn-font-weight-button` | Aliases `--cn-font-weight-caption`. |
| `--cn-line-height-button` | Aliases `--cn-line-height-small`. |
| `--cn-letter-spacing-button` | Aliases `--cn-letter-spacing-caption`. |

These button-specific semantic aliases let other button presentations consume the
role without copying its relationship to the typography scale.

Resting, hover, active, keyboard-focus, disabled, and loading states preserve the
current variant's foreground and surface identity. Hover adds the button elevation
and hover wash; active uses the stronger active wash. The washes compose over the
surface without a brightness filter. State transitions use the shared UI duration
and easing roles, `--cn-duration-ui` and `--cn-easing-ui`, which resolve to `0.22s`
and `ease-in-out`. Transitions resolve without motion when the reader requests
reduced motion. Keyboard focus adds `--cn-focus-ring` without depending on colour
change alone.

Only a native button has a disabled state, presented at `0.5` opacity. A link button is
either available and navigable or absent; `disabled`, `aria-disabled`, and a `disabled`
class do not create a disabled-link variant.

A command in flight uses a disabled native button containing an inline CnLoader,
alone or followed by its label. The button retains an accessible name describing the
command while the loader exposes progress. Loading does not become a state of a link
button.

## Contract

### Definition of Done

- Both applications receive native and link-button presentation from the
  design-system CSS entry without a wrapper or hydration.
- Default, `text`, `cta`, and direct `secondary` variants render the v20 button
  language in Light and Dark.
- Labelled, leading-icon, icon-only, labelled-loading, and loader-only compositions
  retain their accessible names and grid-aligned geometry.
- Hover, active, keyboard-focus, disabled, loading, and reduced-motion states are
  observable in the applicable native elements.
- The **Links, Actions and Buttons** Base book explains variant selection and renders
  every variant, composition, and applicable state from shipped source in Light and
  Dark.
- Button presentation no longer comes from the design site's editorial stylesheet,
  Cyan, or an application migration bridge.
- Human review accepts the variants, interaction feedback, label truncation, icon
  sizing, intrinsic and stretched layouts, and disabled and loading emphasis in both
  colour schemes.

### Regression Guardrails

- Presentation does not change an element's navigation, command, or form semantics.
- A global native-button rule does not become a rule for anchors without a destination
  or for component-specific button languages.
- A `.secondary` ancestor does not recolour a descendant button; the alternate
  treatment requires the direct button modifier.
- A disabled native button cannot submit a form, run a command, or receive keyboard
  focus. Link buttons do not acquire a simulated disabled state.
- Hover and active feedback do not alter the control's foreground through a filter,
  and keyboard focus remains visible without colour perception.
- The visible pill, occupied row, radius, gaps, and icon size continue to derive from
  the design-system spatial and icon roles when the reader changes the default text
  size.
- A button state or composition does not introduce a legacy token, literal colour,
  or component-private icon size.
- Button and link-button appearance remains equivalent for the same variant and
  content, apart from native element behaviour.

### Scenarios

```gherkin
Given a native button and an a.button with a destination
And both use the same variant and content
When they render in either colour scheme
Then their geometry, typography, surface, foreground, and interaction feedback match
And the native button remains a command or form control
And the link button remains navigation to its destination
```

```gherkin
Given a default, text, CTA, and secondary button
When each renders at rest, on hover, while active, and with keyboard focus
Then each state is visibly distinct where applicable
And each state preserves the selected variant's surface and foreground identity
And keyboard focus includes a visible focus ring
```

```gherkin
Given a button containing a leading Icon and a visible label
When the button renders
Then the Icon uses the small contextual size
And the content gap is one grid unit
And the button's accessible name describes its action or destination
```

```gherkin
Given a button containing only an Icon
When the button renders
Then its visible inline and block sizes are equal
And its radius makes the control circular
And it has an accessible name describing its action or destination
```

```gherkin
Given a native button whose command is in flight
When it renders an inline CnLoader alone or before its label
Then the button is disabled and cannot be activated or focused
And the loader uses the small contextual size and exposes progress
And the button retains an accessible name describing the command
```

```gherkin
Given a link button
When a consumer attempts to apply disabled, aria-disabled, or a disabled class
Then the design system provides no disabled-link presentation
And availability is represented by rendering a navigable destination or omitting the link
```

```gherkin
Given a default button inside an ancestor with class secondary
When the button does not itself have the secondary modifier
Then it retains the default button presentation
```

```gherkin
Given a reader who requests reduced motion
When a button changes between interaction states
Then its state feedback appears without a transition
```
