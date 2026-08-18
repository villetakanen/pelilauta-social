---
status: live
---

# Application Feedback

## Blueprint

### Context

An operation can finish on the current document or redirect to another one.
Pelilauta reports either result once, after the snackbar host can present it.

### Architecture

The client feedback module is the sole producer contract. A snack is either a
locale key with optional substitutions, or a record with a non-empty `message`
string and an optional action. The module resolves a locale key before retaining
the snack in a first-in, first-out queue. Each Pelilauta layout mounts one
`SnackbarHost`, which subscribes to that queue and renders its current value
with CnSnackbar.

The host is a sibling of CnAppChrome. CnAppChrome establishes a stacking
context for persistent chrome; the sibling host can render above the modal layer
that `specs/design-system/components/cn-snackbar/spec.md` requires.

`pushSessionSnack` accepts a locale key with optional substitutions or a
message record. It resolves a locale key before writing one replaceable session
hand-off before navigation. The host reads the hand-off after mounting in the
destination document, adds it to the same queue, and removes the stored record.
The session value carries no action, because an action callback exists only in
the document that created it.

### Documentation

(implicit)

### Constraints

- Every immediate producer calls `pushSnack`. No application surface sends a
  browser event to the host or reaches its queue directly.
- A message reported before SnackbarHost subscribes stays queued until the host
  presents it.
- A current snack remains current until CnSnackbar reports its dismissal. The
  host then advances to the next queued snack.
- A session snack contains only message text. `pushSessionSnack` rejects an
  action snack rather than serialising it without its callback.
- A valid stored snack is an object with a non-empty string message and no
  action. Any other stored value is invalid.
- A later `pushSessionSnack` before navigation replaces the stored hand-off.
- The destination host removes a valid stored snack only after it has added the
  snack to its queue. It removes an invalid stored value without rendering it.
- Each Pelilauta layout mounts one SnackbarHost.

## Contract

### Definition of Done

- Every Pelilauta layout has one SnackbarHost outside CnAppChrome.
- Any application surface reports immediate feedback through one producer
  contract.
- A message reported before host readiness appears after the host mounts.
- Message-only feedback reported before a navigation appears once in its
  destination document.

### Regression Guardrails

- The feedback queue remains application state; CnSnackbar receives one current
  snack and does not observe a browser-global producer.
- A snackbar does not become a child of CnAppChrome.
- A session snack cannot offer an action that has no callback in the destination
  document.

### Scenarios

```gherkin
Given a producer reports immediate feedback before SnackbarHost has mounted
When SnackbarHost mounts
Then it presents that feedback
```

```gherkin
Given SnackbarHost presents one snack and the queue contains another
When CnSnackbar requests dismissal
Then SnackbarHost presents the next snack after the exit transition
And the next snack receives its full display period
```

```gherkin
Given a producer reports message-only feedback before navigation
When the destination document mounts SnackbarHost
Then the host presents the message once
And removes its stored value
```

```gherkin
Given stored feedback that does not contain a valid message-only snack
When SnackbarHost mounts
Then it removes the stored value
And presents no feedback from it
```

```gherkin
Given a session hand-off already stored before navigation
When a producer calls pushSessionSnack again
Then the later message replaces the stored hand-off
```
