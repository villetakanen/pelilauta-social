---
status: live
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

`.chip`, its `.promoted` variant and `.chip-list` live in
`packages/design-system/styles/chip.css` and reach both applications through the
stylesheet entry point. The chip is a button presentation: it consumes the button
type role that `buttons.css` aliases onto `:root` and rests on the text-button
surface `--cn-color-button-text`.

v20 deferred coloured chips to composition with the button colour modifiers.
`.promoted` replaces that deferral, and names the purpose rather than a button
variant: a chip someone curated, against the free tags beside it. Its surface fades
from the chip surface to the primary ramp at the weight the chip surface carries, so a
promotion is a shift in hue and the foreground stays the on-surface role the plain chip
resolves. The primary step sits one ramp step above the luminance `--cn-color-button`
carries, in both schemes: `--chroma-primary-60` in Light, `--chroma-primary-50` in
Dark, read directly rather than through a semantic role, because the promotion is a
decoration one ramp step removed from the button surface rather than a state
another capability shares.

`.chip-list` is the row wrapper — wrapping flex with `--cn-grid` gap for its
direct children — so a consumer lays out a chip row without app-local layout
atomics.

The class drops Cyan's prefix. `docs/ARCHITECTURE.md` reserves `.cn-{name}` for a
component hook, and a chip is a public class a consumer applies. Cyan's `.cn-chip`
therefore reaches nothing once the rename lands, so every call site moves to `.chip`
with the stylesheet and no import order decides the outcome.

### Documentation

The Chip book, `apps/design/src/content/base/chip.mdx`.

### Constraints

- The class adds no ARIA role and leaves the host's accessibility tree untouched.
  The consumer chooses the element: `<a>` to navigate, `<button>` to act, `<span>`
  to read. A label chip's host stays inert and nests its remove button.
- Only `<a>` and `<button>` hosts answer hover and show the focus ring; every other
  host renders inert.
- A chip never wraps its text; a row of chips wraps through `.chip-list`.
- The chip's gap seats a leading icon or a trailing control without an extra class.
  A nested control keeps its semantics.
- A disabled button chip dims and ignores the pointer; it stays visible and in the
  accessibility tree.
- No rule carries `!important`; the local rules beat Cyan's same-named rules by
  import order alone.

## Contract

### Definition of Done

- Both applications receive `.chip`, `.chip.promoted` and `.chip-list` through the
  design system's stylesheet entry point.
- No source file in either application applies `.cn-chip`.
- The Chip book renders link, read-only, button, disabled, promoted, icon-leading
  and label chips inside a chip list, from the shipped classes.
- Every scenario below runs as a check in `apps/design`.
- Human review accepts the chip surfaces in both themes.

### Regression Guardrails

- `.chip-list` stays layout-only: layout and gap, never typography, colour or
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
Given a chip with the promoted variant beside a base chip
When both render
Then the promoted chip fades from the chip surface to the primary ramp one step above the chip's own luminance, distinct from the base surface, in both themes
And its foreground resolves to the same role as the base chip's
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
