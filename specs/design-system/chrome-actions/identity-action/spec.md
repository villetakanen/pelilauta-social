---
status: approved
---

# Identity Action

## Blueprint

### Context

One control in the chrome serves a reader with a session and a reader without one: it
invites a signed-out reader to sign in, and carries a signed-in reader to their part
of the application.

### Architecture

A Svelte 5 component, `packages/design-system/components/CnIdentityAction.svelte`. It is
a chrome action per `specs/design-system/chrome-actions/spec.md`, and a destination in
both modes.

The consumer governs the session. It states which mode renders, the destination and the
label for that mode, and what the identity mark presents. The component reads no store.

### Documentation

- `apps/design/src/content/components/cn-identity-action.mdx`
- `apps/design/src/content/base/chrome-actions.mdx`

### Constraints

Two modes. Signed out, the glyph is the `login` Icon. Signed in, the pictorial identity
mark of `specs/design-system/identity-mark/spec.md`, at the diameter that stands beside
a single line, displaces that Icon, and the consumer states the nick and the image the
mark presents.

The identity mark keeps its own backdrop and foreground when the action is the current
destination.

## Contract

### Definition of Done

- The books render both modes and the current destination, in both presentations, in
  Light and Dark.
- Human review accepts that the signed-in mode reads as the reader's part of the
  application, and that the current destination reads as current with the mark unchanged.

### Regression Guardrails

- Changing mode changes neither the target, the state surface, nor the element.
- A signed-in reader whose profile carries no nick keeps the signed-in mode.

### Scenarios

```gherkin
Given an identity action whose consumer states the signed-out mode
When it renders
Then it carries the login glyph
And its destination is the one stated for signing in
```

```gherkin
Given an identity action whose consumer states the signed-in mode
When it renders
Then the identity mark stands where the glyph stood
And its destination is the one stated for the reader's part of the application
```
