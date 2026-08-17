---
status: approved
---

# Notification Action

## Blueprint

### Context

A reader is invited to take part: someone answered them, someone wants to join them.

### Architecture

A Svelte 5 component, `packages/design-system/components/CnNotificationAction.svelte`. It
is a chrome action per `specs/design-system/chrome-actions/spec.md`, and a destination
rather than a command.

The consumer states the destination, the glyph, the label and the count. The component
composes the accessible name from the label and the count.

### Documentation

- `apps/design/src/content/components/cn-notification-action.mdx`
- `apps/design/src/content/base/chrome-actions.mdx`

### Constraints

The badge renders a whole number of one or more; anything else renders no badge. Above 9
the badge reads `9+`, and so does the name.

The badge stands at the block-start, inline-end corner of the Icon in both presentations,
and takes no space in the target's flow.

The badge fills `--cn-color-info`, and its characters take a decorative colour of its
own rather than a foreground role. It keeps both in every state the chrome action has,
including the current destination, whose foreground is the action's and not the badge's.
The control stands on `--cn-surface`, and the badge reads as separate from it. The
badge's characters are held to no text contrast ratio.

The badge is decorative, and hidden from assistive technology.

## Contract

### Definition of Done

- The books render the control in both presentations, at a single count and at the
  ceiling, and as the current destination, in Light and Dark.
- Human review accepts that the badge is seen at a glance, and its characters read, in
  both schemes.

### Regression Guardrails

- The badge takes no space in the target's flow.
- The badge's fill and characters survive every state the chrome action has.

### Scenarios

```gherkin
Given a notification action whose consumer states 10
When it renders
Then the badge reads 9+
And the accessible name reads 9+
```

```gherkin
Given a notification action whose consumer states no count, an empty count, or zero
When it renders
Then no badge renders in any of the three cases
```
