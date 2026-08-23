---
status: live
---

# Surface

## Blueprint

### Context

Surface tells a reader what is the application, what is content, and what the
application has put in front of them. Five levels carry that with background colour
and shadow, so the ranking is legible before a word is read and nothing needs a
border to be seen as separate. Each level means one thing, and the system publishes
only the levels it has meanings for: Material treats elevation as an abstract depth
applied wherever a designer wants it, and this system gives every level a purpose a
component either has or does not have.

### Architecture

`.surface` is a `surface-area` inline-size container with `--cn-gap` of padding.
It renders at elevation 1 unless an `.elevation-0` through `.elevation-4` class on
the same element selects another level. The elevation class changes the visual
level without removing the container or its padding. For relative nesting,
`.surface` participates as its default elevation 1 or as the level selected by its
elevation class.

The elevation classes are also public utilities independent of `.surface`. Each
sets `background-color` and `box-shadow`, consuming the surface and shadow roles
defined by `specs/design-system/design-tokens/spec.md`. Components such as Card
compose these utilities rather than restating their declarations.

| level | means | Light background | Dark background | standalone shadow | under a poster |
| :--- | :--- | :--- | :--- | :--- | :--- |
| — | the canvas | surface 95 | surface 20 | none | behind the artwork, opaque |
| 0 | the application itself | surface 95 | surface 20 | none | a wide share |
| 1 | payload | surface 100 | surface 20, a third of the way to 40 | none | a narrow share |
| 2 | payload inside payload | surface 100 | surface 20, a third of the way to 40 | `--cn-shadow-elevation-2` | a narrow share |
| 3 | floats over content | surface 100 | surface 20, two thirds of the way to 40 | `--cn-shadow-elevation-3` | opaque |
| 4 | a system interrupt | primary 99 | primary 40 | `--cn-shadow-elevation-4` | opaque |

The canvas is not a level a consumer selects: it is the page's ground, painting level
0's colour because level 0 is what the page is. A poster paints over it and dissolves its
lower edge back into it, which is why the canvas stays opaque while a level 0 surface
standing over the same artwork does not.

A surface at level 0 claims no separation from the application. Level 1 holds what a
reader came to read or use, and is the default. Level 2 is the rise that keeps payload
distinguishable from the payload holding it; a surface reaches it by nesting rather than
by choosing it. Level 3 covers a region of content without dimming it, whether it stays
or is dismissed. Level 4 is the application interrupting the reader.

Levels 1 and 2 share a background in both schemes and are separated by their shadows.
Where the schemes differ is level 3: light gives it the same background again, and dark
raises its lightness by as much as level 1 rose from the application, because a shadow
carries less on a dark ground than on a light one.

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

### Constraints

`.elevation-0` paints the page background colour. Where a poster paints that background
instead, the levels standing on the artwork cede to it. The ground plane takes a wide
share, because a page standing over artwork is meant to show it. Payload takes a narrow
one: enough of the artwork reaches through it to place it on the page, and it stays
legible.

Levels 3 and 4 keep their opacity. They float over content rather than over the page, so
a share there would show whatever they cover rather than the artwork.

Both shares are rungs of the transparency ladder
(`specs/design-system/color-system/spec.md`). A ceding level keeps its own background
colour and takes only the share, so ceding never moves a level to another level's colour.
Which levels cede, and how far, is what the poster capability states
(`specs/design-system/components/cn-poster/spec.md`).

An action is not a surface. An action may take an elevation shadow to show that it lifts,
and takes no level with it; `specs/design-system/actions/spec.md` governs what an action
is.

A state may raise a surface by a level when the state makes its content something else.
Level 4 is not a destination a state reaches, because a state on a component cannot be an
interrupt from the application.

Elevation 1 and every one-level rise are shadowless. Their lift is conveyed by
the change in surface colour where the theme provides one.

The utilities use `background-color`, not the `background` shorthand, so they do
not remove a consumer's background image or gradient.

Surface sets no foreground colour and does not make every foreground role suitable
for every level. Its book specimens choose roles that meet WCAG 2.2 AA for their
content in both themes; consuming capabilities make the same decision for their
content.

Every level admits the inherited body foreground at WCAG 2.2 AA in both themes. An
element that carries an elevation utility and states no foreground is therefore
readable, and a consumer raises its foreground to strengthen a role rather than to
repair one. This constrains which background a level may take: level 4 leaves the
surface family, and its Dark step is selected so the inherited default still holds.
De-emphasised roles remain unsuitable at level 4.

Surface sets no radius, border, size, foreground or component semantics.
`.surface` provides only its forced padding, named inline-size containment and default
elevation; an elevation utility alone adds no padding or containment.

### Attention states

`has-notify` and `has-alert` are public state classes usable on any element. Each
paints a triangular corner flag in the upper-right: notification takes the
information role, alert the warning role, and alert wins when both are present.
The flag is a seven-grid-unit square clipped to `polygon(100% 0, 0 0, 100% 100%)`,
inherits its host's corner radius, and takes no pointer events. `--cn-flag-inset`
offsets it, so a host that clips its own overflow can pull the flag over its border.

The flag is supplementary. A consumer that uses either state carries its meaning in
text or another accessible state, because the classes announce nothing.

The states live with Surface rather than inside a component because a card and a
listing row are the same signal on different containers. Any capability that needs
the flag composes these classes instead of restating the geometry.

A state may be toggled after the server response, on an element that is never
hydrated: the rules read the classes and nothing else. The pseudo-element exists
only while a class does, so the fade is an animation rather than a transition,
suppressed under `prefers-reduced-motion`.

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
- A Surface utilities book documents the attention states, and a browser check
  verifies that a class added on the client paints the flag in its role colour on a
  surface that rendered without it.
- Human review accepts the hierarchy and foreground contrast of the principles and
  utility specimens in both themes.

### Regression Guardrails

- Level 4 remains intentionally discontinuous with the lower surfaces in both
  themes. Normalising it into a linear tonal sequence removes its system-layer
  distinction.
- The inherited body foreground meets WCAG 2.2 AA on every level in both themes,
  checked against the semantic tokens rather than a specimen.
- Level 4 remains distinguishable from both the ground plane and the resting
  surface. Darkening its Dark step until the inherited foreground is comfortable
  collapses it into level 1.
- Elevation utilities do not acquire `.surface` padding or containment. The
  composition remains explicit in the class vocabulary.
- The attention flag is declared once. A capability that shows it composes
  `has-notify` or `has-alert`; restating the geometry in a component gives the
  system two flags that can drift.
- The flag rules read the state classes and nothing else, so a class toggled after
  the server response takes effect without hydration.

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
Then the child paints the surface colour assigned to its level
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
Given an element at any elevation that states no foreground colour
When it renders in Light or Dark
Then the inherited body foreground meets WCAG 2.2 AA on its background
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

```gherkin
Given an element carrying `has-notify`
When it renders
Then a triangular flag in the information role fills its upper-right corner
```

```gherkin
Given a server-rendered surface carrying no state class
When a consumer adds `has-alert` to it on the client
Then the warning flag appears without the element being hydrated
```
