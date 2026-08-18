---
status: live
---

# Design Site Theme

## Blueprint

### Context

The design-site index and every book present the design system in Light and Dark. A
reader's selected mode persists across design-site pages in `localStorage` and
overrides the system preference when script and storage are available. Content that
inherits the document-root scheme does not paint in the other mode. A specimen with
its own `color-scheme` keeps that scheme.

### Architecture

An app-private Astro helper integrates the design-site shell with the
[`CnThemeSwitch` contract](../components/cn-theme-switch/spec.md). The helper listens
for `cn-theme-change`, reads `document.documentElement.style.colorScheme`, and records
the result. Before a page paints, it validates the recorded value and writes it back to
that property.

The helper belongs to `apps/design`. It is not exported by the design-system package
and has no book.

### Constraints

The stored mode reaches the root from a classic blocking inline script in `<head>`.

The helper uses `localStorage`, never a cookie, and accepts only `light` and `dark`. A
missing or invalid value, an unavailable read, or unavailable script leaves
`document.documentElement.style.colorScheme` empty, so the system preference selects
the mode. Read and write failures produce no uncaught error. A failed write does not
undo the current document change and makes no persistence guarantee.

## Contract

### Definition of Done

- The design-site index and every book render `CnThemeSwitch` through the app-private
  helper.
- Activating the switch changes the current document and, when storage is available,
  stores the resulting mode in `localStorage`.
- An emitted-HTML check verifies that every page carries the classic blocking inline
  restoration script inside `<head>`, before `<body>`. It executes the extracted script
  against controlled `localStorage` and document-root state, and observes the root
  change before script evaluation returns.
- A browser check controls `localStorage` and the system preference. It covers missing,
  invalid and opposing values; unavailable reads and writes; activation; navigation;
  blocked hydration bundles; and uncaught console errors.

### Regression Guardrails

- Theme persistence remains local to `apps/design`; `CnThemeSwitch` does not read or
  write storage.
- The design site stays statically rendered: nothing in this capability reads a
  request.
- The stored mode is applied without waiting for component hydration.

### Scenarios

```gherkin
Given `localStorage` contains no valid mode
When a design-site page loads
Then `document.documentElement.style.colorScheme` is empty
And the browser paints its system-preferred mode
```

```gherkin
Given `localStorage` stores light
And the browser prefers Dark
When a design-site page loads
Then `document.documentElement.style.colorScheme` is light before root-inheriting content paints
And a specimen with its own Dark scheme remains Dark
```

```gherkin
Given the design site is painting Light
When the reader activates `CnThemeSwitch`
Then the current document changes to Dark
And `localStorage` stores dark
```

```gherkin
Given the design site is painting Light
And writing `localStorage` fails
When the reader activates `CnThemeSwitch`
Then the current document changes to Dark
And no uncaught error occurs
```

```gherkin
Given `localStorage` stores dark
And reading `localStorage` fails
And the browser prefers Light
When a design-site page loads
Then `document.documentElement.style.colorScheme` is empty
And no uncaught error occurs
```

```gherkin
Given `localStorage` stores dark
When the reader opens another design-site page
Then `document.documentElement.style.colorScheme` is dark before root-inheriting content paints
```
