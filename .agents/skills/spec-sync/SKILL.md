---
name: spec-sync
description: Reconcile a changeset with its governing spec — after implementation, before pushing or requesting review. Amends the Blueprint with what implementation taught; reports Contract divergence to the human. Prefer running it as a subagent.
---

# Spec Sync

Read the changeset and the spec that governs the changed capability. Answer one
question: what did this implementation teach that the spec must now carry?

## Scope

- One changeset, one governing spec. When no spec governs the change, say so and
  stop.
- **Blueprint: amend.** A discovered dependency direction, a structural choice no
  single file reveals, a constraint that turned out to bind — write it into the
  spec in this changeset. Follow `docs/WRITING.md` and the template's sentence
  tests.
- **Contract: report, never edit.** Where the implementation diverges from a
  promise, state whether the code or the contract looks wrong, and stop for the
  human's decision.
- Do not change the spec's status; the pull request's approval approves a
  Blueprint diff.

## Procedure

1. List the changed files and name the governing spec.
2. Diff the implemented behaviour against the Blueprint; amend it with what the
   work revealed.
3. Diff the implemented behaviour against the Contract; flag divergences.
4. Report: amendments made, divergences flagged, or that spec and implementation
   agree.

Run before the changeset is pushed or a review is requested.
