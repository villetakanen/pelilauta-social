# AGENTS.md Rewrite

Status: In progress 2026-07-31 — rules 1–15 decided, 16 onward open
Branch: `feat/ds-typography`

## Why

The owner read the file end to end and could not follow it. Six concrete defects:
rules governing artefacts that do not exist (`PBI`), rules that exclude nothing
(rule 10), a rule that reads as *do not check your work* (rule 15), a `NEVER`/`ASK`
taxonomy where three of four `NEVER`s are "…without approval", one subject stated
twice in different words, and three names for v18.

The mechanism is visible in the log: `fix(agents): clarify dependency update
approval`, `docs(agents): dependency versions are not part of the v18 contract`,
`fix(agents): remove mandatory lesson destinations`. Each incident appends a
sentence at the granularity of that incident, in that incident's vocabulary, and
nothing consolidates. The file is a changelog of corrections written in the present
tense of rules.

So the rewrite's own rule: **a correction edits or replaces an existing sentence.
It never appends a new one.**

## Decided

Numbering follows the 32-statement inventory of the file as it stood at `2c412f9`.

| # | Was | Now |
| --- | --- | --- |
| 1 | Project line | Keep as-is |
| 2 | Goal: v20 design on v18 logic | Keep as-is |
| 3 + 5 | "Every release is a drop-in replacement", stated twice | One sentence: `v21 will run on its own host, sharing Firestore, Storage and Auth with live v18. What they share is a contract.` The old wording made every beta carry a claim betas do not carry, which the owner reads as a source of errors. "What v21 shows is not" cut — rule 2 says it positively |
| 4 | Workspace tree | Keeps the directories, carries ownership in its comments, gains `plans/debt`, drops "epic level PBIs" for "epic scope" |
| 6 | 100 words on dependency versions | `Dependencies may be updated or added, majors included — ask before merging one. The versions inherited from v18 are dated, so treat a build or CI failure as a stale dependency until proven otherwise, rather than hacking around it.` |
| 7 | Small PRs, one topic, revert a merge | Cut. "Small" is unenforceable, "one topic" is false under one long-living branch, and rollback is the `release` skill's |
| 8 + 14 | Never push `main`; agents stop; owner merges | `A merge to main during the beta cycle is a release: it deploys and CI tags it. Only on your request or approval.` Beta-scoped deliberately: after beta the model becomes merge-to-dev with a manual release. Direct pushes are already blocked by the `pr-to-main` ruleset |
| 9 | Every PR bumps the beta version | `Every pull request bumps the root beta version — pnpm version prerelease --preid=beta. The root package.json carries the release version; nested app versions keep their own meaning. No approval needed.` Stays in the PR so the version is in the diff. The "not a decision" caveat moves here from rule 27 |
| 10 | A PR delivers something tangible | Cut from the contract, moved to `delivery-review` challenge 1: does the delta deliver what it claims, and is that worth a release? If it delivers nothing of value, ask rather than review |
| 11 | Supporting changes ride along | `Fix what the work touches, and defects it uncovers inside the same epic. Unrelated cleanup and speculative generalization stay out. Refusing a fix is a decision, not a default.` |
| 12 + 29 | Migrate one surface, replace Lit with Svelte; read `MIGRATION.md` | `Replace Cyan one surface at a time. Most of it is CSS — tokens, resets, element styles, utilities — and the rest is Lit components. Check what v20 already built before writing anything; docs/MIGRATION.md owns the mechanics.` The old rule described only components, which is the smaller half of Cyan and none of this epic's work |
| 13 | Specs, ADRs, and the PBI sentence | Cut entirely. The tree answers it better. `PBI` is a fossil of the 21 GitHub issues from 2026-07-18 that `docs/lessons/over-planning.md` names as the failure; `#21` and `#25` are still open and should be closed |
| 15 | Targeted checks; do not repeat `pnpm verify` | Cut. The owner reads it as the source of most delays, and today's push failure was a test that broke two commits earlier |
| 17–19 | Three ownership bullets | Cut. The owner could not tell what they meant; the tree names the directories |

Also decided, outside the inventory: `docs/lessons/` widens from harness notes to
anything we might act on later, ADR seeds included. The invariants that prevent it
becoming a work queue — nothing depends on a note, anyone may delete one — do not
depend on its subject.

## Open

Rules 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32.

Two structural questions the remaining pass has to settle:

- `NEVER` and `ASK` collapse into one list, because three of four `NEVER`s are
  "…without approval", which is what `ASK` means.
- Rules 23, 26 and 28 are one workflow in three entries: establish v18 behaviour,
  ask when it cannot be established, write the spec before changing the surface.

## Not this work

A skill for establishing a surface from its v18 and v20 implementations before
specifying it — noted in `docs/lessons/no-skill-for-reversing-a-feature.md`.
