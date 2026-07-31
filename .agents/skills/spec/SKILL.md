---
name: spec
description: Create or update a Pelilauta spec when a capability needs its why and what defined.
---

# Spec

Use this skill for approved product or design-system intent.

Specs follow the ASDLC.io Living Specs practice, adapted here. The required
anatomy is `specs/TEMPLATE.md`; start new specs from it.

## Procedure

1. Read the relevant v18 behavior, approved product direction, and existing
   parent specs.
2. Create or update `specs/<domain>/<capability>/spec.md` from
   `specs/TEMPLATE.md`. Design-system work normally uses
   `specs/design-system/<capability>/spec.md`.
3. Add frontmatter status: `draft`, `approved`, or `deprecated`. New intent is
   `draft` until a human approves it. That is the whole frontmatter.
4. State why the capability exists, what users and consumers can rely on, its
   goals, principles, boundaries, and observable acceptance.
5. Examples illustrate intent; the current code is the reference for
   implementation.
6. Record compatibility intent and deliberate behavior changes.
7. Anchor, don't model: a spec promises only what its capability owns. Values
   owned elsewhere — design tokens, parent specs, upstream contracts — are
   referenced as their owner's decision by linking that owner, never restated in
   the body as this spec's promise.
8. Record an irreversible decision as an ADR in `docs/adrs/`, and link it. A
   decision is not spec content.
9. Run the adversarial review below, resolve or explicitly accept each finding,
   then ask for human approval before changing status to `approved`.

## Adversarial Review Gate

Before requesting `draft` → `approved`, a reviewer (a separate agent session or
a deliberate critic pass that has not just written the text) challenges the
spec — not the code — and records the outcome in the spec review or PR:

- **Ambiguity:** can two reasonable implementers read a requirement
  differently? Name the sentence.
- **Testability:** can a human confirm each Acceptance criterion by using the
  product? Flag any that are vibes.
- **Edge cases:** missing states (empty, error, unknown input, both themes,
  hydration timing) that the intent implies but the text omits.
- **Compatibility:** claims about v18 or v20 behavior that no reader can check —
  no test, no link to the owning spec, no reachable upstream source. Appearance
  follows v20, so a v18 look-alike claim is a defect, not evidence.
- **Scope:** is the spec about one capability, and is anything in it owned by
  another spec?
- **Subtraction:** run last. What can be deleted without losing a checkable
  claim? Every other axis asks whether the spec says enough; this one is the
  only counterweight.

Unresolved findings go to the human owner with the approval request; do not
silently drop them.

## Maintenance

Keep the spec small enough to guide decisions. If implementation discovers a
real intent ambiguity, reconcile the spec with the human owner rather than
silently treating either prose or code as automatically correct. When behavior
changes, update the spec in the same commit as the change.
