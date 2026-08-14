# The Suite Runs On Two Runners

Status: Recorded 2026-08-14, while levelling the test suite

## What is wrong

Unit checks run under vitest in `packages/design-system`, and component checks run
under Playwright in `apps/design/e2e`. Both drive the same design system; neither
is reachable from the other's command. `pnpm test` finds only the first.

Vitest 4 runs in browser mode through Playwright, so a component check can keep the
real browser it needs and lose the second runner. `packages/design-system/vitest.config.ts`
already loads the Svelte plugin.

A jsdom environment is not the alternative. The cascade, container queries and the
accessibility tree are the subjects of every component check, and jsdom resolves
none of them — `docs/lessons/a-hand-written-fixture-hid-a-live-accessibility-defect.md`
records what a fixture that only approximates a rendered component costs.

## What done looks like

One runner reaches every level the design system tests, in a real browser where
the subject needs one, from one command.
