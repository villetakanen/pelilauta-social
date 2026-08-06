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
   altered intent is `draft` until the spec approver approves it — any edit to an
   approved spec returns it to `draft`.
5. Record an irreversible decision as an ADR in `docs/adrs/`, and link it.
6. Run the review gate, then ask the spec approver for approval. The request
   carries the Subtraction outcome in one line — what was cut, or that nothing
   could be.

## Delivery Boundary

A missing spec, or a substantive change that requires intent to be settled, is a
separate task. Approve it before implementation begins.

A minor clarification or correction to an existing spec may be part of its delivery
slice, including when a bug fix uncovers it. Write the amendment, run the review gate
and request approval mid-flight. Pause work that relies on the amendment until the
spec approver decides; do not defer the request to delivery review.

## Prose

Write in the register of a corporate design specification (Material Design's,
for example): dry, strict, technical.

- Declaratives and imperatives. State the fact or the requirement; no setup,
  no pleasantries, no personal pronouns.
- No aphorisms, no metaphor, no consequence-drama. A contrast ("X, not Y")
  appears only when Y is a mistake an implementer would actually make.
- Complete sentences in the template's sections; values in tables, behaviour
  in Gherkin.
- Density comes from the template's sentence test, not from fragmenting
  sentences.

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

Unresolved findings go to the spec approver with the approval request.

## Maintenance

Implementation findings update the spec in the same commit as the behaviour
change. A real intent ambiguity is reconciled with the spec approver, not resolved
by trusting either prose or code.
