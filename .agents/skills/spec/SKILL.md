---
name: spec
description: Create or update a concise Pelilauta intent spec when a feature or design-system capability needs its why and what defined before planning or implementation.
---

# Intent Spec

Use this skill for durable product or design-system intent. Do not use it for a
delivery plan, task list, implementation design, test log, or lessons record.

Specs follow the ASDLC.io Living Specs practice: an Intent half (why the
capability exists and what consumers rely on) and a Contract half (how anyone
verifies it). The required anatomy is `specs/TEMPLATE.md`; start new specs
from it.

## Procedure

1. Read the active branch file under `docs/lessons/`, the relevant v18 behavior,
   approved product direction, and existing parent specs.
2. Update the active lessons file whenever spec work establishes a new source,
   ambiguity, failed assumption, or human decision.
3. Create or update `specs/<domain>/<capability>/spec.md` from
   `specs/TEMPLATE.md`. Design-system work normally uses
   `specs/design-system/<capability>/spec.md`.
4. Add frontmatter status: `draft`, `approved`, or `deprecated`. New intent is
   `draft` until a human approves it.
5. Record provenance in frontmatter: the v18 sources, immutable upstream
   commits, parent specs, or human decisions the spec's claims rest on. A spec
   without provenance is an opinion, not evidence.
6. State why the capability exists, what users and consumers can rely on, its
   goals, principles, boundaries, and observable acceptance.
7. Exclude framework choices, file layouts, task sequencing, command output,
   and implementation status. Put those in the linked plan.
8. Record compatibility intent and deliberate behavior changes without copying
   implementation details into the spec.
9. Anchor, don't model: a spec promises only what its capability owns. Values
   owned elsewhere — design tokens, parent specs, upstream contracts — are
   referenced as their owner's decision, with observed values recorded in
   provenance as evidence, never restated in the body as this spec's promise.
10. Run the adversarial review below, resolve or explicitly accept each finding,
   then ask for human approval before changing status to `approved`.

## Adversarial Review Gate

Before requesting `draft` → `approved`, a reviewer (a separate agent session or
a deliberate critic pass that has not just written the text) challenges the
spec — not the code — and records the outcome in the active lessons file:

- **Ambiguity:** can two reasonable implementers read a requirement
  differently? Name the sentence.
- **Testability:** does every Acceptance and Definition of Done item map to a
  deterministic check or a named human review step? Flag any that are vibes.
- **Edge cases:** missing states (empty, error, unknown input, both themes,
  hydration timing) that the intent implies but the text omits.
- **Compatibility:** claims about v18 behavior that are asserted but not
  backed by the provenance list.
- **Scope:** requirements that belong in the plan, and Non-Goals that a naive
  reading of the spec would still permit.

Unresolved findings go to the human owner with the approval request; do not
silently drop them.

## Maintenance

Keep the spec small enough to guide decisions. If implementation discovers a
real intent ambiguity, reconcile the spec with the human owner rather than
silently treating either prose or code as automatically correct. When behavior
changes, update the spec in the same commit as the change. Deprecate contract
lines with strikethrough and a date instead of deleting them.
