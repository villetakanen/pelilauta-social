---
name: app-e2e
description: Writing or pruning a test in the pelilauta app e2e suite. Use whenever a slice implements a scenario from a spec under specs/pelilauta.
---

# App E2E

Add a concise test for each application scenario the change adds or alters.
Name it after the scenario and use the smallest fixture and assertion set
that demonstrates the changed behavior. Existing scenarios gain no tests
solely because a spec now describes them.

Use browser tests when the browser integration is the behavior under test.
Use an existing unit-test path for application logic that needs no browser.
Do not duplicate the same claim across layers or test guarantees supplied
entirely by the browser, framework, or service.

Assert the application outcome. A test of live enhancement observes an
update; unchanged element counts do not establish that a listener started.
Reuse existing fixture and authentication helpers. Keep scenario prose in
the governing spec.

Declare browser fixtures in `e2e/reset-fixtures.mjs` and retain the checks
that restrict writes to `skaldbase-test`. Run browser scenarios through
`pnpm --filter pelilauta test:e2e`.
