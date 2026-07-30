---
name: live-epic-not-observable
branch: feat/ds-navigation
date: 2026-07-30
---

**Context:** `AGENTS.md` states that a feature branch is a continuous context
delivering several slices to `main` before it closes, and `feat/cn-icon`
demonstrates it — PRs #53 and #56 from one branch.

**What happened:** Despite having read and quoted that passage, I concluded twice
in one session that `feat/ds-navigation` was finished because PR #57 had merged,
and built two rounds of analysis on it: first that the branch predated the token
work, then that the work had been done on dead code. A stored agent memory
naming `feat/ds-foundations` as the epic branch reinforced the error rather than
correcting it — see [[shadow-epic-branch]].

**Suspected why:** The rule was in required context and was not applied, the same
shape as [[check-upgradability-before-workaround]] and
[[narrow-criticism-sweeping-rewrite]]: the rule is stated abstractly and the
trigger is a concrete observation that does not resemble it. `git log` answers
"did this merge" but not "is this epic open"; merged-and-continuing and
merged-and-closed are indistinguishable from the branch alone. The one artifact
that would disambiguate — a closing commit like `chore(factory): close the icon
branch` — is only recognisable after the fact.

**Fix:** Make the live epic observable rather than inferred. The cheapest form is
a line in `AGENTS.md` naming the current epic branch, updated when one closes, so
an agent reads it instead of deducing it from merge state. The failing inference
to name explicitly: a merged PR does not close its branch.
