---
name: spec
description: Create or update a concise Pelilauta intent spec when a feature or design-system capability needs its why and what defined before planning or implementation.
---

# Intent Spec

Use this skill for approved product or design-system intent. Do not use it for a
delivery plan, task list, implementation design, test log, or lessons record.

Specs follow the ASDLC.io Living Specs practice: an Intent half (why the
capability exists and what consumers rely on) and a Contract half (how anyone
verifies it). The required anatomy is `specs/TEMPLATE.md`; start new specs
from it.

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
5. Exclude framework choices, file layouts, task sequencing, command output,
   and implementation status. Put those in the linked plan.
6. Record compatibility intent and deliberate behavior changes without copying
   implementation details into the spec.
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
- **Testability:** does every Acceptance and Definition of Done item map to a
  deterministic check or a named human review step? Flag any that are vibes.
- **Edge cases:** missing states (empty, error, unknown input, both themes,
  hydration timing) that the intent implies but the text omits.
- **Compatibility:** claims about v18 or v20 behavior that no reader can check —
  no test, no link to the owning spec, no reachable upstream source. Appearance
  follows v20, so a v18 look-alike claim is a defect, not evidence.
- **Scope:** requirements that belong in the plan, and Non-Goals that a naive
  reading of the spec would still permit.
- **Subtraction:** run last. What can be deleted without losing a checkable
  claim? Every other axis asks whether the spec says enough; this one is the
  only counterweight.

Unresolved findings go to the human owner with the approval request; do not
silently drop them.

## Maintenance

Keep the spec small enough to guide decisions. If implementation discovers a
real intent ambiguity, reconcile the spec with the human owner rather than
silently treating either prose or code as automatically correct. When behavior
changes, update the spec in the same commit as the change. Deprecate contract
lines with strikethrough and a date instead of deleting them.
