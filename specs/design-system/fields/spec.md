---
status: live
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
layer over one container colour. Material's shape, floating label, supporting text,
leading and trailing icons, and error treatment are not this capability's.

A field's accessible name comes from a `<label>` wrapping the control. Its text stands
outside the filled container, so it is unaffected by the state fills.

`specs/design-system/preflight/spec.md` governs a field's type inheritance, resize
behaviour and default block size. This spec begins at colour, shape, border and state.

The colour roles are declared in `semantic.css` over the chroma families, under the
direction `specs/design-system/color-system/spec.md` sets. A component that paints its own
field consumes these roles; the values live here alone, so every field in the system moves
together.

| Role | Light | Dark |
| :--- | :--- | :--- |
| `--cn-color-field` | surface 80 | surface 10 |
| `--cn-color-field-hover` | surface 90 | surface 20 |
| `--cn-color-field-focus` | primary 99 | primary 10 |
| `--cn-color-field-border` | surface 70 | surface 30 |
| `--cn-color-field-border-hover` | primary 60 | primary 40 |
| `--cn-color-field-border-focus` | primary 70 | primary 30 |
| `--cn-color-field-placeholder` | surface 50 | surface 70 |
| `--cn-color-field-disabled` | not settled | not settled |

The family carries the `color` segment that 33 older roles in `semantic.css` do not.
`plans/debt/colour-token-naming.md` carries which shape is the convention.

### Documentation

- `apps/design/src/content/base/fields.mdx`

### Constraints

A field carries three states — rest, hover and focus — and each takes its own fill and its
own border colour. The fills are calibrated against a reference surface of surface 100 in
Light and surface 30 in Dark: the field rests as a dip below that surface, and hover rises
one step toward it. The reference is fixed, and which elevation a field sits at is not
settled here.

Focus leaves the surface family for the primary one. It separates the field from its
surface by hue rather than by lightness, and it raises the contrast of the reader's words
against the field they sit in. A field states no foreground colour, so it takes the
inherited body foreground in every state.

The focus state's selector is `:focus-within`. Most readers reach a field by touch, and
`:focus-visible` does not fire for them. The selector holds on the control and on the
label wrapping it, so a component composing a field paints the state on either.

A field takes no radius. The indicator closes the fill rather than enclosing it, and a
rounded corner would read as an enclosure.

A field draws its active indicator as a border along the block end alone. Its resting
width is `calc(var(--cn-grid) / 8)`, one device pixel at the default root size, growing
with the reader's text setting. Focus doubles it, and changes no measurement of the field
or its content.

The indicator's colour does not escalate with the state. Hover takes the bolder step,
because a hover fill that stays in the surface family leaves the border carrying the
signal; focus takes the milder one, because its fill has already changed family. Ordering
the two the other way, so the indicator strengthens from rest through focus, leaves hover
with no signal of its own.

A field carries a disabled state, switched by `:disabled`, so a component that has to
reach the state has one to reach. It reads as a field and as one the reader cannot use, at
the same time. `--cn-color-field-disabled` is reserved for it, and the sample settles what
the state is worth by experiment.

Keyboard focus additionally draws `--cn-focus-ring`. The ring's width and offset come from
what the accessibility requirement demands where the field is drawn; no version of this
system reasoned about ring geometry, and this spec does not settle it.

The placeholder is the design system's treatment rather than a consumer's, and it clears
when the field takes focus, before the first letter. Its colour is the faintest step in
the surface family that holds 3:1 against the resting fill.

A field paints no error or rejected-input state.

## Contract

### Definition of Done

- A reader distinguishes rest, hover and focus on `input[type="text"]` and `textarea` in
  both colour schemes.
- The focus treatment reaches a reader who taps.
- A field renders the same way in `apps/design` and in `apps/pelilauta`, and removing
  `@11thdeg/cyan-css` from a sampled surface leaves its fields unchanged.
- The fields book renders every state in both schemes.
- The focus ring meets the accessibility requirement its geometry comes from.
- The disabled state reads both as a field and as unusable, in both schemes.

### Regression Guardrails

- The hover and focus fills resolve to different values in both schemes. Pointing them at
  one step returns a field to two visible states out of three.
- The dark resting fill stays off the end of the surface scale, so hover has a step to
  move into.
- Focus stays in the primary family. Returning it to a surface step reintroduces the
  dark-end squeeze that hue avoids.
- The inherited body foreground meets WCAG 2.2 AA on all three fills in both schemes,
  checked against the semantic tokens rather than a specimen. The focus fill leaves the
  surface family, so a change to the primary family reaches a field's readability where
  the surface roles alone would not show it.
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
Then its fill and its border take the resting field roles
And the inherited body foreground meets WCAG 2.2 AA on that fill
```

```gherkin
Given a text input or textarea
When a pointer rests on it
Then its fill and its border take the hover field roles
And the inherited body foreground meets WCAG 2.2 AA on that fill
```

```gherkin
Given a text input or textarea
When a reader taps into it
Then its fill and its border take the focus field roles
And its indicator doubles in width without moving the field or its content
And the inherited body foreground meets WCAG 2.2 AA on that fill
```

```gherkin
Given a text input or textarea
When a reader reaches it with the keyboard
Then it takes the focus field roles
And it draws --cn-focus-ring
```

```gherkin
Given a field carrying a placeholder
When the field takes focus
Then the placeholder is no longer shown
```

```gherkin
Given the same field markup in apps/design and in apps/pelilauta
When both render
Then their fill, border and placeholder colours agree in both schemes
```
