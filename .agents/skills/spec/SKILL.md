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

1. Decide if a spec, or an amendment to a spec is needed. Small changes
   trivially inferrable from the codebase, and conforming to a spec
   do not need a spec change. If the work can be done, without a spec
   change, always vocalize the decision.
2. Existing specs, implementation, and documents of v20 are the primary
   source for what the design system does. They carry intent only where
   the human confirms it. Where they carry nothing, or carry an
   implementation the human or a study calls faulty, the intent comes
   from the human and the source search stops. An absent or broken
   feature is not a settled decision. A value repeated across the
   versions is one value in several copies, not corroboration.
3. Existing specs, implementation, and documents of the v18 act as
   the primary source for application, business and solution logic
   and features for the pelilauta app. Where these conflict with the
   v20 or current v21 design intent, ask the user for a clarification.
4. Where the spec can not be proposed from the v20 and v18 sources,
   always ask the user for clarifications.
5. Create or update `specs/<domain>/<capability>/spec.md` for the spec.
   where the capability has sub-features, these are placed in sub-folder
   of the capability: `specs/<domain>/<capability>/<sub-feature>/spec.md`. A spec can be split to multiple children, inside the folder, as
  long as these are listed in the parent
6. Encode the status of the document in the frontmatter:
   `status: proposed | live | deprecated`, nothing else. A `proposed`
  spec carries agent edits an operator may not have read; implementing
  against it requires an explicit ask, and waiting. A `live` spec has
  been read through by an operator and portrays how the system is
  supposed to work. A spec kept for its context or architecture as a
  lesson or example is `deprecated`. The status is a process gate, not
  protection: any spec may be edited at any time, an agent edit to a
  `live` spec sets it `proposed`, and an operator makes it `live` by
  reading it — never request, await or announce approval.
7. Large scale, or irreversible decisions require an additional ADR in
  `docs/adrs/`.
8. Before presenting new spec text, apply the template's sentence tests to your
  own text. Delete what the code, another spec or a sibling sentence already
  carries.
9. After creating or changing a spec, run the spec-review -skill, then report the
  spec is `proposed` and move on.

## Prose

Follow `docs/WRITING.md`, read before drafting. A spec is direct, strict and
technical.

## Recording the intent

The spec's context and architecture carry the why nothing else holds: the user or
system need the capability exists for. State no why the reader can derive.

An implementation carries behaviour, logic and contracts — what the system does,
never why. A why comes from a spec, an ADR, a plan or a human decision. Where the
only why on record is v20's, confirm it with the human before carrying it, because
v20 canonicalised its mistakes. Before settling the Context, interview the human
as the product owner: who is served first, what they get, and what wins when goals
collide. A why with no source remains a question to the human, not a sentence in
the spec.
