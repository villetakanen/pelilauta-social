---
status: proposed
---

# Forms

## Blueprint

### Context

Readers distinguish groups of related fields when editing settings or entering account
and channel details. Forms gives those groups a shared presentation across the
application, including groups without a visible title.

### Architecture

Forms supplies element styles for `fieldset` and `legend` in
`packages/design-system/styles/forms.css` through `ds.css`.
The treatment applies without a class or component wrapper.

[Fields](../fields/spec.md) governs individual text controls and their labels.
[Spatial System](../spatial-system/spec.md) governs spacing measurements.
[Typography](../typography/spec.md) governs type treatments.
[Surface](../surface/spec.md) governs containing surfaces and elevation.
[Actions](../actions/spec.md) governs action rows.

### Documentation

`apps/design/src/content/base/forms.mdx` carries the Forms book.

### Constraints

A fieldset presents a borderless stack without padding, outer margin, background, or
shadow. The containing surface supplies visual enclosure.

The stack separates direct children other than the legend by `--cn-line`, measured
between child margin boxes. A component within the stack retains its internal spacing.

A legend precedes the stack with the h3 type treatment, including container-responsive
downshift and subheading colour. The legend aligns with the inline start of the stack
and leaves `--cn-line` between its line box and the margin box of the first child. A
fieldset without a legend reserves no title space.

A fieldset shrinks below its intrinsic content width to fit its container. A long
legend wraps within the container width.

Unsaved edits do not change group elevation.

## Contract

### Definition of Done

- The site metadata, extra settings, site options, nickname, and channel creation
  groups receive the shared treatment without local fieldset or legend overrides.
- The Forms book presents titled and untitled groups with text controls, toggles,
  and supporting text in both colour schemes and in a narrow container.
- The Forms book includes an editable group and a disabled fieldset.
- Human review accepts the grouping, legend hierarchy, and spacing in the book.

### Regression Guardrails

- Forms preserves native fieldset grouping and disabled behaviour.
- A group presentation does not alter the presentation or operation of member controls.
- A consumer places the group inside a surface without adding a second inset or
  elevation layer.

### Scenarios

The Forms book specimens carry these scenarios until browser checks exist.

```gherkin
Scenario: A titled group separates related fields
  Given a fieldset with a legend and several direct children
  When it renders in either colour scheme
  Then the legend uses the responsive h3 treatment above a borderless stack
  And the title-to-stack interval and gaps between child margin boxes are --cn-line

Scenario: An untitled group starts with its content
  Given a fieldset without a legend
  When it renders
  Then no title space precedes its first child

Scenario: A group fits a narrow container
  Given a fieldset with a long legend and a labelled text control
  When its container is narrower than their intrinsic widths
  Then the fieldset and control fit the container
  And the legend wraps within it

Scenario: Editing preserves group depth
  Given a form group inside a surface
  When an edit makes its values unsaved
  Then the group retains its background and shadow
```
