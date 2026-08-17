---
status: approved
---

# CnMenu

## Blueprint

### Context

`CnMenu` holds a surface's secondary commands on a temporary surface behind
Material's more-options trigger, so a toolbar shows its primary actions and
nothing else. The model is Material 3's menu, stripped to its container and its
items: no dividers, submenus, selection states or trailing elements. The reply
toolbar is the first consumer: fork, edit and delete live in its menu. The items
stay the consumer's native elements, so when presentation and semantics compete,
the element wins.

### Architecture

`CnMenu.svelte` is a Svelte 5 component with no custom element or Shadow DOM,
hooked as `.cn-menu`. It renders an icon-only text button and a container that
carries the consumer's items.

The container is a native popover and the trigger is its invoker. Light
dismissal, the Escape key, focus return and the trigger's expanded state come
from the platform; the component adds no document click listener. The container
composes the floating surface that `specs/design-system/surface/spec.md`
defines.

Despite the name, the component announces as a disclosure, not an ARIA menu: the
trigger carries the expanded state and the items keep their element semantics. A
menu role would bind the items to the APG menu keyboard pattern, which the
native elements already serve with Tab. Opening moves no focus: it stays on the
trigger, and Tab enters the items.

An item is an `<a>` or `<button>` the consumer authors, one command each. The
component lays the items out as rows and styles them; it does not receive them
as data.

### Documentation

The CnMenu Component book, `apps/design/src/content/components/cn-menu.mdx`.

### Constraints

- The trigger is the text icon button `specs/design-system/actions/spec.md`
  defines: the `kebab` noun by default, the `dots` noun with the `inline` prop.
  Its accessible name comes from the `label` prop, defaulting to
  `"More options"`.
- An item row seats a leading icon and a label with the hover wash; activating
  an item performs it and closes the menu.
- The container aligns to the trigger and opens toward the viewport centre on
  both axes, so it stays fully in view wherever the trigger sits.
- The open container renders in the top layer, above every sibling surface; the
  stacking comes from the popover, not from the surface role it composes.

## Contract

### Definition of Done

- Both applications receive `CnMenu` from the design system's components.
- The Component book renders the default and inline triggers with a live
  container of link and button items in both themes.
- Every scenario below runs as a check in `apps/design`.
- Human review accepts the trigger and the container surface in both themes.

### Regression Guardrails

- The items keep their element semantics; the component adds no role, tabindex
  or pointer behaviour to them.
- Closing the menu from the keyboard returns focus to the trigger.
- The trigger stays the system text icon button; a bespoke trigger surface
  drifts from the buttons it must match.
- The trigger's expanded state stays exposed to assistive technology.

### Scenarios

```gherkin
Given a closed menu
When the trigger is activated
Then the container opens aligned to the trigger, floating above the surrounding content
And the trigger reports itself expanded
```

```gherkin
Given an open menu
When the pointer presses outside the container
Then the menu closes
```

```gherkin
Given an open menu with focus inside it
When Escape is pressed
Then the menu closes
And focus returns to the trigger
```

```gherkin
Given an open menu
When an item is activated
Then the item's command or navigation fires
And the menu closes
```

```gherkin
Given an open menu
When the keyboard moves through it
Then every item is reachable
```

```gherkin
Given a trigger near the right edge of the viewport
When the container opens
Then the container remains fully within the viewport
```

```gherkin
Given a trigger near the bottom edge of the viewport
When the container opens
Then the container remains fully within the viewport
```
