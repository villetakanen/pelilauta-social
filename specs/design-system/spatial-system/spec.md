---
status: live
---

# Spatial System

## Blueprint

### Context

The spatial system coordinates spacing, vertical rhythm, radii, and shadow
measurements through one base grid. Components use recurring grid-derived
measurements for related geometry while retaining the values required by their
individual structures.

### Architecture

The grid is the base measurement for proportional spatial decisions. Three named
measurements recur throughout components:

| measurement | derivation | common use |
| :--- | :--- | :--- |
| `--cn-grid` | `0.5rem` | Base increment, compact spacing, and component geometry. |
| `--cn-gap` | `grid × 2` | Standard component and layout gaps, including avatar-to-text spacing and surface inset. |
| `--cn-line` | `grid × 3` | Body line height, minimum row height, and separation between stacked blocks. |

These uses describe recurring patterns rather than an exhaustive mapping between
content relationships and measurements. Components may use other grid multiples
where their geometry requires them.

An avatar beside accompanying identity text uses `--cn-gap` by default. A
component spec may define another grid-derived interval where its composition
requires one.

Radii and elevation-shadow measurements derive from the grid. Surface defines
which background and shadow form an elevation and how nested elevation behaves,
as specified in `specs/design-system/surface/spec.md`.

Icon sizes are independent `rem` values. They form the named exception to
grid-derived component measurements. Breakpoint thresholds are also independent
`rem` values because they describe query conditions rather than distances rendered
on the page.

The [Units and grid](/tokens/units) lexicon publishes the values. The Spatial
System principles book explains how they recur in components and presents
`.surface` as a content container with `--cn-gap` inset. The Surface capability
defines the class and its complete behavior.

### Constraints

Spatial measurements use one of the three named measurements or another multiple
of `--cn-grid`. Equivalent relationships repeated in one composition use the same
interval.

`--cn-line` remains both the prose rhythm and minimum-row-height measurement. Body
text uses one line unit, allowing a control one line unit high to align with
adjacent text.

Radius steps derive from the grid at one-half, one, two, and four grid units. A
rounded content container is a box that applies a radius and directly lays out
textual or interactive children. It includes at least one grid unit of padding. A
consumer that requires a rounded corner without selecting a size uses
the default medium radius token.

Three bands: small, tablet and desktop. Small ends at `38.75rem`, tablet at `64rem` —
the width where a tray fits beside content rather than over it. Each token names the
width where its band ends.

The grid, icon sizes, and breakpoint thresholds use `rem`. The design system does
not set the root text size, so these measurements follow the reader's default.

Page-grid columns and margins, component dimensions, typography, and border box
rules are outside this capability. Each component defines its grid-derived
measurements according to its structure.

## Contract

### Definition of Done

- The Spatial System principles book demonstrates the three recurring
  measurements, grouping, vertical rhythm, radius proportionality, and
  `.surface` padding.
- A source-driven lexicon publishes every unit and radius token.
- Human review accepts the resulting rhythm and proportions at default and enlarged
  browser text sizes.

### Regression Guardrails

- Every spacing and radius measurement defined by this capability is calculated
  from `--cn-grid`, except for the `--cn-grid` reference value itself.
- No design-system stylesheet sets the root text size or expresses a breakpoint in
  pixels.
- The token entry point supplies the grid dependency required by elevation-shadow
  declarations.

### Scenarios

```gherkin
Given a component that presents an avatar beside accompanying identity text
When the component does not define another interval
Then the interval between the avatar and text is `--cn-gap`
```

```gherkin
Given repeated rows for the same item type in one collection
When the rows are composed
Then their minimum row heights and intervals are the same
```

```gherkin
Given body text beside a control one line unit high
When both render on the same row
Then the control block size and body line box each resolve to `--cn-line`
```

```gherkin
Given content inside a rounded content container
When the container renders
Then its padding is at least one grid unit
```

```gherkin
Given a reader who enlarges the browser's default text size
When a spatial unit is evaluated
Then its rem-based measurement scales with that preference
```
