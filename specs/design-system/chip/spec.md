---
status: approved
---

# Chip

## Blueprint

### Context

Chip is the compact pill for tags and labels: a link chip routes to a tag page, a
read-only chip names a tag or a status, a button chip acts, and a label chip carries
its remove control. It is a utility class on the consumer's native element, not a
component, so when presentation and semantics compete, the element wins: the class
announces nothing.

### Architecture

`.cn-chip`, its `.secondary` variant and `.cn-chip-list` live in
`packages/design-system/styles/chip.css` and reach both applications through the
stylesheet entry point. The chip is a button presentation: it consumes the button
type role that `buttons.css` aliases onto `:root` and rests on the text-button
surface `--cn-button-text`.

v20 deferred coloured chips to composition with the button colour modifiers.
`.secondary` is that composition: it paints the secondary button surface with the
on-button foreground, the pairing the button's `.secondary` already makes, and the
labelled-tag surfaces use it to tell a curated label from a free tag.

`.cn-chip-list` is the row wrapper — wrapping flex with `--cn-grid` gap for its
direct children — so a consumer lays out a chip row without app-local layout
atomics.

`.cn-chip` keeps Cyan's class name. Every call site receives the local chip the
moment the stylesheet ships; until Cyan's stylesheet leaves, the import order in
`docs/MIGRATION.md` decides which rules win.

### Documentation

The Chip book, `apps/design/src/content/base/chip.mdx`.

### Constraints

- The class adds no ARIA role and leaves the host's accessibility tree untouched.
  The consumer chooses the element: `<a>` to navigate, `<button>` to act, `<span>`
  to read. A label chip's host stays inert and nests its remove button.
- Only `<a>` and `<button>` hosts answer hover and show the focus ring; every other
  host renders inert.
- A chip never wraps its text; a row of chips wraps through `.cn-chip-list`.
- The chip's gap seats a leading icon or a trailing control without an extra class.
  A nested control keeps its semantics.
- A disabled button chip dims and ignores the pointer; it stays visible and in the
  accessibility tree.
- No rule carries `!important`; the local rules beat Cyan's same-named rules by
  import order alone.

## Contract

### Definition of Done

- Both applications receive `.cn-chip`, `.cn-chip.secondary` and `.cn-chip-list`
  through the design system's stylesheet entry point.
- The Chip book renders link, read-only, button, disabled, secondary, icon-leading
  and label chips inside a chip list, from the shipped classes.
- Every scenario below runs as a check in `apps/design`.
- Human review accepts the chip surfaces in both themes.

### Regression Guardrails

- `.cn-chip-list` stays layout-only: layout and gap, never typography, colour or
  padding.
- The chip acquires no role, tabindex or pointer behaviour beyond the host
  element's.
- Keyboard focus stays visible on interactive chips.
- The disabled state dims; a change that removes the chip from view or from the
  accessibility tree regresses it.

### Scenarios

```gherkin
Given an anchor with the chip class
When it renders
Then it is a full pill on the text-button surface
And it shows the pointer cursor without an underline
```

```gherkin
Given a span with the chip class
When the pointer hovers it
Then its background does not change
```

```gherkin
Given a chip with the secondary variant beside a base chip
When both render
Then the secondary chip paints the secondary button surface, distinct from the base surface, in both themes
And its foreground resolves to the on-button role
```

```gherkin
Given a label chip nesting a remove button
When the remove button is activated
Then the removal fires
And the chip host itself answers no hover, focus or activation
```

```gherkin
Given a disabled button chip
When it is clicked
Then no activation occurs
And the chip remains visible and dimmed
```

```gherkin
Given a chip list wider than its container
When it renders
Then the chips wrap into rows with --cn-grid of gap
And each chip keeps its intrinsic pill shape
```

```gherkin
Given an interactive chip reached with the keyboard
When it takes focus
Then the focus ring outlines it
```

```gherkin
Given prefers-reduced-motion: reduce
When a chip changes state
Then the change lands without a transition
```
