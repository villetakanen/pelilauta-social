---
name: model-selection-guidance-was-reportedly-ignored
branch: feat/21-1
date: 2026-10-02
---

**Context:** The #165 audit initially considered changing mandatory delegation to reduce execution overhead.

**What happened:** The operator reported that the Claude Code/Opus 5.5 run ignored subagent model-selection instructions already present in `.agents/skills/first-mate/SKILL.md:8` and `CLAUDE.local.md:7`. The audit did not independently inspect model invocation records. The operator retained orchestration-only first-mate and withdrew the proposed inline-work exception.

**Fix:** Compare recorded invocations with the instructions in effect before recommending additional model-selection guidance. Distinguish missing instructions from failure to follow existing ones; the report alone does not establish which model would have succeeded.
