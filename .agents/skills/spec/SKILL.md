---
name: spec
description: Create or update a Pelilauta spec when a capability needs its why and what defined.
---

# Spec

Use this skill for approved product or design-system intent. Specs follow the
ASDLC.io Living Specs practice: a spec states the system's current state; a plan
states a change. The anatomy and the writing rules are `specs/TEMPLATE.md`.

## Procedure

1. Decide whether this needs a spec. A bug fix, a configuration change, a
   dependency bump or a one-off task does not get one. Say the decision in the
   approval request.
2. Read the sources: v20 for design intent, v18 for business behaviour that must
   keep working, and the parent specs.
3. Create or update `specs/<domain>/<capability>/spec.md` from the template. A
   design-system spec's subject is the package both applications consume; do not
   write a criterion that holds for only one of them.
4. Frontmatter is `status: draft | approved | deprecated`, nothing else. New and
   altered intent is `draft` until a human approves it — any edit to an approved
   spec returns it to `draft`.
5. Record an irreversible decision as an ADR in `docs/adrs/`, and link it.
6. Run the review gate, then ask for human approval. The request carries the
   Subtraction outcome in one line — what was cut, or that nothing could be.

## Review Gate

Before requesting `draft` → `approved`, a critic pass that has not just written
the text challenges the spec, not the code:

- **Ambiguity:** can two implementers read a requirement differently?
- **Testability:** can each Definition of Done criterion and Scenario be run
  against the product?
- **Edge cases:** states the intent implies and the text omits — empty, error,
  unknown input, both themes.
- **Compatibility:** claims about v18 or v20 that no reader can check.
  Appearance follows v20; a v18 look-alike claim is a defect.
- **Scope:** one capability, and nothing another spec already states.
- **Subtraction:** run last, line by line — the template's derivability test.

Unresolved findings go to the human with the approval request.

## Maintenance

Implementation findings update the spec in the same commit as the behaviour
change. A real intent ambiguity is reconciled with a human, not resolved by
trusting either prose or code.
