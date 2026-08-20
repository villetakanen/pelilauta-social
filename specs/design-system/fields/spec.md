---
status: proposed
---

# Fields

## Blueprint

### Context

Pelilauta is a place people write to each other. Starting a thread, answering someone,
naming a site, writing a handout, searching the library — each is a reader typing. Fields
give that act a surface the design system paints, so a reader can tell a field is a field
before touching it, knows the field has taken their input, and meets the same field in the
design site and in the application.

### Architecture

An element style, `packages/design-system/styles/fields.css`, paints `input[type="text"]`
and `textarea`. Select, checkbox, radio, range and file controls are not fields under this
spec, and read-only is not settled here.

A field takes the core idea of the Material Design 3 filled text field, and not its
letter: a filled container the reader types into, closed by an active indicator along its
block end, which strengthens as the reader engages it. What the container is filled with
is the field roles below; each state paints a solid fill rather than compositing a state
layer over one container colour. Material's shape, supporting text, leading and trailing
icons, and error treatment are not this capability's.

A field's accessible name comes from a `<label>` wrapping the control. The label is the
filled container, and the field it wraps draws nothing of its own, so the name stands
inside the fill and above the reader's words.

`specs/design-system/preflight/spec.md` governs a field's resize behaviour and default
block size, and `specs/design-system/fonts/spec.md` decides that a field is set in the
mono family. This spec begins at type size, colour, shape, indicator and state.

The colour roles are declared in `semantic.css` over the chroma families, under the
direction `specs/design-system/color-system/spec.md` sets. A component that paints its own
field consumes these roles; the values live here alone, so every field in the system moves
together.

| Role | Light | Dark |
| :--- | :--- | :--- |
| `--cn-color-field` | surface 95 | surface 20 mixed two thirds into surface 40 |
| `--cn-color-field-focus` | primary 99 | surface 40 |
| `--cn-color-field-border` | surface 50 | surface 70 |
| `--cn-color-field-border-hover` | primary 50 | primary 80 |
| `--cn-color-field-border-focus` | primary 40 | primary 80 |
| `--cn-color-field-label` | surface 30 | surface 80 |
| `--cn-color-field-label-hover` | primary 30 | primary 80 |
| `--cn-color-field-label-focus` | primary 40 | primary 80 |
| `--cn-color-field-placeholder` | surface 50 | surface 70 |
| `--cn-color-field-hover` | not painted | not painted |
| `--cn-color-field-disabled` | not settled | not settled |

`--cn-color-field-hover` is declared and unpainted: hover holds the resting fill. The role
stands because a component that needs a hover fill of its own has one to read.

The family carries the `color` segment that 33 older roles in `semantic.css` do not.
`plans/debt/colour-token-naming.md` carries which shape is the convention.

### Documentation

- `apps/design/src/content/base/fields.mdx`

### Constraints

A field carries three states — rest, hover and focus. The indicator carries all three:
hover recolours it and doubles its width, and focus recolours it, keeps the doubled width
and changes the fill as well. Hover leaves the fill where it rests, so a pointer crossing
a form does not wash its fields in and out.

Focus leaves the surface family in Light for the primary one, which separates the field
from its surface by hue rather than by lightness. In Dark it takes a surface step
instead, because the indicator and the label already carry the primary family there and a
third primary would leave the state louder than the words in it.

Hover's indicator is the brighter step of the two and focus's is the darker, so the two
states differ in lightness and not in hue alone, and a reader who cannot separate the
hues still sees the state change. The width they share is the change a reader sees first.

A field states no foreground colour for the reader's words, in any state, so they take
the inherited body foreground. The label states one.

The fill, the indicator and the label cross between states over the interaction motion
every control that answers a pointer shares, and hold still under
`prefers-reduced-motion: reduce`. Without the crossing a pointer moving down a form
flickers every field it passes.

A disabled field answers no pointer, so hover does not reach it.

The focus state's selector is `:focus-within`. Most readers reach a field by touch, and
`:focus-visible` does not fire for them. The selector holds on the control and on the
label wrapping it, so a component composing a field paints the state on either.

A field draws no focus ring, and the active indicator is the focus indication. A focused
text control matches `:focus-visible` whichever way the reader reached it, because typing
is expected of it, so a ring written for the keyboard lands on every click as well.
Material Design 3's filled field takes the same position. The focus state changes the
fill, doubles the indicator and recolours the label, which is what WCAG 2.2 SC 2.4.7 asks
of a visible focus; SC 2.4.13 Focus Appearance, which would settle a ring's geometry, is
AAA and a filled field does not target it.

A field states its own type size and leading rather than inheriting them, so it is the
same field in prose, in a caption and in a component. The size is the reading step
measured in the mono face, at which the field's lowercase stands as tall as the lowercase
of the prose beside it. It does not sit on the spacing grid, and the type scale
`specs/design-system/typography/spec.md` publishes does not either.

The field a reader sees is six units tall at one line, and half a unit of margin on either
side puts it in a seven-unit row — the visual-inside-physical pair `--cn-button-size` and
`--cn-button-physical-size` set for a control. A field alone spaces its
content a unit and a half above and below and two units to either side. A labelled field
stands the same six: half a unit of padding, the label's two units, the value's three,
half a unit of padding. Both land on the grid at every line count. A field draws no inner
control, so the box a reader sees is the box a reader taps.

The label takes the label step's size and line, in Lato rather than the mono a field is
otherwise set in: it is the field's name, written by the system, where the value below it
is the reader's text. Its resting colour is a surface step in from the end of the
scale, off the near-black the body takes in Light and off the near-white it takes in Dark,
and the steps are saturated at hue 242, so the name carries a hint of colour the value
does not. Hover and focus move it to the primary family.

A field takes no radius. The indicator closes the fill rather than enclosing it, and a
rounded corner would read as an enclosure.

A field draws its active indicator along the block end alone. Its resting width is
`calc(var(--cn-grid) / 8)`, one device pixel at the default root size, growing with the
reader's text setting. Hover and focus double it, and change no measurement of the field
or its content.

A field carries a disabled state, switched by `:disabled`, so a component that has to
reach the state has one to reach. It reads as a field and as one the reader cannot use, at
the same time. `--cn-color-field-disabled` is reserved for it, and its value is unsettled:
the element style dims the resting treatment with the opacity every disabled control
shares.

The placeholder is the design system's treatment rather than a consumer's, and it clears
when the field takes focus, before the first letter. It is set in italic, and its colour
is the faintest step in the surface family that holds 3:1 against the resting fill.

A field paints no error or rejected-input state.

## Contract

### Definition of Done

- A reader distinguishes rest, hover and focus on `input[type="text"]` and `textarea` in
  both colour schemes.
- The focus treatment reaches a reader who taps.
- A labelled field shows its name inside the fill, above the reader's words.
- A field renders the same way in `apps/design` and in `apps/pelilauta`, and removing
  `@11thdeg/cyan-css` from a sampled surface leaves its fields unchanged.
- The fields book renders every state in both schemes.
- The disabled state reads both as a field and as unusable, in both schemes.

### Regression Guardrails

- Hover and focus resolve to different indicator colours in both schemes. Pointing them at
  one step returns a field to two visible states out of three.
- Hover does not paint a fill. A fill under the pointer is the treatment this capability
  measured and rejected.
- The two indicator colours differ in lightness, not in hue alone.
- The inherited body foreground meets WCAG 2.2 AA on the resting and the focused fill in
  both schemes, checked against the semantic tokens rather than a specimen.
- The label's colour meets WCAG 2.2 AA on the fill it stands in, in all three states.
- A wrapped field paints no fill and no indicator of its own. The container's rules are
  the less specific ones, so a state added to a field reaches inside a label unless it is
  reset there as well.
- The placeholder holds 3:1 against the resting fill. The surface steps are saturated at
  hue 242 and the WCAG luminance formula weights blue at 7%, so steps 10 through 50 measure
  as near-equal luminance while differing plainly to the eye; a check reads the measured
  value rather than the lightness step.
- A component that paints a field reads the roles. A restated value gives the system two
  fields that can drift.

### Scenarios

```gherkin
Given a text input or textarea at rest
When it renders in Light or Dark
Then its fill and its indicator take the resting field roles
And the inherited body foreground meets WCAG 2.2 AA on that fill
```

```gherkin
Given a text input or textarea
When a pointer rests on it
Then its indicator takes the hover colour and doubles in width
And its fill does not change
```

```gherkin
Given a disabled text input or textarea
When a pointer rests on it
Then nothing about it changes
```

```gherkin
Given a text input or textarea
When a reader taps into it
Then its fill and its indicator take the focus field roles
And its indicator doubles in width without moving the field or its content
And the inherited body foreground meets WCAG 2.2 AA on that fill
```

```gherkin
Given a text input or textarea
When a reader reaches it with the keyboard
Then it takes the focus field roles
And it draws no ring
```

```gherkin
Given a label wrapping a text input or textarea
When it renders
Then the label text stands inside the fill, above the value
And the label takes the field label role while the value takes the body foreground
And the label moves to the primary family on hover and on focus
```

```gherkin
Given a field carrying a placeholder
When the field takes focus
Then the placeholder is no longer shown
```

```gherkin
Given the same field markup in apps/design and in apps/pelilauta
When both render
Then their fill, indicator, label and placeholder colours agree in both schemes
```
