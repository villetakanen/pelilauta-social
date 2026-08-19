---
status: live
---

# CnSnackbar

## Blueprint

### Context

CnSnackbar gives a reader concise feedback on an operation without taking them
away from their current work. Feedback leaves when it has been read; an offered
action remains available until the reader takes it.

### Architecture

`packages/design-system/components/CnSnackbar.svelte` is a Svelte 5 component
with no custom element or Shadow DOM. Its consumer supplies one optional snack
through the `snack` prop and receives dismissal through `onDismiss`. A snack
has a non-empty string `message` and an optional action. An action has a
non-empty string `label` and a synchronous `callback` that returns no value.

The component renders no queue, producer, browser storage, or document event.
`specs/pelilauta/application-feedback/spec.md` governs those application
concerns.

### Documentation

`apps/design/src/content/components/cn-snackbar.mdx`.

### Constraints

- Without a snack, CnSnackbar renders nothing.
- A snack without an action dismisses after five seconds. A snack with an
  action does not dismiss automatically.
- Activating an action prevents further activation, runs its callback, and
  requests dismissal even when that callback throws.
- CnSnackbar requests dismissal after the exit transition. The consumer
  replaces the snack only after the request. A replacement snack receives a new
  display period and exit transition.
- The message announces as a status. An action is a native button bearing its
  supplied label.
- The component is fixed at the lower inline-start corner, inset by
  `--cn-grid`. It uses `--cn-surface-4` and `--cn-text-high`.
- Its private `--_snackbar-z-index` places the component above the
  design-system modal layer.

## Contract

### Definition of Done

- Both applications import CnSnackbar from the local design system package.
- The CnSnackbar component book renders automatic and actionable feedback in
  light and dark.
- Human review accepts the surface and its action in light and dark.

### Regression Guardrails

- A consumer controls which snack is current. CnSnackbar cannot replace it
  with a queued message.
- CnSnackbar does not depend on browser storage, a document event, or an
  application module.
- A snackbar remains above a modal surface.

### Scenarios

```gherkin
Given a CnSnackbar with a snack without an action
When five seconds pass
Then the snack exits
And CnSnackbar requests its dismissal
```

```gherkin
Given a CnSnackbar with an action snack
When five seconds pass
Then the snack remains visible
```

```gherkin
Given a CnSnackbar with an action snack
When the reader activates the action
Then its callback runs once
And CnSnackbar requests dismissal after the exit transition
```

```gherkin
Given a CnSnackbar above an open modal surface
When it renders a snack
Then the snack is visible above the modal
```
