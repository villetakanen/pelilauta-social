---
status: draft
---

# CnSnackbar

## Blueprint

### Context

`CnSnackbar` gives a reader brief feedback after an application operation. The
feedback is transient, but it remains available until the reader can act on it
or its display period ends.

### Architecture

`packages/design-system/components/CnSnackbar.svelte` is a Svelte 5 component
with no custom element or Shadow DOM. It receives `cn-snackbar-add` events on
the document. An event detail is a message string and an optional action label
and callback. The component keeps accepted messages in first-in, first-out
order and renders one at a time.

`apps/pelilauta/src/utils/client/snackUtils.ts` is the application producer
contract. `pushSnack` resolves a locale key when given one and raises the
event. `pushSessionSnack` stores the same resolved message in session storage.
The one snackbar host in a layout raises its stored message after navigation
and removes it from storage. A malformed stored value is removed without
rendering feedback.

`BaseTail.astro` mounts the host on layouts that take the base tail.
`Snackbar.astro` mounts the same host where the editor layout does not.

### Documentation

- `apps/design/src/content/components/cn-snackbar.mdx`
- `apps/design/src/content/tokens/units.mdx`

### Constraints

- A message has required text and may have one action with a label and callback.
  The snackbar supplies no severity, icon, or presentation variant.
- A message without an action is visible for five seconds. Its removal follows
  the exit transition before the next queued message appears.
- A message with an action remains until the reader activates its native button.
  Activation calls the callback once and dismisses that message before continuing
  with the queue.
- The snackbar is fixed at the lower inline-start corner, inset by `--cn-grid`.
  It appears above every design-system layer through `--cn-z-snackbar`.
- The snackbar uses the secondary surface and its foreground in both colour
  schemes. Its action uses the design system button treatment.
- Visible feedback announces as a status. The action retains its native button
  semantics and label.

## Contract

### Definition of Done

- Both applications can import and mount CnSnackbar from the local design
  system package without a Cyan snackbar element.
- The CnSnackbar Component book renders an automatic message and an actionable
  message in Light and Dark.
- The Units and grid book lists `--cn-z-snackbar`.
- Checks in `apps/design` cover the message queue, automatic dismissal, action
  activation, status announcement, and layer placement.
- Human review accepts the feedback surface in Light and Dark.

### Regression Guardrails

- Every immediate feedback producer uses `pushSnack`; no surface dispatches
  the snackbar event directly.
- Feedback that crosses navigation uses `pushSessionSnack` and renders once on
  the destination page.
- A later message cannot replace the message currently presented.
- The snackbar remains above dialogs, modal surfaces, and other design-system
  layers.

### Scenarios

```gherkin
Given a layout that mounts CnSnackbar
When a producer calls pushSnack with a localised message
Then the message appears in the snackbar
And it is announced as status
```

```gherkin
Given a snackbar presenting a message without an action
When five seconds pass
Then the message leaves after its exit transition
```

```gherkin
Given a snackbar presenting a message with an action
When five seconds pass
Then the message remains visible

Given that actionable message
When the reader activates its action
Then its callback runs once
And the message leaves after its exit transition
```

```gherkin
Given a snackbar presenting one message and a producer adds another
When the first message leaves
Then the second message appears
```

```gherkin
Given a producer calls pushSessionSnack before navigation
When the destination layout mounts its snackbar host
Then the stored message appears once
And its stored value is removed
```
