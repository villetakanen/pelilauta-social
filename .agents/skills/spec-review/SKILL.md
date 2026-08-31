---
name: spec-review
description: Adversarially review one Pelilauta living spec as an independent critic. Use after the staged path creates or alters a `proposed` spec, or when asked whether a spec is precise, minimal and ready for implementation.
---

# Spec Review

Review the staged proposed spec, not its implementation. Report findings. Edit only when instructed.

## Independence

Use a critic that did not author the text. Give a delegated critic file paths and the mandate only, omitting summaries, author vocabulary, and decisions restated from chat. Settled decisions belong in the spec for the critic to test. When no independent critic is available, report `review incomplete`.

The author of the spec writes the brief, leaving brief characterizations untested until verified against sources. A brief supplying conclusions about reviewed text renders the review incomplete. Report the review as incomplete.

## Boundary

Review one named spec, or infer one altered `spec.md`. Request clarification when the target spec is ambiguous. Read the target spec's complete state and diff, `specs/TEMPLATE.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, and related specs. Check v20 design claims and v18 behaviour claims at source. Human decisions and live local specs override upstream intent. Existing code does not settle intent ambiguity.

## Review

Identify materially different outcomes the text permits and construct a verification plan from its Contract. Challenge:

- **Premise:** The Context section carries the user or system need the capability serves, defining the audience and deliverable without unsupported assumptions or unapproved solutions. A Context section that remains true when copied to a sibling capability carries no distinct information. A Context derivable from the implementation restates behaviour, not need.
- **Ambiguity:** Subjects, states, ranges, precedence, and terms permit exactly one observable interpretation.
- **Testability:** Contract outcomes and required verification methods state explicit criteria.
- **Guarantee:** Checks control inputs directly, while broader aspirations remain non-binding targets.
- **Edge cases:** The spec defines implied states that alter observable behaviour.
- **Compatibility:** Claims regarding v18, v20, and shared Firebase behavior cite inspectable evidence, and departures require approved decisions.
- **Scope:** The spec covers one capability's current state, omitting tasks, history, duplicated rules, and values defined by other capabilities.
- **Consistency:** The Blueprint, Contract, related specs, and recorded decisions agree.
- **Consequence:** Each requirement prevents a materially wrong choice. Implementation techniques belong in code, and shared rules belong in their defining specs.
- **Subtraction:** Execute subtraction last. Remove text derivable from authoritative artifacts using the template sentence tests.

## Report

Order findings as blockers, risks and record corrections, with exact references. State the wrong outcome or failed verification, evidence, and smallest question or correction needed. A blocker leaves intent missing, ambiguous, contradictory, unsupported or unverifiable.

Conclude the report with `ready for approval`, `not ready for approval`, or `review incomplete`, along with the subtraction outcome and unresolved approver questions. State explicitly when no findings exist.
