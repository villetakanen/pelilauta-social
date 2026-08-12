---
status: draft
---

# CnThemeSwitch

## Blueprint

### Context

The Pelilauta Design system supports light and dark themes. An editor needs to see how
their content looks for users on either theme. The same functionality gives the user an
app-specific override for the system default theme.

`CnThemeSwitch` lets the user switch the document's theme, and dispatches an event for a
consuming application to persist it. The theme is on the document root; the event says
it changed.

### Architecture

A Svelte 5 component. Chrome mounts it inside its Svelte components, so it cannot be an
Astro component.

### Constraints

The theme is a `color-scheme` property on the document root. On `body`, browser chrome
keeps the operating-system scheme and a seam appears; as a class, the switch would
depend on a stylesheet the design system does not publish.

An activation carries a micro-interaction in the theme it lands in.

## Contract

### Definition of Done

A **CnThemeSwitch** Component book renders the control, and a browser check exercises
one activation.

### Regression Guardrails

(implicit)

### Scenarios

```gherkin
Given the document root carries no color-scheme
When the reader activates the switch
Then the root's color-scheme becomes the opposite of the theme the document paints
And a cn-theme-change event is dispatched
```

```gherkin
Given the document root carries a color-scheme
When the reader activates the switch
Then the root's color-scheme becomes its opposite
And a cn-theme-change event is dispatched
```
