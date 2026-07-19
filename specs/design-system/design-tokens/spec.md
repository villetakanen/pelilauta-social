---
status: approved
---

# Design Tokens

## Intent

Design tokens give Pelilauta a shared vocabulary for recurring visual decisions.
They allow the product and its design-system book to express the same visual
intent without each component or page inventing its own values.

The goal is a coherent, recognizable, and maintainable Pelilauta interface.
Changing an approved design decision should update every participating surface
consistently, while existing product behavior remains compatible during the v21
migration.

## Scope

The token system describes visual decisions that are shared across multiple
surfaces, including:

- reference choices such as the available color palette;
- semantic roles such as text, background, border, link, focus, and status;
- Light and Dark expressions of the same semantic intent;
- compatibility meanings needed while legacy Cyan consumers are replaced;
- future shared decisions for typography, spacing, shape, motion, and other
  visual foundations when a product feature requires them.

Reference choices state what is available. Semantic roles state why a choice is
used. Components consume semantic roles so that their meaning remains stable
when the visual expression evolves.

## Product Goals

- Pelilauta presents one deliberate visual language across old and new UI.
- Light and Dark modes preserve the same hierarchy, affordances, feedback, and
  readability.
- Shared visual decisions can evolve without unrelated component-by-component
  value changes.
- Legacy compatibility is explicit and temporary rather than becoming the
  permanent vocabulary of the v21 design system.
- Every token family is introduced by a production feature that demonstrates
  its value and by a design-system book that communicates its intent.

## Principles

- Tokens represent reviewed design decisions, not every literal value in the
  interface.
- Names communicate purpose rather than a particular implementation technique.
- Semantic meaning takes precedence over preserving historical visual values.
- Accessibility, visible interaction states, and readable contrast are part of
  the token intent in every supported mode.
- The smallest vocabulary that serves current product needs is preferred over a
  speculative complete system.
- A new token family is justified by a concrete consumer, not by possible future
  platforms or components.

## Non-Goals

- Tokens do not define component structure, content, interaction, or data
  behavior.
- Tokens do not require visual parity with Cyan 4 when an approved v21 design
  direction intentionally differs.
- Tokens do not require a platform-neutral interchange format or generation
  pipeline before a concrete non-web consumer exists.
- Tokens are not a reason to migrate unrelated product surfaces together.

## Acceptance

- A participating production surface and its design-system book express the
  same approved visual intent.
- Light and Dark modes preserve understandable hierarchy, states, and contrast.
- Existing consumers continue to work through an explicitly bounded
  compatibility contract until they are migrated.
- Every added token has a current, named purpose and consumer.
- Human review approves visual intent and any deliberate departure from the
  live v18 experience.
