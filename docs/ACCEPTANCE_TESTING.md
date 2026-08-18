# Acceptance Testing

The test plan for v21's user acceptance suite: what it verifies, how it models the
application, and what runs it. The specs under `tests/e2e/pelilauta/` carry the
journeys themselves.

## Goals

The suite verifies user journeys end to end: a real browser drives the running
application against the `skaldbase-test` Firebase project, which carries the same
Firestore, Storage and Auth products as live v18 on a separate project. A passing
run is evidence that a reader can do what a journey promises — the evidence
`docs/MIGRATION.md` rules the inherited v18 suite out of giving.

## Model

Every run starts from one known state. The runner wipes a named set of Firestore
collections — `sites` and `reactions`, to begin with; the set grows with what the
specs write — then writes the default seed, overwriting its documents in place. The
three example accounts persist in Auth between runs, because their uids tie the
Auth accounts to the Firestore documents the seed writes; the runner creates an
account only when it is missing. No spec cleans up after itself; the next run's
reset does.

Three example accounts model the reader roles:

| Account | Role |
| :--- | :--- |
| existingUser | A member with a profile; the default actor. |
| newUser | An account with no profile; the registration journey's actor. |
| adminUser | A member listed as an admin. |

A spec is a journey: it drives the application as a reader and asserts what that
reader observes. It does not read Firestore to prove a write happened.

## Runners

Vitest is the driver and Playwright supplies the browser: one runner, one command
— `pnpm test:uat` — for the specs under `tests/e2e/pelilauta/**/*.spec.ts`. Specs
run in a single worker because they share one database. The runner's global setup
resets, seeds, and signs existingUser in through the login form once, saving the
browser state every spec's context loads.

The suite runs locally, on demand and before a release. It is not part of
`pnpm verify`, by the decision `plans/debt/browser-tests-run-locally-only.md`
records.

## Environment

- The `skaldbase-test` project, reached through two gitignored files at the
  repository root: `server_principal.json`, the service principal, and
  `credentials.ts`, the example accounts' sign-ins.
- The reset reads the project id from the service principal and refuses every
  project except the test project, so the suite cannot run against production.
- The application runs as a local dev server. The runner uses the one already
  answering, and starts its own — stopped again after the last spec — when none
  is.
