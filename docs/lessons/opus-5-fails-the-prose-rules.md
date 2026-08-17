---
name: opus-5-fails-the-prose-rules
branch: feat/chrome
date: 2026-08-17
---

**Context:** the prose harness updates (docs/WRITING.md and the skills referencing it)
were made to keep agent-written prose inside the repository's rules.

**What happened:** the operator observes on 2026-08-17 that other agents and models now
behave after those updates, while Opus 5 still tends to fail them — with its
performance slightly up on the first 30–40% of its context window.

**Suspected why:** Opus 5 holds the prose rules early in a session and loses them as
its context fills, so the same harness that carries other models does not carry it.

**Fix:** add one line to `CLAUDE.local.md`'s Delegation section: do not give Opus 5
prose tasks, or give it only short ones that finish inside the early context window.
