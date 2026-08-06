---
name: e2e-suites-are-invisible-to-the-test-gate
branch: feat/buttons-and-links
date: 2026-08-06
---

**Context:** the root `test` script is `pnpm -r --if-present run test`
(`package.json:11`), and `lefthook.yml` pre-push runs `pnpm test`. Both match the
script name `test` exactly, and `--if-present` skips a package that has no script
by that name without printing a line.

**What happened:** `apps/design/package.json:15` names its suite `test:e2e`, so the
recursive run never enters it. Reviewing this pull request, `pnpm -r --if-present
run test` reported 603 passing tests and success, having skipped all 71 Playwright
tests — the only automated coverage of surface elevation, content containers,
fonts, colour, cn-card and links, every one of them a cascade fact that cannot be
asserted from a stylesheet. `pnpm verify` reaches the design *build* but not that
suite either.

**Suspected why:** the suite was named for what it is rather than for the gate that
has to find it, and a skipped package looks identical to a passing one in the
output.

**Fix:** add `pnpm --filter design test:e2e` to the root `verify` script, after
`pnpm test`. That keeps the browser install and dev-server boot off every push
while making the suite reachable from one command before a merge. The alternative —
aliasing `test` to `test:e2e` in `apps/design` — puts both on every pre-push, which
is the owner's cost to accept.
