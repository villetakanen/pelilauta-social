---
status: live
---

# CnReactionButton

## Blueprint

### Context

A reader sees how many love reactions an entry has and whether their reaction is
among them. When the reaction is available to them, CnReactionButton lets the reader
toggle that state in the compact action regions used by entries and replies.

### Architecture

CnReactionButton is a controlled Svelte component whose root is a native toggle
button. The consumer supplies the current count and pressed state, handles the native
click and supplies any updated state.

CnReactionButton has its own action presentation and does not compose the button
presentation from `specs/design-system/actions/spec.md`. It composes the `love` noun
from `specs/design-system/components/cn-icon/spec.md` as decoration because the
required label names the control.

The public inputs are:

| Input | Type | Contract |
| :--- | :--- | :--- |
| `label` | `string` | Required localised accessible name for the love toggle. |
| `count` | `number` | Required non-negative integer reaction count. |
| `countLabel` | `string` | Required localised accessible description of `count`. |
| `pressed` | `boolean` | Whether the current reader's reaction is included; defaults to false. |
| `disabled` | `boolean` | Whether the reader can operate the control; defaults to false. |
| `small` | `boolean` | Selects the compact presentation; defaults to false. |
| `onclick` | `(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => void` | Required native click handler. |

### Documentation

The CnReactionButton Component book,
`apps/design/src/content/components/cn-reaction-button.mdx`.

### Constraints

The root is a native `button` with `type="button"`. It lays out the circular state
surface and the count in one non-wrapping row, so activating either visible part is
one activation. `pressed` maps to `aria-pressed`, and `disabled` maps to the native
disabled state. The button takes its accessible name from `label` and its accessible
description from `countLabel`. The numeric count remains visible in every state.

| Presentation | Button block size | State-surface diameter | Count type |
| :--- | :--- | :--- | :--- |
| Default | `2 × --cn-line` | `2 × --cn-line - 0.5 × --cn-grid` | Text |
| Small | `1.5 × --cn-line` | `1.5 × --cn-line - 0.5 × --cn-grid` | Caption |

The circular state surface is centred in the button's block size. The count has one
grid unit of inline padding. Neither presentation grows or shrinks in a flex row.

At rest, the state surface uses `--cn-button-text` and `--cn-text-low`. Hover composes
`--cn-hover` and the button hover shadow; active composes `--cn-active`. The pressed
surface is a 120-degree gradient from CnReactionButton's private love expression at
11% to its private error expression at 90%, each drawn from its fixed
`--chroma-love-*` or `--chroma-error-*` scale, with `--cn-surface` as its
foreground. Keyboard focus uses `--cn-focus-ring`. The pressed gradient remains
beneath hover and active feedback.
Disabled presentation keeps the supplied pressed state beneath
`--cn-disabled-opacity` and takes no hover or active feedback. A state change does
not alter the control's dimensions or move the count.

A supplied change of `pressed` replays a burst: a replica of the noun expanding out
of the state surface and fading, in CnReactionButton's private love expression
where the reaction landed and `--chroma-primary-20` where it left. A click alone
plays nothing.

Transitions and the burst use the shared UI duration and easing roles and stop when
the reader requests reduced motion.

## Contract

### Definition of Done

- Both applications can import and server-render CnReactionButton from the local
  design system package.
- The Component book documents the public inputs and renders both sizes with
  unpressed, pressed, disabled and zero-count specimens in Light and Dark.
- A live book specimen demonstrates a consumer accepting a native click and returning
  the updated count and pressed state.
- Every scenario below runs as a deterministic check in `apps/design`.
- Human review accepts both sizes and every state and value specimen in Light and
  Dark.

### Regression Guardrails

- No descendant becomes another focus stop.
- The initial server response contains the complete control, state and count.

### Scenarios

```gherkin
Given an unpressed CnReactionButton with a label, count and countLabel
When its initial server response renders without client-side JavaScript
Then its root is one native button named by the label
And it reports aria-pressed false
And the count is visible inside it
And the countLabel is its accessible description
```

```gherkin
Given an enabled CnReactionButton
When the reader activates its state surface or count with the pointer
Then one native click reaches the consumer
And the component's pressed state and count remain at their supplied values
```

```gherkin
Given a focused enabled CnReactionButton
When the reader presses Space or Enter
Then one native click reaches the consumer
```

```gherkin
Given a CnReactionButton
And its consumer supplies a new count, countLabel and pressed state
When it rerenders
Then the visible count shows the supplied count
And its accessible description is the supplied countLabel
And aria-pressed reports the supplied state
```

```gherkin
Given a disabled pressed CnReactionButton
When the reader attempts pointer or keyboard activation
Then no click reaches the consumer
And the control is announced as disabled
```

```gherkin
Given a disabled pressed CnReactionButton
When the pointer hovers over and presses it
Then the pressed surface remains beneath the disabled opacity
And hover and active add no feedback
```

```gherkin
Given default and small CnReactionButtons with the same state
When they render in one action row
Then each uses its presentation's button, state-surface and count measurements
```

```gherkin
Given a CnReactionButton with pressed true or false
When it receives hover, activation and keyboard focus in turn
Then each state keeps the state surface and count in the same positions
And keyboard focus remains visible
```

```gherkin
Given a pressed CnReactionButton
When it is hovered and then activated
Then the pressed gradient remains beneath the hover and active feedback
```

```gherkin
Given a CnReactionButton on a page carrying the global Actions presentation
When it renders
Then its geometry, surface and states are the CnReactionButton presentation alone
```

```gherkin
Given a CnReactionButton and a reader who requests reduced motion
When its interaction state changes
Then the transition has no duration
```
