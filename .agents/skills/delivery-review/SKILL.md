---
name: delivery-review
description: Use only on an explicit request for an adversarial implementation review of one proposed Pelilauta merge.
---

# Delivery Review

This skill is not an automatic delivery gate and does not replace the merge
approver's PR review. Use it only on explicit request. The mandatory separate
adversarial review of a spec is the `spec` skill's review gate and is
unaffected by this boundary.

Review one pull request, not the lifetime diff of its feature branch. The purpose
is to challenge assumptions before they become a dependency of `main`, not to
prohibit supporting work the change needs.

When requested, use a reviewer that did not author the implementation when
practical and scale the review to the named concern.

## Review Boundary

Establish the exact delta this pull request proposes. If the boundary is unclear,
stop and ask rather than reviewing unrelated historical branch work.

Plans are working scaffolding for an active epic. They may help establish the
claimed outcome, but their status, reconciliation and eventual deletion are not
integration evidence or delivery findings.

A request for a release assessment is downstream of acceptance testing this skill
does not perform. Do not audit, infer or report human acceptance unless the request
asks for an acceptance checklist or the delivery record falsely claims an automated
check performed it.

## Challenges

1. **Outcome:** does the delta deliver the tangible thing it claims, in
   `apps/pelilauta` or `apps/design`?
2. **Compatibility:** are v18 behavior claims supported by cited source,
   deployed evidence, an immutable upstream revision, or a human decision? Are
   departures explicit and approved? Read an approved decision by its named
   capability, affected population and accepted consequences, not as an exhaustive
   inventory of files or fields. A discovered implementation detail is covered when
   it does not widen those boundaries.
3. **Coupling:** does every included change serve this outcome or make its
   evidence trustworthy? Flag unrelated cleanup and speculative generalization,
   not the supporting work the change needs.
4. **Verification reachability:** does every claimed check actually run through
   the stated command, hook or deploy gate? Identify suites
   silently skipped by filters or `--if-present` behavior.
5. **Verification fidelity:** do checks exercise the production implementation
   and consumer context rather than copied logic, fixtures, or a surrogate?
6. **Negative states:** were actual missing, stale, empty, invalid, or optional
   states exercised where the contract depends on them?
7. **Generated and external sources:** can committed output drift from its
   sources? Are source provenance, licensing, optionality, and build behavior
   preserved?
8. **Migration context:** were relevant legacy element selectors, tests,
   imperative APIs, dynamic inputs, persisted values, and accessibility
   semantics considered for the migrated surface?
9. **Placement:** does each change sit in the file its spec assigns the concern
   to, or in whichever file currently wins the cascade? A rule added where it
   already loses, or edited where it already wins, passes every visual check and
   leaves the behaviour in the file the spec excludes.
10. **Record:** do the spec, PR and reported checks describe the implementation
    accurately enough to operate, revert and extend it? Do not report incidental
    summary-count drift.
11. **Merge coherence:** can the complete merge deploy and revert coherently?
    Do not demand that supporting changes be independently reverted from the
    feature that relies on them.

## Findings And Gate

Lead with findings ordered by severity and include file or artifact references.
Distinguish blockers, non-blocking risks, and record corrections. Add only a reusable
process or architecture candidate to the lessons queue.

A blocker is a defect in the proposed delta that makes its claimed outcome false,
unsafe, undeployable or incoherent to revert. An unresolved blocker stops
integration. Stale scaffolding, state that exists outside the record, and work
authorised for a later delta are not blockers. Non-blocking findings are fixed,
accepted, deferred, or rejected by the merge approver. A review finding is
evidence, not automatic permission to expand the pull request.
