---
name: delivery-slice
description: Prepare, verify, commit, push, and integrate one deployable Pelilauta delivery slice from a feature branch that may continue across multiple merges.
---

# Delivery Slice

Use this skill for one proposed merge to `main`. A feature branch is a
continuous context and may deliver several slices before it closes; it is not
itself the review, release, or revert unit.

## Slice Contract

- Name one observable production outcome in a target application.
- Include the factory, harness, and architecture evolution that the outcome
  first makes concretely necessary and verifies.
- Keep unsupported generalization, unrelated cleanup, and additional migration
  steps out of the slice.
- Treat the complete merge as the deployable and coherently reversible unit.
  Supporting changes do not need artificial independence from the production
  behavior that relies on them.

## Procedure

1. Read `AGENTS.md`, the active branch lessons, applicable specs and practices,
   and the plan for this slice when one exists.
2. Establish the slice baseline. Review the delta since the last commit from
   this branch delivered to `main`, not the branch's entire historical work.
   If that boundary is ambiguous, establish it with the human owner before
   preparing integration.
3. State the production outcome, compatibility assumptions, applicable human
   gates, and stop condition. Identify any factory, harness, or architecture
   changes and state why the outcome or trustworthy verification requires each
   one.
4. Implement the smallest complete slice. Update active lessons immediately
   when evidence, assumptions, or decisions change. Do not modify unrelated
   work already present in the worktree.
5. Run the smallest applicable deterministic checks after each coherent
   change. Confirm that every claimed check is invoked, exercises the real
   changed path, and reports failure; the existence of a test script is not
   evidence that a gate runs it.
6. Exercise concrete negative states named by the slice, such as an absent
   optional source, stale generated registry, unknown input, or missing asset.
   Do not infer failure behavior from source syntax.
7. Use the `delivery-review` skill before integration when the slice changes a
   compatibility contract, factory, harness, architecture, deployment path,
   licensing boundary, generated-source pipeline, or other release-significant
   assumption. Resolve blockers and take non-blocking decisions to the human
   owner.
8. Before committing, inspect status, the complete slice diff, and recent
   commits. Stage only intended files. Keep commits coherent and reviewable;
   dependent feature and factory changes may revert together with the slice.
9. Commit, push, open or update a pull request, and merge only when explicitly
   requested or approved. Never bypass a failing gate. Use Conventional
   Commits and do not rewrite published history without explicit approval.
10. Before integration, record the pull request and source-head identity,
    checks, human evidence, accepted carry-forwards, and expected remaining
    branch work in the active lessons file. After integration, reconcile the
    merge identity during the next slice or branch close when another integrated
    change exists; do not create a documentation-only merge solely so a merge
    can name itself. Keep the lessons active when more slices remain.
11. If the integrated slice is an approved named release, hand off versioning,
    production verification, and tagging to the `release` skill.

## Report

Report the production outcome, available integration identity, included factory and
architecture evolution, compatibility assumptions, checks actually run, gate
coverage, negative-state evidence, human acceptance still required, and work
remaining on the branch.
