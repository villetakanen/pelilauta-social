---
name: uat-reuses-whatever-answers-at-base-url
branch: feat/editor
date: 2026-08-21
---

**Context:** Delivery review of the editor epic ran `pnpm test:uat` as release
acceptance.

**What happened:** `uat/pelilauta/e2e/global-setup.ts:156` reuses any server
answering at `BASE_URL`, and a dev server left running from earlier work
answered — one serving `504 Outdated Optimize Dep` for a dependency this
branch had changed. Acceptance ran against stale deps without saying so, and
`react-to-front-page-thread.spec.ts` failed three runs out of three on a
client timing race the stale server widened.

**Suspected why:** the reuse exists so a developer can watch a run against
their own server, and nothing distinguishes that intent from a forgotten
process.

**Fix:** in `waitForServer`, fetch one built asset and fail the run when the
reused server answers 504 for it, so a stale dev server stops a run instead
of failing a journey.
