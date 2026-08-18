# The browser tests run locally only, by decision

`pnpm verify` — the release gate, and what CI runs on a pull request — is
`check:skills && lint && test && build`, where `test` is `pnpm -r --if-present run
test`. That reaches every Vitest project inside the workspace packages. It reaches no
browser suite: `apps/design` defines `test:e2e`, the root defines `test:uat`, and
`pnpm -r` excludes the root, so nothing calls either. So the design system's
behavioural coverage, 101 tests at the time of writing, has never run outside a
developer's machine.

The coverage is real and it is used. `apps/design/e2e/content-container.spec.ts` alone
holds every Content Container Layouts scenario across both row modes: thresholds at two
root sizes, stacking, track geometry, container-query boundaries, region height. A
green `verify` says nothing about any of it. Whoever reads a passing pull request check
is reading lint, unit tests and builds.

## The decision

Wiring the browser tests into CI, or into a push hook, is deferred indefinitely. The
owner's call, 2026-08-11, during beta: the cost does not yet buy enough. A release is a
merge to main behind a human who has looked at the change, and the design site's suite
takes twelve seconds locally — cheap enough to run before pushing, which is where it
runs.

This is a deferral, not an omission to be fixed opportunistically. Do not wire it in as
a side effect of other work.

## What would reopen it

Leaving beta, when a release stops being a merge a human watched. Or the first
regression that ships because a browser test was green locally and never ran again —
which is the failure this deferral accepts.

Until then, a change to a design-system layout, surface or token is verified by running
`pnpm --filter design test:e2e` before pushing, and a delivery is accepted by running
`pnpm test:uat` at review. The pull request says which was run.
