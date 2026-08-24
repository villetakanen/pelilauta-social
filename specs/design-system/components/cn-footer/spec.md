---
status: live
---

# CnFooter

## Blueprint

### Context

The footer serves three parties. A reader who scrolls past the end of a view has
finished its content, and the footer gives that position somewhere to go instead of an
empty stop. The community partners around Pelilauta get a standing place where the
platform points readers toward them. Pelilauta itself gets the home of its periphery —
identity, metadata and attribution that must never compete with the content above —
and a statement that it stands inside the wider Finnish role-playing ecosystem.

CnFooter divides this content into three tracks, one per role: what is active on the
platform now, where else the community gathers, and what the platform is. The
responsive arrangements balance the tracks geometrically; no track outranks another,
and no arrangement assigns meaning to a track's position.

### Architecture

An Astro component, `packages/design-system/components/CnFooter.astro`, rendering a
`contentinfo` landmark bearing `.cn-footer`. The root element carries an explicit
`role="contentinfo"`: nested inside `<main>`, where a mounting layout may place it, a
bare `<footer>` resolves no landmark at all. Its layout and presentation require no
client-side script.

The component establishes an inline-size container named `cn-footer` on its root
element, and lays the three sequential regions out on an inner wrapper: an element
cannot resolve a container query against the container it itself establishes, so the
responsive arrangement answers from that wrapper rather than the root. It queries the
container's inline size to switch between three responsive arrangements:

1. **Wide (>= 58.5rem / 117 grid units):** All three regions stand side by side in
   equal-width tracks on a single row along the inline axis.
2. **Intermediate (>= 38.0rem and < 58.5rem / 76 to < 117 grid units):** The first two
   regions stand side by side in equal-width tracks on the first row, and the third region
   stands centered on the inline axis of the second row beneath them.
3. **Stacked (< 38.0rem / < 76 grid units):** All three regions stack in one column in
   source order along the block axis.

The component accepts content via three named slots: `block-1`, `block-2`, and
`block-3`. An omitted or empty slot collapses and reserves no track space.

### Documentation

The **CnFooter** Component book in `apps/design/src/content/components/cn-footer.mdx`
carries this capability.

### Constraints

The wide threshold resolves at `58.5rem` (117 grid units).

The intermediate threshold resolves at `38.0rem` (76 grid units).

Tracks along the inline axis are separated by `--cn-gap`. Rows along the block axis are
separated by `--cn-line`.

Regions do not stretch to the height of their neighbours.

Content within each region container aligns to the start of the inline axis by default.
In the intermediate arrangement, the third region track itself is centered along the
inline axis of the second row.

## Contract

### Definition of Done

- A **CnFooter** Component book in `apps/design` renders default specimens in Light and
  Dark modes.
- A browser check asserts:
  - Three equal-width tracks on a single row when container inline size is >= `58.5rem`.
  - Two equal-width tracks on the first row and a centered third region on the second row
    when container inline size is >= `38.0rem` and < `58.5rem`.
  - A single column in source order when container inline size is < `38.0rem`.
  - The rendered root element is a `<footer>` element with `contentinfo` semantics and
    `.cn-footer` class hook.
  - The component renders without client-side script.
- Human review accepts that the footer balances across all three breakpoint stages.

### Regression Guardrails

- The footer layout queries its container inline size; it never queries window or
  viewport dimensions directly.
- The footer requires no client-side script for layout or responsive mode switching.
- Region tracks in wide mode remain equal in width regardless of differing content
  lengths.

### Scenarios

```gherkin
Given a CnFooter in a container with inline size >= 58.5rem
When it renders
Then all three regions display side by side in equal-width tracks on one row
```

```gherkin
Given a CnFooter in a container with inline size >= 38.0rem and < 58.5rem
When it renders
Then the first and second regions display side by side in equal-width tracks on the first row
And the third region displays centered on the row beneath them
```

```gherkin
Given a CnFooter in a container with inline size < 38.0rem
When it renders
Then all three regions stack in source order along the block axis
And adjacent regions are separated by --cn-line
```
