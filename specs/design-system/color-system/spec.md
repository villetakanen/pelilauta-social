---
status: live
---

# Color System

## Blueprint

### Context

The colour system carries Pelilauta's identity coherently through every
surface, and lets a site owner replace that identity with their own by
supplying a chroma family — a rebrand without a redesign. Under any brand,
readers get the same hierarchy, states, and readable contrast in Light and
Dark; component authors take a role for a purpose the system has named, and a
rung of the transparency ladder wherever a layer is translucent, so two
translucent layers on one page stay related rather than each tuned by eye. When
purpose and expression collide, purpose wins: an expression changes without
changing the meaning of any use.

### Architecture

Colour runs in one direction, on the token layers defined by
`specs/design-system/design-tokens/spec.md`:

1. **Chroma families** are literal, lightness-indexed OKLCH scales under
   `--chroma-{family}-{step}`. The step number states perceived lightness, 0
   black to 100 white, so equal steps across families carry equal lightness.
   OKLCH lightness stands in for WCAG contrast as an approximation, not an
   exact substitution requirement.
2. **Semantic roles** under `--cn-*` name purpose. A scheme-dependent role
   expresses Light and Dark as two arms of one declaration; a scheme-invariant
   role uses one expression.
3. **The transparency ladder** under `--cn-transparency-*` names the shares a
   translucent layer may take. A rung carries no colour and no scheme arm: the
   layer mixing it supplies both, so one ladder serves Light and Dark alike.
4. **Components consume purpose.** A direct chroma reference — decorative or a
   status expression — is private to one component and stated in its
   specification.

Five families exist:

- Two core families, **primary** and **surface**, are complete 13-step
  (0–100) scales and the only themeable surface. A replacement theme supplies
  a complete family, preserving the lightness of every step, and changes no
  semantic or component token.
- Three auxiliary families, **love**, **warning** and **error**, are partial
  20/40/60/90 scales consumed by base styles and components. They are not
  themeable.

`color-scheme` selects the Light or Dark arm; the scheme-selection and
persistence behaviour belongs to `specs/design-system/design-site-theme/spec.md`
and each application.

### Constraints

The ladder is eleven-percent steps, `--cn-transparency-1` through
`--cn-transparency-9`, and `--cn-transparency-half` below the smallest. A layer
that is translucent takes a rung.

Where the system has named a purpose, a consumer uses that semantic role, never
a chroma step. A purpose no role names is a component's private decision over
chroma, stated in its specification — a status expression (love, warning,
error) is such a decision over its auxiliary family. It becomes a shared role
when two capabilities consume the same purpose; a compatibility alias is not a
capability.

## Contract

### Definition of Done

- Human review accepts the hierarchy, states, and contrast produced by semantic
  roles in Light and Dark.
- The Colour principles book presents chroma as the theme-supplied layer and
  semantics as the stable component-facing layer.

### Regression Guardrails

- Each chroma family carries exactly its defined steps, and a step's OKLCH
  lightness equals its index divided by one hundred, unless the theme declares
  a reasoned exception for that step.
- Replacing a core family changes no semantic or component token and keeps
  every consumer resolvable.
- No declaration or consumer names an info chroma family; information is the
  semantic pair `--cn-color-info` and `--cn-color-on-info` over a core family.

### Scenarios

```gherkin
Given a semantic colour role used by a component
When the active colour scheme changes between Light and Dark
Then the role resolves to the expression for that scheme
And its purpose in the component does not change
```

```gherkin
Given a replacement theme supplying a complete core chroma family
When the design system renders with it
Then every semantic role resolves through the replaced family
And no semantic or component token changes
```
