---
name: app-e2e
description: Writing or pruning a test in the pelilauta app e2e suite. Use whenever a slice implements a scenario from a spec under specs/pelilauta.
---

# App E2E

Where a spec under `specs/pelilauta` governs the work, each `Scenario:` in it gets
one test in `apps/pelilauta/e2e`, and most get no more than one. Name the test
after the scenario.

The test arrives with the slice that builds the behaviour. A scenario nothing
implements yet carries no test.

Assert what the scenario states. A scenario where a reader reaches a reply asserts
the reader reaches it, not that the link exists.

Each test declares its fixtures in `e2e/reset-fixtures.mjs`, which writes to
`skaldbase-test`. `pnpm --filter pelilauta test:e2e` runs the suite.
