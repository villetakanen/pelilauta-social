---
status: proposed
---

# Sortable List

## Blueprint

### Context

Authors arranging ordered sets, such as table-of-contents pages or categories, rearrange visible named content blocks directly.

### Architecture

`packages/design-system/components/CnSortableList.svelte` exports `CnSortableList`, `CnListItem`, and `CnSortableListAnnouncements`.

| Input | Type | Requirement |
| :--- | :--- | :--- |
| `items` | `readonly CnListItem[]` | `items` supplies the rendered item order. |
| `label` | `string` | `label` supplies the required localized accessible name for the list. |
| `onitemschange` | `(items: CnListItem[]) => void` | `onitemschange` receives each completed item reorder. |
| `announcements` | `CnSortableListAnnouncements` | `announcements` supplies required localized status announcement functions. |

`CnListItem` defines a stable `key` string, a non-empty `title` string, and optional `content` and `actions` Svelte `Snippet` properties. Each key is unique within the `items` array. The title names the item and the drag handle. The content snippet renders in the content region. When `content` is absent, the title renders in the content region. The actions snippet renders in the actions region.

`CnSortableListAnnouncements` requires `pickup`, `position`, `completion`, and `cancellation` functions. Each function receives the item title, one-based position, and list length, and returns the localized announcement message. The `completion` message describes the completed input operation rather than consumer acceptance of the reported order. A successful drop passes the newly ordered array to `onitemschange`. The component resets to the supplied `items` order. The consumer accepts the reorder by supplying the updated `items` array.

The component renders a native unordered list with `role="list"` and `aria-label={label}`. Each item renders as a list item containing a drag handle, a content region, and an optional actions region in sequence. The drag handle renders as a native `button` with `type="button"` using the item title as its accessible name. The handle contains the `dragger` icon as a decorative element governed by `specs/design-system/components/cn-icon/spec.md`. A visually hidden `role="status"` region occupies no layout space and receives each message returned by `announcements`.

The drag handle defines a distinct action presentation and does not compose the button presentation from `specs/design-system/actions/spec.md`.

Sortable List supports pointer, touch, and keyboard reordering across all consumer surfaces. A consumer migration never narrows this component contract.

### Documentation

- `apps/design/src/content/components/cn-sortable-list.mdx`

### Constraints

A list may be empty.

Reordering starts from the drag handle alone. Content selection and action activation remain operable without starting a reorder.

The drag handle sets `draggable="true"`. The `dragstart` event sets the row as the drag image. Moving over a row shows the insertion position: the block-start half targets before the row, and the block-end half targets after it. Rows retain their positions throughout the drag while a line marks the landing position. A drop reports the new order through `onitemschange`. Dropping an item on itself or ending a drag outside an item reports no change, and a `dragend` event without a drop reports nothing.

Because the platform drag-and-drop API serves neither touch nor keyboard interaction, the component provides a single-pointer path for WCAG 2.2 SC 2.5.7 Dragging Movements and a keyboard path for SC 2.1.1 Keyboard. Both paths share the same interaction model. Activating the drag handle picks the item up, and activating the handle again drops the item at its current position. While an item is picked up, activating any row places the item at the target row position. Pressing Escape restores the supplied order and ends the operation. The keyboard interface uses ArrowUp and ArrowDown to move a picked item by one position. ArrowLeft and ArrowRight leave a picked item in place. Pressing an arrow key at a list boundary leaves the item in place. Picking up an item renders the provisional order, and each subsequent movement updates that order. Every interaction path places an item in the same position.

The drag handle receives keyboard focus, and Space or Enter activates the handle. Focus remains on the drag handle throughout the reorder operation. Every operation announces pickup, position updates, completion, and cancellation through the status region using the supplied localized announcement functions. After a completed operation, focus remains on the drag handle when the subsequent `items` array retains the item key. When the subsequent `items` array omits the key, the rendered order determines focus placement. While an item is picked up, the handle `aria-describedby` attribute references the status region to expose the current position to assistive technology.

Sortable List does not move an item between lists.

Rows inherit surrounding typography and use `--cn-color-on-surface` as foreground. `specs/design-system/spatial-system/spec.md` governs row spacing. Each row after the first renders a one-pixel `--cn-color-border` line on its block-start edge. The list renders no other border. `docs/ARCHITECTURE.md` governs hover and active states. The hover state paints `--cn-color-hover` over the row background. Active interaction paints `--cn-color-active` over the row background. The `:focus-visible` state on the drag handle outlines with `--cn-color-focus-ring`. Interaction states do not move or resize a row. The list defines no marker, inset, or outer surface.

The drag affordance uses the `dragger` noun governed by `specs/design-system/iconography/spec.md`. The drag handle inherits the row foreground and displays a grab cursor. The platform draws the cursor for the duration of a drag.

The default content is the text title. Arbitrary content renders within the content region when a title alone cannot identify the item. Arbitrary content does not replace the required title.

## Contract

### Definition of Done

- A consumer renders a Sortable List using the exported component, item type, and localized announcement functions.
- The Sortable List book renders an empty list and lists of two and three items in both color schemes, demonstrating title fallbacks, arbitrary content, actions, and resting, hover, active, and keyboard-focus feedback.
- The Sortable List book demonstrates dragging, single-pointer, and keyboard reordering, including midpoint placement, the insertion line, and cancellation.
- A reader moves any item by dragging, by single-pointer activation, or from the keyboard, and the consumer receives the resulting order, verified by `packages/design-system/test/cn-sortable-list.test.ts`, run by `pnpm --filter @pelilauta/design-system test`, which gains a jsdom environment to exercise drag, activation, and keyboard interaction.
- Human review of the book at `apps/design/src/content/components/cn-sortable-list.mdx` accepts the row hierarchy, drag affordance, and interaction feedback in both color schemes.

### Regression Guardrails

- Reordering never changes an item key, title, content snippet, actions snippet, or item count.
- A completed move changes an item position by one or more positions.
- Every other operation preserves the existing order and never calls `onitemschange`.
- The component does not persist an order or mutate the supplied `items` array.
- A consumer migration never removes an input method supported by the component.
- Content selection and actions remain operable without starting a reorder.
- Hover and active feedback never change row geometry or make the drag affordance depend on color alone.

### Scenarios

```gherkin
Given a Sortable List with items A, B and C
When the reader drags the handle of item C onto the block-start half of row A
Then onitemschange receives C, A and B in that order
And each item retains its original key and title
```

```gherkin
Given a Sortable List with items A, B and C
When the reader drags the handle of item B onto the block-end half of row C
Then onitemschange receives A, C and B in that order
```

```gherkin
Given a Sortable List with items A, B and C
When the reader drags the handle of item B onto row B or ends the drag outside an item
Then onitemschange is not called
And the rendered order remains A, B and C
```

```gherkin
Given keyboard focus on the drag handle of item B in a Sortable List with items A, B and C
When the reader presses Space, ArrowUp and Space
Then onitemschange receives B, A and C in that order
And the component announces pickup, new position and completion for item B
```

```gherkin
Given keyboard focus on the drag handle of item B in a Sortable List with items A, B and C
When the reader presses Space and ArrowUp
Then the rendered provisional order is B, A and C
And onitemschange is not called
```

```gherkin
Given keyboard focus on the drag handle of item B in a Sortable List with items A, B and C
When the reader presses Enter, ArrowDown and Escape
Then onitemschange is not called
And the rendered order remains A, B and C
And the component announces cancellation
```

```gherkin
Given keyboard focus on the picked-up drag handle of item A in a Sortable List with items A, B and C
When the reader presses ArrowUp
Then the rendered order remains A, B and C
And the component announces the unchanged position of item A
And focus remains on the drag handle of item A
```

```gherkin
Given a Sortable List with items A, B and C
When the reader activates the drag handle of item C and then activates row A
Then onitemschange receives C, A and B in that order
And the component announces pickup, new position and completion for item C
```

```gherkin
Given a Sortable List with items A, B and C and item C picked up by activation
When the reader activates the drag handle of item C again
Then onitemschange is not called
And the rendered order remains A, B and C
```

```gherkin
Given an empty Sortable List
When it renders
Then it contains an empty unordered list with role="list" and no marker or inset
```

```gherkin
Given a Sortable List row
When the pointer rests on it or the reader holds it for a drag
Then the row shows its applicable interaction feedback
And its dimensions remain unchanged
```

```gherkin
Given a Sortable List row at rest
When a pointer rests on it
Then --cn-color-hover paints over the row background
And its dimensions remain unchanged
```

```gherkin
Given a Sortable List row
When the reader holds its drag handle
Then --cn-color-active paints over the row background
And its dimensions remain unchanged
```

```gherkin
Given a Sortable List item titled "Page" with a content Snippet and an actions Snippet
When it renders
Then the drag handle appears before the supplied content
And the supplied actions appear after the content
And the title does not render in the content region
```

```gherkin
Given a Sortable List item titled "Page" with no content Snippet
When it renders
Then the title renders in the content region
```

```gherkin
Given a Sortable List row with selectable content
When the reader selects its content
Then no reorder begins
```

```gherkin
Given a Sortable List row with an action
When the reader activates its action
Then no reorder begins
```

```gherkin
Given a Sortable List row titled "Page"
When it renders
Then its drag handle is a native button with type="button"
And the drag handle has the accessible name "Page"
```

```gherkin
Given a Sortable List operation that returns an announcement message
When pickup, a position change, completion or cancellation occurs
Then the message appears in the component role="status" region
```

```gherkin
Given a picked-up Sortable List item
When its handle retains focus
Then aria-describedby on the handle references the status region
And the description states the current position of the item
```

```gherkin
Given keyboard focus on a Sortable List drag handle
When it renders
Then a visible focus ring using --cn-color-focus-ring outlines the handle
```

```gherkin
Given a Sortable List with items A, B and C
When the reader drags the handle of item C over the block-start half of row A
Then a line marks the insertion position before row A
And the rendered order remains A, B and C
```

```gherkin
Given a consumer that does not return the order received by onitemschange
When a reader completes a reorder
Then the component returns to the supplied items order
```
