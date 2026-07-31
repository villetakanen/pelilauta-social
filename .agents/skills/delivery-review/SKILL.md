---
name: delivery-review
description: Use only when the human owner explicitly requests an adversarial implementation review of one proposed Pelilauta merge.
---

# Delivery Review

This skill is not an automatic delivery gate and does not replace the human
owner's PR review. Use it only on explicit request. The mandatory separate
adversarial review of a spec is owned by the `spec` skill and is
unaffected by this boundary.

Review one delivery slice, not the lifetime diff of its feature branch. The
purpose is to challenge product and factory assumptions before they become a
dependency of `main`, not to prohibit delivery-enabling architecture or harness
work inside the slice.

When requested, use a reviewer that did not author the implementation when
practical and scale the review to the named concern.

## Review Boundary

Establish the exact delta since the last slice from this branch delivered to
`main`. If the boundary is unclear, stop and ask rather than reviewing unrelated
historical branch work.

For an explicitly approved, timeboxed consumer-free slice, review the named
factory or harness outcome and stop condition directly; do not require a
fictional application outcome.

## Challenges

1. **Outcome:** does the delta produce the named application outcome, or the
   approved bounded factory/harness outcome for a consumer-free exception?
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
9. **Delivery record:** do the spec, plan, PR or release note, and reported
   checks describe the implementation accurately?
10. **Merge coherence:** can the complete merge deploy and revert coherently?
    Do not demand that supporting changes be independently reverted from the
    feature that relies on them.

## Findings And Gate

Lead with findings ordered by severity and include file or artifact references.
Distinguish blockers, non-blocking risks, and record corrections. Keep review
findings and resulting human decisions in the PR, reviewed spec, or owning plan.
Add only a reusable process or architecture candidate to the lessons queue.

An unresolved blocker stops integration. Non-blocking findings are fixed,
accepted, deferred, or rejected by the human owner. A review finding is
evidence, not automatic permission to expand the slice.
