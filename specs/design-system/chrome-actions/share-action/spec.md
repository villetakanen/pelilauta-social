---
status: live
---

# Share Action

## Blueprint

### Context

A reader passes on the page they are reading.

### Architecture

A Svelte 5 component, `packages/design-system/components/CnShareAction.svelte`. It is a
command, and never a destination.

### Constraints

The action shares one page: a URL, a title and a description. An unstated URL or title is
the document's; an unstated description is not shared.

Activation calls the Web Share API, and writes the URL to the clipboard where the browser
has none.

Once that call settles it dispatches `cn-share`, which bubbles and carries its outcome as
`detail.outcome`: `shared`, `copied` or `failed`. A reader dismissing the browser's
sheet — the API's `AbortError` — is none of the three and dispatches nothing. Every other
refusal, of a share or of a clipboard write, is `failed`.

The control displays nothing of its own; a consumer raises any confirmation.

The glyph is the `share` Icon.

`label` has no default.

## Contract

### Definition of Done

- The chrome actions book renders the control, in Light and Dark, beside a specimen that
  shows each activation's `cn-share` event.
- A browser check controls whether the Web Share API is present, and asserts the URL,
  title and description the action passes it; that a browser without one leaves the URL
  on the clipboard; that each outcome dispatches its own value and reaches a listener
  above the control; and that a dismissal dispatches nothing.
- Human review accepts that the control reads as passing the page on.

### Regression Guardrails

- Nothing is dispatched before the call settles.
- One activation dispatches at most one event.
- The control renders the same whether or not the browser shares natively.

### Scenarios

```gherkin
Given a share action on a browser with the Web Share API
When the reader activates it
Then the page's URL, title and description reach that API
And cn-share reports shared
```

```gherkin
Given a share action on a browser without the Web Share API
When the reader activates it
Then the page's URL is on the clipboard
And cn-share reports copied
```

```gherkin
Given a share action whose reader dismisses the browser's sheet
When the sheet closes
Then nothing is dispatched
```

```gherkin
Given a share action whose consumer states no URL and no title
When the reader activates it
Then the document's URL and title are shared
```
