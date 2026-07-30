---
name: shadow-epic-branch
branch: feat/ds-navigation
date: 2026-07-30
---

**Context:** Third recurrence. `50b41ab docs(lessons): log plans drifting into
agent work ledgers` recorded it; `1016ccb` consolidated it into
[[harness-artifact-altitude]] as a facet of artifact altitude, hours before it
recurred with material cost. It is not an altitude problem: that finding is
about artifacts filling with too much detail, this is about an artifact existing
at all because a branch did.

**What happened:** `feat/ds-foundations` was created 12:31 from `1016ccb`, the
tip of this branch, and PR #58 was opened with `feat/ds-navigation` as its base
— a feature branch stacked on a feature branch, which the delivery contract does
not provide for. It then acquired `plans/core-tokens.md` as its work ledger. The
owner deleted that file from this branch in `2eb3680` as swept in by
`git add -A`, but it survived on the shadow branch, where it recorded the state
of the token work.

Three costs landed within four hours, all in one session:

- The owner could not verify the token results, because the work and its ledger
  were on a branch invisible from the epic.
- An agent auditing the token layer rediscovered `--cn-grid` as an unresolved
  reference, reported it as a live product defect, and was wrong: the fix — a
  `units.css` definition and a `tokens.css` entry point — already existed on the
  shadow branch, with a header comment naming that exact defect.
- The two branches diverged on a file one of them deleted, so replaying the work
  now needs manual conflict resolution.

**Suspected why:** Branch first, ledger second. An illegitimate branch is still a
place, and a place accumulates a durable artifact; `plans/` is the only writable
surface with no stated lifetime, so the artifact lands there and becomes the only
record of that branch's state. Nothing in the harness objects: no gate checks a
PR's base, and no artifact declares which branch is the live epic — see
[[live-epic-not-observable]].

**Fix:** Introduce `docs/adrs/` so decisions stop needing a plan to live in, and
move the ones already stranded (default radius, design-system token ownership) —
both are currently recoverable only from a plan file or a branch that should not
exist. Overlaps the audit's missing-ADR finding.

An earlier version of this fix proposed a PR workflow check failing any pull
request whose base is not `main`. The owner rejected it: direct `feat/*` → `main`
integration is a beta shortcut, not the target model, and `main` should be
protected. Enforcing the current shortcut in CI would break as soon as a
dev/staging chain exists. `AGENTS.md` was trimmed to the push guard instead; see
[[harness-artifact-altitude]].
