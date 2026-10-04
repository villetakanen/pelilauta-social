---
name: one-slice-per-decision-not-per-file
branch: feat/21-1
date: 2026-10-04
---

**Context:** #165 was delivered as serial slices, one Sonnet implementer each, after the earlier pass was reverted whole. Five slices landed over two days (fabfc599, f0e11aa2, 8f417298, dd85ac0c, slice 5).

**What happened:** Three slices changed shape after the operator saw the previous one land: slice 3 (reaction gate) raised the question of anonymous love counts; slice 4 was rebriefed twice before the profile route became the reader; slice 6 (a server-decided static branch) only appeared when the session cookie turned up while explaining slice 2. Slices 1 and 5 carried no such decision and still cost a brief, a run, two reads and a commit each. The operator asked whether the pieces were too small and whether slices 1-8 could have run in parallel. They could not: six of eight slices edit `ReplyArticle.svelte` or `DiscussionApp.astro`, each is defined against the state the previous one left, and all e2e runs share one dev server and one fixture reset.

**Suspected why:** The slicing followed files and behaviours; the operator's attention is spent per decision, not per file.

**Fix:** In `next-task` or `first-mate`, one sentence: a slice bundles all work whose design is settled and whose files overlap, and splits only where a question for the operator sits inside it.
