---
name: design-system-developer
description: Develop, debug, and maintain the design system, its tokens, and components. Use when modifying packages/design-system, tokens, components, or user-interface styles.
---

# Design System Developer

A task in this domain changes a capability the design system carries, or adds one.

Specs anchor the design system — why a feature exists and how it behaves, and they are not infallible. A design-system change is governed by a spec: create or amend one as part of the change. A bug, or a lesson development teaches, can force that amendment, and the work does not wait for the operator to make it. Mark the change `proposed`, carry on, and flag it in the delivery report, where the operator clears it to `live` or turns it back.

A change renders correctly, not identically to what the application renders today. The current rendering is not a contract, and a like-for-like copy preserves its defects.

## Where design intent comes from

`docs/DESIGN.md` ranks the sources: the live spec first, v20 at `~/dev/pelilauta-20/` where the spec is silent, and the human where v20 is silent or wrong. v20 is read for what it does, never for what was meant.

Find the v20 implementation before writing. Search CSS in `packages/cyan/src/{tokens,core,layouts,utilities}` and inline in `.astro` global style blocks. Inspect intent in specimen books under `app/cyan-ds/src/content/`.

When v20 provides no guidance or contradicts itself, request clarification before deciding and deliver changes independent of the decision.
