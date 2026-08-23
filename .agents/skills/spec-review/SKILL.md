---
name: spec-review
description: Adversarially review one Pelilauta living spec as an independent critic. Use after a spec is created or altered while it is `proposed`, or when asked whether a spec is precise, minimal and ready for implementation.
---

# Spec Review

Review the proposed spec, not its implementation. Report findings; edit only when
asked.

## Independence

Use a critic that did not author the text. Give a delegated critic file paths and the
mandate only — no summary, no author vocabulary, no decisions restated from chat.
Anything settled belongs in the spec, where the critic can test it. If none is
available, report `review incomplete`.

As the critic: the brief is authored by the spec's author, so every characterization
of the spec in it is untested — test it against the sources. A brief that supplies
conclusions about the text under review makes the review incomplete; report it so.

## Boundary

Review one named spec, or infer one altered `spec.md`. Ask when ambiguous. Read its
complete state and diff, `specs/TEMPLATE.md`, `docs/DESIGN.md`,
`docs/ARCHITECTURE.md`, and related specs. Check v20 design claims and v18 behaviour
claims at source. Human decisions and live local specs override upstream intent;
current code does not settle intent ambiguity.

## Review

Identify materially different outcomes the text permits and construct a verification
plan from its Contract. Challenge:

- **Premise:** Context carries the need the capability serves — who is served and
  what they get — settled, without unsupported assumptions or an unapproved
  solution. A Context that could be pasted onto a sibling capability without
  becoming false carries nothing. A Context derivable from the implementation
  restates behaviour, not need.
- **Ambiguity:** subjects, states, ranges, precedence and terms permit one observable
  interpretation.
- **Testability:** Contract outcomes and required checking methods are explicit.
- **Guarantee:** checks control their inputs; wider aims remain targets.
- **Edge cases:** implied states that alter observable behaviour are covered.
- **Compatibility:** v18, v20 and shared-Firebase claims have inspectable evidence;
  departures are approved.
- **Scope:** one capability's current state, without tasks, history, duplicated rules
  or another capability's values.
- **Consistency:** Blueprint, Contract, related specs and decisions agree.
- **Consequence:** each requirement prevents a materially wrong choice. Techniques
  belong in code; shared rules belong with their defining spec.
- **Subtraction:** run last. Remove text derivable from authoritative artifacts using
  the template's sentence tests.

## Report

Order findings as blockers, risks and record corrections, with exact references.
State the wrong outcome or failed verification, evidence, and smallest question or
correction needed. A blocker leaves intent missing, ambiguous, contradictory,
unsupported or unverifiable.

End with `ready for approval`, `not ready for approval`, or `review incomplete`, the
Subtraction outcome, and unresolved approver questions. Say when no findings exist.
