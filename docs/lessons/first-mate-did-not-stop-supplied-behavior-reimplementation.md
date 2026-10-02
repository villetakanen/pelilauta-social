---
name: first-mate-did-not-stop-supplied-behavior-reimplementation
branch: feat/21-1
date: 2026-10-02
---

**Context:** Epic #165 required a small correction to an existing thread-reading path under first-mate orchestration.

**What happened:** Commit `7f0ae48f` replaced existing Firestore query ordering with application sorting and tests. Commit `f195461a` restored query ordering after operator steering. `.agents/skills/first-mate/SKILL.md:8` assigns orchestration and delegates implementation; the operator confirmed that this separation must remain.

**Fix:** Consider an explicit scope check before delegation and before accepting results, stopping work that exceeds the brief or rebuilds supplied behavior. Defer this amendment while observing the accepted baseline-check, test-scope, and assessment changes.
