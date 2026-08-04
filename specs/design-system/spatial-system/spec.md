---
status: approved
---

# Spatial System

## Blueprint

### Context

The spatial system coordinates spacing, vertical rhythm, radii, and shadow
measurements through one base grid. A spatial role is selected by the relationship
between elements, allowing unrelated components to align without sharing layout
code.

### Architecture

The grid is the base measurement for proportional spatial decisions. Three roles
apply it to recurring relationships:

| role | relationship |
| :--- | :--- |
| `--cn-grid` | Space inside a component, including control padding and the distance from an icon to its label. |
| `--cn-gap` | Space between elements that form one group, including fields in a form and cards in a listing. |
| `--cn-line` | Prose rhythm, space between stacked blocks, and row height. |

Radii and elevation-shadow measurements derive from the grid. Surface owns which
background and shadow form an elevation and how nested elevation behaves, as
defined by `specs/design-system/surface/spec.md`.

Icon sizes are independent `rem` values. They form the named exception to
grid-derived component measurements. Breakpoint thresholds are also independent
`rem` values because they describe query conditions rather than distances rendered
on the page.

The [Units and grid](/tokens/units) lexicon publishes the values. The Spatial
System principles book explains their selection and presents `.surface` as a
content container whose inset uses the `--cn-gap` relationship. Surface owns the
class and its complete behavior.

### Constraints

Spacing uses a named role or another grid multiple. No intermediate spacing step
is introduced for local visual adjustment.

`--cn-line` remains both the prose rhythm and row-height role. Body text uses one
line unit, allowing a control one line unit high to align with adjacent text.

Radius steps derive from the grid. A rounded container provides at least one grid
unit of padding, preventing its curve from crowding the content. A consumer that
requires a rounded corner without selecting a size uses the default radius role.

The grid, icon sizes, and breakpoint thresholds use `rem`. The design system does
not set the root text size, so these measurements follow the reader's default.

Page-grid columns and margins, component dimensions, typography, and border box
rules are outside this capability. A component selects from the available spatial
roles according to its own structure.

## Contract

### Definition of Done

- The Spatial System principles book demonstrates the three relationship roles,
  vertical rhythm, radius proportionality, and `.surface` padding.
- A source-driven lexicon publishes every unit and radius token.
- Human review accepts the resulting rhythm and proportions at default and enlarged
  browser text sizes.

### Regression Guardrails

- Every grid-derived measurement is calculated from `--cn-grid` in the stylesheet.
- Icon sizes and breakpoint thresholds remain the only independent spatial `rem`
  families owned by this capability.
- No design-system stylesheet sets the root text size or expresses a breakpoint in
  pixels.
- The token entry point supplies the grid dependency required by elevation-shadow
  declarations.

### Scenarios

```gherkin
Given an unlisted spacing decision
When the relationship between the elements is identified
Then the selected spacing is the corresponding role or a grid multiple
```

```gherkin
Given body text beside a control one line unit high
When both render on the same row
Then the control aligns with the text rhythm
```

```gherkin
Given content inside a rounded container
When the container renders
Then its padding is at least one grid unit
```

```gherkin
Given a reader who enlarges the browser's default text size
When a spatial unit is evaluated
Then its rem-based measurement scales with that preference
```
