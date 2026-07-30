---
name: delivery-slice
description: Prepare, verify, commit, push, and open a reviewable Pelilauta delivery slice from a feature branch that may continue across multiple merges.
---

# Delivery Slice

Use this skill for one proposed merge to `main`. A feature branch is a
continuous context and may deliver several slices before it closes; it is not
itself the review, release, or revert unit.

## Slice Contract

- Name one observable production outcome in a target application.
- Include the factory, harness, and architecture evolution that the outcome
  first makes concretely necessary and verifies.
- For an explicitly human-approved, timeboxed consumer-free slice, name the
  concrete factory or harness outcome, its bounded need, stop condition, and
  separate integration decision instead of inventing an application outcome.
- Keep unsupported generalization, unrelated cleanup, and additional migration
  steps out of the slice.
- Treat the complete merge as the deployable and coherently reversible unit.
  Supporting changes do not need artificial independence from the production
  behavior that relies on them.

## Procedure

1. Read `AGENTS.md`, applicable specs and practices, the plan for this slice when
   one exists, and the branch lessons queue when one exists.
2. Establish the slice baseline. Review the delta since the last commit from
   this branch delivered to `main`, not the branch's entire historical work.
   If that boundary is ambiguous, establish it with the human owner before
   preparing integration.
3. State the production outcome, compatibility assumptions, decisions needed
   from the human owner, and stop condition. For an approved consumer-free
   exception, state the concrete factory/harness outcome, approval, timebox, and
   boundary. Identify why every included change is required.
4. Implement the smallest complete slice. Add to lessons only when evidence
   suggests a reusable change worth assessing; check output stays in its
   runner or PR rather than being copied into plans or lessons. Do not modify
   unrelated work already present in the worktree.
5. Run the smallest applicable deterministic checks while implementing. The
   pull-request workflow owns broad repository verification through
   `pnpm verify`; do not manually duplicate that gate after changes which
   cannot affect its result. Confirm that every claimed targeted check invokes
   and exercises the real changed path.
6. Exercise concrete negative states named by the slice, such as an absent
   optional source, stale generated registry, unknown input, or missing asset.
   Do not infer failure behavior from source syntax.
7. Use the `delivery-review` skill only when the human owner explicitly requests
   an implementation review. This does not alter the separate mandatory
   adversarial review for intent specs.
8. Before committing, inspect status, the complete slice diff, and recent
   commits. Stage only intended files. Keep commits coherent and reviewable;
   dependent feature and factory changes may revert together with the slice.
9. Commit, push, and open or update a pull request when requested. Then stop for
   the human owner's review. Preparing or opening a pull request never
   authorizes its merge; merge only on an explicit merge instruction. Never
   bypass a failing gate. Use Conventional Commits and do not rewrite published
   history without explicit approval.
10. Before integration, resolve lesson candidates that affect the slice's
    correctness. Apply required accepted changes in the same merge. Optional
    candidates do not block delivery; assess, defer with a concrete trigger, or
    discard them. Keep PR identity, checks, carry-forwards, and remaining work
    in the PR or active plan, not lessons.
11. Do not infer a named release from an integrated slice or closed branch. Use
    the `release` skill only after an explicit release request and exact version.

## Report

Report the changed behavior, available pull request, included factory or
architecture evolution, compatibility assumptions, targeted checks actually
run, and known risks. Identify user-visible contexts changed by the slice
without administering or recording the human owner's review.
