---
name: restarted-work-can-inherit-stale-scope
branch: feat/rc1-readiness
date: 2026-09-07
---

**Context:** A restarted changeset reused assumptions from an earlier implementation pass while the published issue had changed.

**What happened:** The first Content Area spec described a blanket list reset, while the published #131 issue required the existing selective `role="list"` reset. The initial `apps/design/e2e/content-area.spec.ts` also covered only marker, gutter, margin and teaser outcomes before later review requested broader assertions.

**Suspected why:** Restart handoff reports preserved earlier scope and test summaries without a fresh comparison against the current issue body and actual assertions.

**Fix:** Add a restart handoff field that records the issue-body source and the acceptance-test assertions read before the handoff is reused.
