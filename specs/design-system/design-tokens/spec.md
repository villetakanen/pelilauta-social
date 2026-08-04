---
status: approved
---

# Design Tokens

## Blueprint

### Context

Design tokens carry recurring visual decisions across the design system and both
applications. Reference tokens define the available values; semantic tokens name
their purpose. Consumers depend on that purpose, allowing a visual expression to
change without changing the meaning of every use.

### Architecture

The permanent model runs in one direction:

1. The **reference layer** declares literal values.
2. The **semantic layer** assigns roles. A theme-dependent role expresses Light
   and Dark as two arms of one declaration; a theme-invariant role uses one
   expression.
3. **Consumers** read semantic roles according to purpose.

Surface consumes background and shadow roles to form elevation levels as defined
by `specs/design-system/surface/spec.md`. Components compose those levels where
required; they do not reconstruct the elevation token mapping.

The grid family is independent of colour. Semantic shadow declarations derive
from the grid, so the token entry point composes both families and supplies every
dependency together.

Cyan 4 compatibility aliases are outside the permanent model. They keep legacy
consumers testable while migration is incomplete. An alias is added when a
remaining legacy consumer requires it and terminates in a reference or semantic
token. The aliases are removed before `v21.0.0-rc.1`.

### Constraints

A token represents a reviewed decision shared by current consumers. One-off
component values do not require tokens, and a possible future consumer does not
justify a token family.

Tokens remain inputs to CSS calculations. Consumers compose final measurements
from them instead of storing precomputed results that would stop responding when
an input changes.

The grid uses `rem`, the design system sets no root text size, and every breakpoint
uses `rem`. Spacing and query thresholds therefore follow the reader's default
text size.

Semantic colour roles preserve purpose, hierarchy, interaction states, and
readable contrast in Light and Dark. A consumer uses a semantic role where the
system has named that purpose; it does not select a reference colour as a local
substitute.

Transparency may be mixed with a reference colour to derive an overlay. It does
not introduce another palette colour into the semantic layer.

Compatibility aliases receive no lexicon and no new consumer. They are migration
scaffolding, not an alternative public vocabulary or a completeness contract.
They receive no dedicated compatibility test.

## Contract

### Definition of Done

- A new token family has a named production use and is documented by the book
  that owns its design intent.
- A source-driven lexicon lists every token declared by its stylesheet and the
  value as declared. A selection matching no token fails the build.
- Human review accepts the hierarchy, states, and contrast produced by semantic
  roles in Light and Dark.

### Regression Guardrails

- A semantic colour token depends only on reference colours or other semantic
  tokens. A reference token does not depend on the semantic or compatibility
  vocabulary.
- The token entry point supplies the grid dependency required by semantic shadow
  declarations.
- No design-system stylesheet sets the root text size or uses a pixel breakpoint.
- The compatibility vocabulary does not appear in a lexicon and is removed before
  `v21.0.0-rc.1`.

### Scenarios

```gherkin
Given a semantic colour role used by a component
When the active colour scheme changes between Light and Dark
Then the role resolves to the expression for that scheme
And its purpose in the component does not change
```

```gherkin
Given a reader who enlarges the browser's default text size
When a rem-based design-system measurement or breakpoint is evaluated
Then its rem-based value scales with that preference
```
