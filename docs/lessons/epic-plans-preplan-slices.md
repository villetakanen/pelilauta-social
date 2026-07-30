---
name: epic-plans-preplan-slices
branch: feat/ds-typography
date: 2026-07-30
---

**Context:** Epic-level plans under `plans/` carry a `## Slices` section that
numbers, orders and scopes pull requests before any delivery has started.

**What happened:** `plans/typography.md` was written with six numbered slices,
their sequencing, their dependencies and a prediction of how many PRs slice 4
would split into (`a964a18`, `31df5a1`). `plans/core-tokens.md`, salvaged onto the
same branch, has the same section with two. The owner objected that a slice is a
delivery-time decision, not an upfront one. `AGENTS.md` already points the same
way — it asks each loop to start from one observable production outcome and warns
against expanding prerequisite PBIs — so the plans were arguing against the
contract without anyone noticing.

**Suspected why:** the plan format offers no home for stories or durable
decisions, so slice numbering gets used as the container for both.

**Fix:** separate the two words in the plan convention. An epic plan holds
approved product decisions, its **stories**, and the interdependencies between
them — the owner named Foundations a story and it is one. A **slice** is what one
pull request delivers, chosen at delivery time, and it may cut across stories or
take part of one. So rename the section to `## Stories`, keep the dependencies,
and drop the ordering and PR-count predictions from both plans.
