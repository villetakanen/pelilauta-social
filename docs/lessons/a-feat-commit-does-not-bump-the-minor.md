---
name: a-feat-commit-does-not-bump-the-minor
branch: feat/21-1
date: 2026-10-04
---

**Context:** `CLAUDE.md`, ALWAYS, sets the version once per release: a branch that bumped a patch and then takes a feature bumps to the minor, and the changelog section opens in the same commit.

**What happened:** The branch bumped to 21.0.1 on its first commit. Five `feat(threads)` commits then landed on it (f0e11aa2 to b5b244f9) while `package.json` stayed at 21.0.1 and the changelog section stayed `## 21.0.1`. No hook, lint, test or agent step raised it; the adversarial review of #165 raised it as a close-out question, and the operator decided 21.1.0 by hand.

**Suspected why:** The rule is read at release time, and no instrument reads the commit type against the version on the branch when a commit lands.

**Fix:** A check that reads the commit types since the branch point against the root version, run where `pnpm test` or commitlint already run, or a first-mate step before each commit that lands a `feat`.
