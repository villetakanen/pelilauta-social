---
name: spec
description: Create or update a concise Pelilauta intent spec when a feature or design-system capability needs its why and what defined before planning or implementation.
---

# Intent Spec

Use this skill for durable product or design-system intent. Do not use it for a
delivery plan, task list, implementation design, test log, or retrospective.

## Procedure

1. Read the relevant v18 behavior, approved product direction, and existing
   parent specs.
2. Create or update `specs/<domain>/<capability>/spec.md`. Design-system work
   normally uses `specs/design-system/<capability>/spec.md`.
3. Add frontmatter status: `draft`, `approved`, or `deprecated`. New intent is
   `draft` until a human approves it.
4. State why the capability exists, what users and consumers can rely on, its
   goals, principles, boundaries, and observable acceptance.
5. Exclude framework choices, file layouts, task sequencing, command output,
   and implementation status. Put those in the linked plan.
6. Record compatibility intent and deliberate behavior changes without copying
   implementation details into the spec.
7. Ask for human approval before changing status to `approved`.

Keep the spec small enough to guide decisions. If implementation discovers a
real intent ambiguity, reconcile the spec with the human owner rather than
silently treating either prose or code as automatically correct.
