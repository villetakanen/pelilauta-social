---
status: approved
---

# Navigation Destination

## Blueprint

### Context

A chrome action that leads to the reader's current location shows it at rest, in every
presentation and in every container.

### Architecture

This capability extends `specs/design-system/chrome-actions/spec.md`.

`[aria-current]` switches the indicator, per the interaction-state table in
`docs/ARCHITECTURE.md`. `aria-current="false"` is not a current destination. Every other
value produces the same presentation.

A `button` carries a command and receives no indicator, whatever `aria-current` it
declares.

A current destination displaces the state surface's transparent rest, and the indicator
and the transient wash occupy separate paint channels on that one surface.

### Constraints

`--cn-indicator` and `--cn-on-indicator` are declared as semantic roles in
`packages/design-system/styles/color-theme.css`, as opaque roles rather than translucent
washes. `--cn-on-indicator` on `--cn-indicator` meets WCAG AA in Light and Dark.
`--cn-indicator` is distinct from `--cn-hover` and `--cn-active`, and reaches the WCAG
1.4.11 non-text threshold against `--cn-surface`. That pairing is remeasured against the
chrome container's own surface role once one is specified.

The action's foreground is `--cn-on-indicator` in every state.

The presentation adds no accessible state, attribute or class of its own.

## Contract

### Definition of Done

- `--cn-indicator` and `--cn-on-indicator` resolve in both schemes, and their pairing is
  asserted at AA in `packages/design-system/test/color-contrast.test.ts` alongside the
  other role pairs.
- The chrome actions book specimen renders a current destination beside a non-current
  one, in both presentations, forcing rest, hover, active and keyboard focus, in Light
  and Dark.
- `apps/design/e2e/navigation-destination.spec.ts` asserts, in both presentations, that
  an anchor with `aria-current` paints `--cn-indicator` on its state surface at rest and
  carries `--cn-on-indicator` as its foreground; that `aria-current="false"` and a
  `button` with `aria-current` paint neither; that hover and active over a current
  destination differ from both the resting current destination and the hovered
  non-current one; and that the target, state surface and bounding box are identical to
  a non-current action's in every state.
- Human review accepts that a current destination is identifiable without pointing at it,
  and remains distinguishable from a hovered or activated neighbour, in both schemes and
  both presentations.

### Regression Guardrails

- Hover and active feedback never replaces the indicator, and the indicator never
  suppresses hover or active feedback.
- `--cn-indicator` remains distinct from `--cn-hover` and `--cn-active` in both schemes.

### Scenarios

The first three belong to `apps/design/e2e/navigation-destination.spec.ts`, the last to
`packages/design-system/test/color-contrast.test.ts`.

```gherkin
Given an anchor chrome action with aria-current, in either presentation
When it renders at rest
Then its state surface carries --cn-indicator
And its Icon and label carry --cn-on-indicator
And its target, state surface and bounding box match a non-current action's
```

```gherkin
Given a current destination and a non-current chrome action side by side
When the pointer rests on each in turn, and each is then activated
Then the current destination's indicator remains visible under both washes
And its foreground remains --cn-on-indicator
And its resting, hovered and active surface paints are three distinct values
And each differs from the non-current action's paint in the same state
```

```gherkin
Given an anchor chrome action with aria-current="false"
And a button chrome action with aria-current
When each renders at rest
Then neither carries the indicator
And the button remains a command
```

```gherkin
Given the indicator role pair
When it is measured in Light and in Dark
Then --cn-on-indicator on --cn-indicator reaches AA
```
