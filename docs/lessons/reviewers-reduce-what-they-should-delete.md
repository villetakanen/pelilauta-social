---
name: reviewers-reduce-what-they-should-delete
branch: feat/deprecate-cyan-and-qol
date: 2026-08-24
---

**Context:** technical-writer judged prose sentence by sentence, so comment blocks
whose defects live above the sentence — restatement across neighbours, a register
that belongs to specs — survived review reduced but standing. Commit `0d003d4b`
added a block-level delete-test as the skill's step 2.

**What happened:** run on `NotificationItem.svelte` immediately after, the skill
deleted a JSDoc line and satisfied every word-list grep, yet the row comment now at
`NotificationItem.svelte:94-98` kept "The row: an icon, the message, and the one
action the row's read state offers" — a restatement of the markup the delete-test
exists to remove — and the hotfix comment kept a first sentence its second sentence
restates. The executor rewrote the blocks it was instructed to delete-test.

**Suspected why:** the skill's "cut and correct; never change meaning" reads as a
license to keep a reduced block, so reduction presents itself as the safe verdict at
every level the test moves to.

**Fix:** one sentence appended to step 2 of
`.agents/skills/technical-writer/SKILL.md`: "A block that fails the test is deleted,
not reduced; reduction is not a verdict."
