---
name: owner-acceptance-is-not-agent-state
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** `.agents/skills/delivery-review/SKILL.md:41-43` asks a reviewer to
trace named human verification steps, while the owner already tracks whether they
have performed visual acceptance.

**What happened:** the PR 61 review repeatedly returned the outstanding visual look
at the no-preference theme as work for the owner, including after the owner had
redirected the review to implementation findings.

**Suspected why:** verification reachability treats an owner-only acceptance step
like repository state that an agent must track and report.

**Fix:** amend the delivery-review skill so an owner-only acceptance step is reported
only when the delivery record falsely claims it happened or the owner asks for an
acceptance checklist.
