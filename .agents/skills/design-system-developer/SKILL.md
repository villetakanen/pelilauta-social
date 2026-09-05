---
name: design-system-developer
description: Develop, debug, and maintain the design system, its tokens, and components. Use when modifying packages/design-system, tokens, components, or user-interface styles.
---

# Design System Developer

A task in this domain either migrates an existing component or CSS rule, or writes a new component.

Specs anchor the design system — why a feature exists and how it behaves, and they are not infallible. A design-system change is governed by a spec: create or amend one as part of the change. A bug, or a lesson development teaches, can force that amendment, and the work does not wait for the operator to make it. Mark the change `proposed`, carry on, and flag it in the delivery report, where the operator clears it to `live` or turns it back.

## The migration test

A migration is complete when the application functions identically with the legacy component or stylesheet deleted from the workspace.

Migrated components render correctly rather than identically to legacy defects. A like-for-like copy of current application rendering preserves defects.

Declaring a token that Cyan already declares fails this test. Shadowing a Cyan token in the cascade while Cyan supplies the rule reading the token preserves application dependence on Cyan. A surface migrates when the design system carries the rule reading the token.

## Where design intent comes from

Source visual presentation from v20 at `~/dev/pelilauta-20/`. When v20 disagrees with the shipped application, v20 takes precedence because the shipped application renders v18 and appearance forms no compatibility contract.

Find the v20 implementation before writing a replacement. Search CSS in `packages/cyan/src/{tokens,core,layouts,utilities}` and inline in `.astro` global style blocks. Inspect intent in specimen books under `app/cyan-ds/src/content/`.

When v20 provides no guidance or contradicts itself, request clarification before deciding and deliver changes independent of the decision.
