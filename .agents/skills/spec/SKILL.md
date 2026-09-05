---
name: spec
description: Create specs before implementation. Use when introducing a feature, making a significant change, or clarifying ambiguous requirements.
---

# Spec

A spec defines a feature's purpose and mechanics. It defines system operation and expected quality.

Specs follow ASDLC.io living specs practice and anchor features to expected states.

`specs/TEMPLATE.md` defines spec anatomy.

A design-system change is always governed by a spec. Pelilauta application work is not: where `specs/pelilauta/**` governs a feature, the same rule applies — amend when the work requires it and flag the change for the operator's clearance — but pelilauta work may proceed where no spec governs it yet.

## Procedure

1. Determine whether the task requires creating or amending a spec. Small changes inferable from the codebase and conforming to an existing spec require no spec change. State the decision explicitly when work proceeds without a spec change.
2. Existing specs, implementation, and documents of v20 provide the primary source for design-system behavior. They carry intent only where the human confirms it. When they carry nothing, or carry an implementation identified as faulty, intent comes from the human and the source search stops. An absent or broken feature is not a settled decision. A value repeated across versions represents duplicated data rather than independent corroboration.
3. Existing specs, implementation, and documents of v18 provide the primary source for application logic and features. When these conflict with v20 or current v21 design intent, request clarification.
4. Request clarification when v20 and v18 sources cannot establish the proposed spec.
5. Create or update `specs/<domain>/<capability>/spec.md`. Place sub-features in child directories as `specs/<domain>/<capability>/<sub-feature>/spec.md` and list them in the parent spec.
6. Encode document status in the frontmatter as `status: proposed | live | deprecated`. A `proposed` spec carries a new, material, or unsettled amendment the operator has not yet cleared; implement alongside it and flag the change for clearance in the delivery report, where the operator clears it to `live` or turns it back. For a minor, settled amendment to a live spec, show an unapplied diff and rationale in chat. Do not edit the file or change its status before the operator accepts the diff. Apply an accepted amendment while retaining `live`, then continue. A `live` spec portrays intended system operation. A spec kept for historical context or architectural reference is `deprecated`.
7. Record large-scale or irreversible decisions in an ADR under `docs/adrs/`.
8. Apply the template sentence tests to new spec text before presenting it. Delete text that code, another spec, or an adjacent sentence already carries.
9. After modifying a staged proposed spec, run the spec-review skill and flag the change for the operator's clearance in the delivery report; the work continues rather than stopping. An accepted inline amendment remains `live`.

## Prose

Follow `docs/WRITING.md`. A spec is direct, strict, and technical.

## Recording Intent

The Context and Architecture sections carry the purpose that no other artifact holds: the user or system need the capability satisfies. State no rationale that the reader can derive.

Source code carries behavior, logic, and contracts — what the system does, never why. Purpose comes from a spec, an ADR, a plan, or a human decision. When the only recorded purpose comes from v20, verify it with the human because v20 canonicalized mistakes. Before settling the Context, interview the human regarding product priorities: who is served first, what they receive, and which priority prevails during conflicts. A purpose with no recorded source remains a question for the human rather than a claim in the spec.
