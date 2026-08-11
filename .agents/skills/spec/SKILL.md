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
   write a criterion that holds for only one of them. The template is the model;
   a sibling spec is not. Its length, structure and habits are not evidence.
4. Frontmatter is `status: draft | approved | deprecated`, nothing else. A new
   spec starts `draft`. `approved` means a human has read the spec through and
   agrees with it, and no spec change is committed without that.
5. Ask the spec approver, and wait, before editing an approved spec. Name the
   file and state the change in one line; do not write the edit until they
   answer. The edit returns the spec to `draft`, and their acceptance returns it
   to `approved`.
6. Record an irreversible decision as an ADR in `docs/adrs/`, and link it.
7. Run the review gate for a new spec or substantially altered intent, then ask
   the spec approver for approval. The request carries the Subtraction outcome in
   one line — what was cut, or that nothing could be. A change small enough to
   state in the ask is approved in the ask, and needs no gate of its own.

## Delivery Boundary

A missing spec, or a substantive change that requires intent to be settled, is a
separate task. Approve it before implementation begins.

A minor clarification or correction to an existing spec may be part of its delivery
slice, including when a bug fix uncovers it. Ask, then write the amendment. Pause work
that relies on it until the spec approver decides; do not defer the request to
delivery review.

## Prose

Write in the register of a corporate design specification (Material Design's,
for example): dry, strict, technical.

- Declaratives and imperatives. State the fact or the requirement; no setup,
  no pleasantries, no personal pronouns.
- No aphorisms, no metaphor, no consequence-drama. A contrast ("X, not Y")
  appears only when Y is a mistake an implementer would actually make.
- Complete sentences in the template's sections; values in tables, behaviour
  in Gherkin.
- One fact per sentence. A `because`, `so that` or `not X` tail states the reason
  for a requirement, and the reason belongs in the commit message. Keep it only
  where the reason is itself the requirement.
- No sentence restates the one before it in other words.
- Density comes from the template's sentence test, not from fragmenting
  sentences.

## Review Gate

Before requesting `draft` → `approved`, a critic pass that has not just written
the text challenges the spec, not the code:

- **Ambiguity:** can two implementers read a requirement differently?
- **Testability:** can each Definition of Done criterion and Scenario be run
  against the product? A method — the fixture, artwork, viewport or scheme a check
  uses — belongs in Definition of Done. In Blueprint it is a check wearing intent's
  clothes.
- **Guarantee:** does a requirement promise an outcome over input the capability
  does not control? State it as the target the implementation is tuned to, and put
  the measurable case in Definition of Done.
- **Edge cases:** states the intent implies and the text omits — empty, error,
  unknown input, both themes.
- **Compatibility:** claims about v18 or v20 that no reader can check.
  Appearance follows v20; a v18 look-alike claim is a defect.
- **Scope:** one capability, and nothing another spec already states.
- **Consequence:** line by line, ask of every requirement — *could a competent
  agent, working only from this spec, make a choice that would be wrong in a way a
  reviewer would notice across components?* If no choice it permits is wrong, the
  line states a technique and belongs in a code comment. If a wrong choice would
  show up in more than this capability, the line is another capability's role, and
  this spec names the role rather than its value. What survives is the intent.
- **Subtraction:** run last, line by line — the template's derivability test.

Every gate above Subtraction adds text. Apply their findings, then run Subtraction
over the result: a spec that leaves the gate longer than it entered has usually
failed it.

Unresolved findings go to the spec approver with the approval request.

## Maintenance

An implementation finding is raised with the spec approver before it is written, and
lands in the same commit as the behaviour it describes. A real intent ambiguity is
reconciled with the spec approver, not resolved by trusting either prose or code.
