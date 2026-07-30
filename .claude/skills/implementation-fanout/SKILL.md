---
name: implementation-fanout
description: Split one already-planned Pelilauta implementation into the smallest independent work units and execute each with a Sonnet subagent, keeping planning, gates, and integration in the orchestrating context.
---

# Implementation Fanout

Claude-specific execution tactic. It is not part of the portable delivery flow;
`.agents/skills/` stays vendor-neutral and never depends on this skill. Skipping
it changes only speed, never what a slice must contain or prove.

Use it inside one delivery slice whose plan already exists, when implementation
decomposes into units that touch disjoint files. Do not use it to decide what to
build, to divide a slice into several merges, or when the work is small enough
that briefing costs more than doing.

## Work Units Are Not Delivery Slices

A delivery slice is one deployable merge with one observable production outcome.
A work unit is a subdivision of that slice's implementation. Units never become
separate merges, commits, pull requests, or revert units. The slice remains the
deployable and coherently reversible unit.

## Division Contract

A unit is valid only when all of the following hold:

- It owns an explicit, disjoint file set. Two units never write the same file.
- Its correctness is verifiable by a named deterministic check a subagent can
  run alone.
- It needs no result, decision, or intermediate state from a concurrent unit.
- Its brief is complete without the plan's surrounding context.

Work that fails any condition stays in the orchestrating context or runs as an
ordered step after the fanout. Serialize rather than invent independence.

## The Orchestrator Keeps

- Reading `AGENTS.md`, applicable specs, practices, and the branch lessons queue.
- Choosing the division and writing every brief.
- Every NEVER and ASK boundary: dependencies, Firebase schemas and rules, public
  URLs, authentication behavior, persisted data, release and deployment
  configuration, and compatibility exceptions.
- The v18 compatibility judgment behind any migrated surface, including the
  per-slice inventory in `docs/MIGRATION.md`.
- Reviewing every returned diff against the slice contract before trusting it.
- All staging, commits, pushes, pull requests, and integration via
  `delivery-slice`.

## Subagent Brief

Give each subagent, explicitly: its file set, the behavior contract to preserve,
the exact check command to run, the negative states to exercise, and the
relevant spec or practice excerpt. State that it must:

- Edit only its assigned files.
- Run its check and report real output, including failures.
- Stop and report rather than decide anything on an ASK boundary.
- Never commit, push, open a pull request, install a dependency, or hand-edit a
  generated source.
- Never widen its unit or clean up unrelated code.

## Procedure

1. Confirm the slice's production outcome and plan exist. If not, plan first.
2. Draft the division. Verify each unit against the Division Contract and
   confirm the file sets are disjoint.
3. Resolve any in-scope ASK boundary with the human owner before dispatching.
4. Dispatch the units concurrently as Sonnet subagents, one brief each.
5. Review every returned diff and check output yourself. Treat a claimed passing
   check as unverified until you have seen its real output.
6. Run the slice's full deterministic checks over the combined result. Unit
   checks do not substitute for the slice gate.
7. Execute the serialized remainder, then hand integration to `delivery-slice`.

## Report

Report the division and why each unit was independent, the work kept in the
orchestrator or serialized, checks run per unit and across the slice, any unit
result you rejected or redid, and work remaining.
