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
- Follow the amendment procedure in `AGENTS.md`. A Blueprint amendment can alter
  an architectural decision; its section does not establish operator clearance.

## Amendment clearance

For a minor, settled amendment to a live spec, show the exact unapplied diff and
rationale in chat. After operator acceptance, apply that diff and retain `live`.
Use clearance already given for the exact amendment; do not request it again.
A delegated sync returns the diff to the coordinating agent for that exchange.

For a material or unsettled amendment, record the change as `proposed`, follow
the `spec` skill's review procedure, and continue the task. Flag the amendment for
operator clearance at review. Spec status does not suspend independent work or
replace the separate approval requirements under `Judgment Boundaries`.

Preserve the existing status when an edit changes wording without changing meaning.
Contract divergence still requires the human decision described above.

## Procedure

1. List the changed files and name the governing spec.
2. Diff the implemented behaviour against the Blueprint; route amendments through
   the clearance procedure above before applying them.
3. Diff the implemented behaviour against the Contract; flag divergences.
4. Report amendments applied, exact diffs awaiting inline clearance, proposed
   amendments awaiting review, and Contract divergences. If none exist, report
   that spec and implementation agree.

Run before the changeset is pushed or a review is requested.
