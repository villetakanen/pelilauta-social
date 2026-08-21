---
status: live
---

# CnLoader

## Blueprint

### Context

`CnLoader` is the design system's progress indicator. It overlays a spinning dual ring over a static noun icon to communicate asynchronous activity without hiding its domain context.

### Architecture

`CnLoader` is a Svelte 5 component (`CnLoader.svelte`) emitting `<span class="cn-loader">` with a nested `<span class="lds-dual-ring">` and a nested `<CnIcon>`. It does not register a custom element or use Shadow DOM.

A companion global stylesheet (`loader.css`) styles auto-centering layout rules for direct children of `<section>` and `<article>`. A CnCard receives none: its action row carries commands, and a card whose subject is still resolving shows the loader in its content region, which the rule does not reach.

### Constraints

The host element carries `role="status"` and `aria-label` set to the `label` prop, defaulting to `"Loading"`.

The `noun` prop forwards to `CnIcon`, defaulting to `"fox"`. `CnIcon` renders at the same dimensions as the host in both default (72px, `--cn-loader-size`) and inline (24px, `--cn-line`) variants. The icon is decorative: it exposes no role, name or tooltip, so the status region announces only its `label`.

The spinning ring overlay rotates infinitely at 1.2s linear speed, independent of UI duration tokens. When `prefers-reduced-motion: reduce` matches, ring animation resolves to `none`.

The ring uses 0.72 opacity and line width `calc(var(--cn-grid) / 2)`. The center icon uses 0.44 opacity. Ring and icon share the component-private `--_loader-color`, `light-dark(--chroma-primary-60, --chroma-surface-60)`: chroma step 60 of the primary family in Light, and step 60 of the surface family in Dark.

## Contract

### Definition of Done

- `CnLoader.svelte` exports a Svelte 5 component rendering `<span class="cn-loader">` with `role="status"`.
- `inline` prop switches host and nested icon size between `--cn-loader-size` and `--cn-line`.
- Tokens `--cn-loader-size` and `--cn-loader-line-width` are declared on `:root`. The ring and icon colour is component-private (`--_loader-color`), not a public token, and resolves to `light-dark(--chroma-primary-60, --chroma-surface-60)`.
- `loader.css` provides container auto-centering rules for section and article children.
- `prefers-reduced-motion: reduce` stops ring rotation.
- The **CnLoader** Component book renders `CnLoader` in standalone and inline states across Light and Dark.

### Regression Guardrails

- Class `.cn-loader` is preserved on the root element so parent button and container layout selectors match.
- `CnIcon` remains a descendant inside `.cn-loader`.
- `prefers-reduced-motion: reduce` disables ring animation.
- Visual colors depend strictly on the private `--_loader-color` without legacy or hardcoded hex overrides.

### Scenarios

```gherkin
Given a default CnLoader component
When it renders
Then the root element is span.cn-loader with role="status" and aria-label="Loading"
And it contains a nested .lds-dual-ring and a nested .cn-icon with noun="fox"
And the icon exposes nothing to assistive technology
```

```gherkin
Given a CnLoader component with inline=true
When it renders
Then its computed width and height match var(--cn-line)
And the nested icon computed width matches var(--cn-line)
```

```gherkin
Given a CnLoader component rendered under prefers-reduced-motion: reduce
When it is displayed
Then the ring animation resolves to none
And the ring and icon remain visible statically
```

```gherkin
Given a CnLoader placed as a direct child of a section element
When it renders
Then it is horizontally centered with vertical margin var(--cn-line)
```
