---
status: approved
---

# Surface

## Blueprint

### Context

Surface establishes a padded container and a visual depth hierarchy. Five levels
coordinate background colour and shadow to distinguish the application ground
plane, resting content, raised content, floating content and the highest system
layer. Colour and shadow express one hierarchy in both themes.

### Architecture

`.surface` is a `surface-area` inline-size container with `--cn-gap` of padding.
It renders at elevation 1 unless an `.elevation-0` through `.elevation-4` class on
the same element selects another level. The elevation class changes the visual
level without removing the container or its padding. For relative nesting,
`.surface` participates as its default elevation 1 or as the level selected by its
elevation class.

The elevation classes are also public utilities independent of `.surface`. Each
sets `background-color` and `box-shadow`, consuming the surface and shadow roles
owned by `specs/design-system/design-tokens/spec.md`. Components such as Card
compose these utilities rather than restating their declarations.

| level | role | background | standalone shadow |
| :--- | :--- | :--- | :--- |
| 0 | application ground plane | `--cn-surface` | none |
| 1 | resting surface | `--cn-surface-1` | none |
| 2 | raised surface | `--cn-surface-2` | `--cn-shadow-elevation-2` |
| 3 | floating or active surface | `--cn-surface-3` | `--cn-shadow-elevation-3` |
| 4 | highest system layer | `--cn-surface-4` | `--cn-shadow-elevation-4` |

Levels in a nested elevation chain increase from ancestor to descendant. A child
therefore has a level greater than every elevated ancestor. Its background remains
the one assigned to its absolute level. Its shadow represents only the difference
from its nearest elevated ancestor:

| ancestor to child | child shadow |
| :--- | :--- |
| 1 to 2 | none |
| 1 to 3 | `--cn-shadow-elevation-2` |
| 1 to 4 | `--cn-shadow-elevation-3` |
| 2 to 3 | none |
| 2 to 4 | `--cn-shadow-elevation-2` |
| 3 to 4 | none |

Without a positive-level elevated ancestor, the standalone shadow applies.
Explicit descendant rules implement the finite relative model. Their source order
resolves an increasing chain against its nearest elevated ancestor. Shadow values
are not arithmetically decomposed in CSS.

### Constraints

Elevation 0 paints the ground plane; it is not transparent and is not a reset.
Elevation 1 and every one-level rise are shadowless. Their lift is conveyed by
the change in surface colour where the theme provides one.

The utilities use `background-color`, not the `background` shorthand, so they do
not remove a consumer's background image or gradient.

Surface sets no foreground colour and does not make every foreground role suitable
for every level. Its book specimens choose roles that meet WCAG 2.2 AA for their
content in both themes; consuming capabilities own the same decision for their
content.

Surface sets no radius, border, size, foreground or component semantics.
`.surface` owns only its forced padding, named inline-size containment and default
elevation; an elevation utility alone adds no padding or containment.

## Contract

### Definition of Done

- Both applications receive all five elevation utilities through the design
  system's stylesheet entry point.
- Both applications receive `.surface` as a padded named container whose default
  visual treatment is elevation 1.
- The Spatial System principles book explains `.surface` as the named container
  whose forced padding uses the spacing system.
- The Colour & Surface principles book explains the elevation hierarchy and
  renders every level in Light and Dark.
- A Surface utilities book explains `.surface`, every elevation utility, explicit
  level overrides and relative nesting as one public API. Its examples render from
  the shipped classes.
- Automated browser checks verify `.surface`, its explicit elevation override and
  the computed background and shadow of every standalone level and supported
  nested transition in both themes.
- Human review accepts the hierarchy and foreground contrast of the principles and
  utility specimens in both themes.

### Regression Guardrails

- Level 4 remains intentionally discontinuous with the lower surfaces in both
  themes. Normalising it into a linear tonal sequence removes its system-layer
  distinction.
- Elevation utilities do not acquire `.surface` padding or containment. The
  composition remains explicit in the class vocabulary.

### Scenarios

```gherkin
Given an element at elevation 0
When it renders
Then its background colour resolves to the application ground-plane role
And it has no shadow
```

```gherkin
Given an element at elevation 1
When it renders without an elevated ancestor
Then it paints the level 1 surface colour
And it has no shadow
```

```gherkin
Given an element at elevation 2, 3 or 4
When it renders without an elevated ancestor
Then it paints the surface colour for its level
And it has the full shadow for its level
```

```gherkin
Given an elevated child whose level is greater than every elevated ancestor
When both render
Then the child paints the surface colour for its own level
And its shadow equals the difference between the two levels
```

```gherkin
Given a chain of nested elevated elements whose levels increase at every step
When the chain renders
Then each child shadow represents its rise from the nearest elevated ancestor
```

```gherkin
Given an elevated element with a background image or gradient
When a surface utility is applied
Then the image or gradient remains
```

```gherkin
Given an element with the surface class and no elevation class
When it renders
Then it has --cn-gap of padding
And it establishes the surface-area inline-size container
And its background and shadow are those of elevation 1
```

```gherkin
Given an element with the surface class and an elevation class
When it renders
Then it keeps the surface padding and containment
And its background and shadow are those of the selected elevation
```

```gherkin
Given a surface with no elevation class containing an element at elevation 3
When both render
Then the surface participates as an elevation 1 ancestor
And the child has the shadow for a two-level rise
```
