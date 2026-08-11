---
name: spec
description: Creates specs before implementation. Use when starting a feature, or significant change, or no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec

A Spec describes the why, and how, for a feature. It defines how the system works (Design) and how we expect it to work (Quality).

Specs follow ASDLC.io Living Specs practice: a spec anchors the feature
to its expected state.

Anatomy of a spec is defined in `specs/TEMPLATE.md`.

## Procedure

1. Decide if a a spec, or an amendment to a spec is needed. Small changes
   trivially inferrable from the codebase, and conforming to a spec
   do not need a spec change. If the work can be done, without a spec
   change, always vocalize the decision.
2. Existing specs, implementation, and documents of the v20 act as
   the primary source for design-system intent and vision, where
   these have not been overridden with the local work.
3. Existing specs, implementation, and documents of the v18 act as
   the primary source for application, business and solution logic
   and features for the pelilauta app. Where these conflict with the
   v20 or current v21 design intent, ask the user for a clarification.
4. Where the spec can not be proposed from the v20 and v18 sources,
   always ask user for clarificatioons.
5. Create or update `specs/<domain>/<capability>/spec.md` for the spec.
   where the capabiity has sub-features, these are placed in sub-folder
   of the capability: `specs/<domain>/<capability>/<sub-feature>/spec.md`. A spec can be split to multiple children, inside the folder, as
  long as these are listed in the parent
6. Encode the status of the document in the frontmatter:
   `status: draft | approved | deprecated`, nothing else. A `draft`
  denotes a new or a modified spec, lacking human approval. An `approved`
  spec has been reviewed as a human, and it is expected to portray
  how the system is expected to work. A historical spec, we want to
  keep for reference, is marked `deprecated`.
7. When making a minor adjustments to a spec, ask the human to approve
   the diff, to avoid committing extra state-changes for compliance.
8. Large scale, or irreversible decisions require an additional ADR in
  `docs/adrs/`.
9. After a spec is altered, run the spec-review -skill.

## Prose

Follow `docs/DESIGN.md`. A spec is direct, strict and technical.
