---
name: delivery-review
description: Adversarially review one proposed Pelilauta merge when it changes compatibility, factory, harness, architecture, deployment, licensing, or another release-significant boundary.
---

# Delivery Review

Review one delivery slice, not the lifetime diff of its feature branch. The
purpose is to challenge product and factory assumptions before they become a
dependency of `main`, not to prohibit delivery-enabling architecture or harness
work inside the slice.

Use a reviewer that did not author the implementation when practical. Review is
risk-scaled: a routine bounded consumer change needs a concise pass; a new
build path, source boundary, generator, compatibility exception, or test gate
needs an independent adversarial pass.

## Review Boundary

Establish the exact delta since the last slice from this branch delivered to
`main`. If the boundary is unclear, stop and ask rather than reviewing unrelated
historical branch work.

## Challenges

1. **Outcome:** does the delta produce the named observable outcome in the
   target application?
2. **Compatibility:** are v18 behavior claims supported by cited source,
   deployed evidence, an immutable upstream revision, or a human decision? Are
   departures explicit and approved?
3. **Factory coupling:** does every included factory, harness, or architecture
   change serve this outcome or make its evidence trustworthy? Flag unrelated
   cleanup and unsupported generalization, not required co-evolution.
4. **Verification reachability:** does every claimed check actually run through
   the stated command, hook, deploy gate, or named human step? Identify suites
   silently skipped by filters or `--if-present` behavior.
5. **Verification fidelity:** do checks exercise the production implementation
   and consumer context rather than copied logic, fixtures, or a surrogate?
6. **Negative states:** were actual missing, stale, empty, invalid, or optional
   states exercised where the contract depends on them?
7. **Generated and external sources:** can committed output drift from its
   sources? Are source ownership, licensing, optionality, and build behavior
   preserved?
8. **Migration context:** were relevant legacy element selectors, tests,
   imperative APIs, dynamic inputs, persisted values, and accessibility
   semantics considered for the migrated surface?
9. **Delivery record:** do the spec, plan, lessons, release note, and reported
   checks describe the implementation accurately?
10. **Merge coherence:** can the complete merge deploy and revert coherently?
    Do not demand that supporting changes be independently reverted from the
    feature that relies on them.

## Findings And Gate

Lead with findings ordered by severity and include file or artifact references.
Distinguish blockers, non-blocking risks, and record corrections. Record the
review and resulting human decisions in the active lessons file; avoid creating
a separate review artifact unless the evidence is too large to remain usable
there.

An unresolved blocker stops integration. Non-blocking findings are fixed,
accepted, deferred, or rejected by the human owner. A review finding is
evidence, not automatic permission to expand the slice.
