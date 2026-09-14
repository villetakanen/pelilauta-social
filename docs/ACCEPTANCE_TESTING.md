# Acceptance Testing

This document defines the test plan for the v21 user acceptance suite: verification scope, application modeling, and test execution. Specs in `uat/pelilauta/e2e/` define the journeys.

## Goals

The suite verifies user journeys end to end: a real browser drives the running
application against the `skaldbase-test` Firebase project, which carries the same
Firestore, Storage and Auth products as production on a separate project. A passing
run is evidence that a reader can do what a journey promises — evidence the
`apps/pelilauta/e2e` suite does not give (#120).

## Model

Every run starts from one known state. The runner wipes a named set of Firestore
collections — `sites`, `reactions` and `stream`; the set grows with what the
specs write — then writes the default seed, overwriting its documents in place. The
three example accounts persist in Auth between runs, because their uids tie the
Auth accounts to the Firestore documents the seed writes; the runner creates an
account only when it is missing. No spec cleans up after itself; the next run's
reset does.

Three example accounts model the reader roles:

| Account | Role |
| :--- | :--- |
| existingUser | A member with a profile; the default actor. |
| newUser | An account with no profile; the registration journey actor. |
| adminUser | A member listed as an admin. |

A spec is a journey: it drives the application as a reader and asserts what that
reader observes. It does not read Firestore to prove a write happened.

## Runners

Vitest is the driver and Playwright supplies the browser: one runner, one command
— `pnpm test:uat` — for the specs under `uat/pelilauta/e2e/**/*.spec.ts`. Specs
run in a single worker because they share one database. The runner global setup
resets, seeds, and signs example accounts in through the login form once, saving the
browser states for each actor.

The suite runs locally, on demand and before a release. It is not part of
`pnpm verify`, by the decision issue [#98](https://github.com/villetakanen/pelilauta-social/issues/98)
records.

## Environment

- Execution targets the `skaldbase-test` project using two gitignored files at the
  repository root: `server_principal.json` for the service principal and
  `credentials.ts` for example account credentials.
- The reset reads the project id from the service principal and refuses every
  project except the test project, so the suite cannot run against production.
- The runner starts no server. Start the application under acceptance before
  the run; setup fails unless the page at `BASE_URL` carries the
  repository version.
