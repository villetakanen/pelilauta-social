---
name: epic-plans-preplan-slices
branch: feat/ds-typography
date: 2026-07-30
---

**Context:** Epic plans under `plans/` carry a section that numbers, orders and
scopes pull requests before delivery starts.

**What happened:** `plans/typography.md` shipped six numbered slices with their
order and a PR-split prediction (`a964a18`, `31df5a1`); `plans/core-tokens.md` has
the same with two. The owner objected: tasks, stories and their interdependencies
belong upfront, but slices are a delivery-time decision. `AGENTS.md` already leans
that way and nobody noticed the plans arguing with it.

**Suspected why:** the plan format offers no home for stories or durable decisions,
so slice numbering got used as the container for both.

**Fix:** separate the words in the plan convention — a plan holds decisions,
stories and dependencies; a slice is what one PR delivers, chosen at delivery time.
`typography.md` is corrected in `dd3ac4a`; `core-tokens.md` still counts slices,
and whether to rewrite a record of delivered work is part of the same call.
Related: [[epic-plan-accretes-decision-prose]].
