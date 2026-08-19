---
status: live
---

# CnLightbox

## Blueprint

### Context

A poster shares media as part of a message — a meme, an advertisement, a mood
piece, art — where text alone does not carry what they mean. CnLightbox serves
that poster first: it presents their media inside the message, and opens any
image full screen so their audience can view a piece closely. A caption serves
accessibility first and attribution second.

### Architecture

CnLightbox is a server-renderable Svelte component. The inline gallery is complete
in the initial server response; the full-screen view is a native dialog opened as a
modal on the client. Escape dismissal, focus containment, focus return and
top-layer stacking come from the platform dialog, and the component adds none of
them itself.

The public inputs are:

| Input | Type | Contract |
| :--- | :--- | :--- |
| `images` | `{ src: string; caption: string }[]` | The images in presentation order. A caption is the image's alt text and its visible caption; the component never separates the two. |
| `openLabel` | `string` | Required localised accessible name for an image control whose caption is empty. |
| `closeLabel` | `string` | Required localised accessible name CnLightbox gives the back action that exits the dialog. |

### Documentation

The CnLightbox Component book,
`apps/design/src/content/components/cn-lightbox.mdx`.

### Constraints

- An empty `images` renders nothing.
- One image renders as one 16:9 figure with its caption below the image. Several
  render as a 16:9 strip of square thumbnails in supplied order, each caption
  overlaid on its thumbnail's block-end edge, overflowing on the inline axis
  through the platform's scrolling.
- Every image is one focusable native control, and its caption is not another
  focus stop. Activating an image opens the full-screen view of that image.
- The inline presentations crop an image to fill its figure; the full-screen view
  shows the image whole.
- A caption truncates to one line in every position. An empty caption renders no
  caption element, and the image control takes its accessible name from
  `openLabel` instead; live data carries empty captions, so the empty case is a
  supported state, not consumer error.
- The gallery takes the raised surface and the on-surface foreground. The
  full-screen view is a dialog, and takes elevation 4
  (`specs/design-system/surface/spec.md`).
- The overlaid thumbnail caption sits on a scrim private to CnLightbox that keeps
  it readable over any image in both schemes. Nothing else in the component stands
  on artwork.
- The dialog composes the back action
  (`specs/design-system/chrome-actions/back-action/spec.md`), named by
  `closeLabel`; CnLightbox closes the dialog when it dispatches `cn-back`.
  Clicking the dialog's backdrop also closes it.
- Images load lazily.
- A fade at the strip's trailing edge signals off-screen thumbnails; it changes no
  measurement and intercepts nothing.

## Contract

### Definition of Done

- Both applications can import and server-render CnLightbox from the local design
  system package.
- The Component book documents the public inputs and renders empty, single,
  multiple and open-dialog states in Light and Dark.
- Every scenario below runs as a deterministic check in `apps/design`.
- Human review accepts the gallery and the full-screen view in Light and Dark.

### Regression Guardrails

- The initial server response contains the complete inline gallery.
- The full-screen view is a native dialog opened as a modal; an element carrying a
  dialog role is not equivalent.
- No script drives the strip's scrolling: vertical scrolling over the strip keeps
  moving the page.
- Closing the dialog, by any means, returns focus to the control that opened it.

### Scenarios

```gherkin
Given a CnLightbox with no images
When it renders
Then it renders nothing
```

```gherkin
Given a CnLightbox with one image
When its initial server response renders without client-side JavaScript
Then one 16:9 figure presents the image
And the caption is visible below the image and is the image's alt text
```

```gherkin
Given a CnLightbox with three images
When its initial server response renders without client-side JavaScript
Then a strip presents three square thumbnails in supplied order
And each caption is overlaid on its thumbnail and is its image's alt text
```

```gherkin
Given a strip whose thumbnails overflow its width
When the reader scrolls it on the inline axis
Then the off-screen thumbnails come into view
```

```gherkin
Given a rendered CnLightbox
When the reader activates an image with the pointer
Then a modal dialog opens showing that image whole with its caption as alt text
```

```gherkin
Given keyboard focus on an image control
When the reader presses Enter
Then the modal dialog opens showing that image
```

```gherkin
Given the open dialog
When the reader presses Escape
Then the dialog closes
And focus returns to the control that opened it
```

```gherkin
Given the open dialog
When the reader activates the back action named by closeLabel
Then the dialog closes
And focus returns to the control that opened it
```

```gherkin
Given the open dialog
When the reader clicks the dialog's backdrop
Then the dialog closes
And focus returns to the control that opened it
```

```gherkin
Given a CnLightbox with an image whose caption is empty
When it renders
Then no caption element renders for that image
And its image control's accessible name is openLabel
```
