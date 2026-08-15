# agents/qa

Persona QA for the pelilauta application. Each run drops one persona — an identity
and a motivation, not a script — onto the dev site through a headless Antigravity
CLI agent, and saves its first-person report to `docs/reports/`. This directory is
harness-agnostic tooling, not a coding-harness skill; those live in `.agents/`.

## Prerequisites

- `agy` on the PATH and signed in.
- `credentials.ts` and `server_principal.json` at the repository root.
- The dev server at `http://localhost:4321`, or let the runner start it.

## Commands

```sh
node agents/qa/run.mjs all            # every persona
node agents/qa/run.mjs game-master    # one persona; names match personas/*.md
node apps/pelilauta/scripts/cleanup-test-db.mjs           # dry run: list QA leftovers
node apps/pelilauta/scripts/cleanup-test-db.mjs --apply   # delete them
```

Reports land in `docs/reports/YYYY-MM-DD-qa-<persona>.md`.

## Rules

- The game-master and community-member personas write to the shared test database.
  Run the cleanup sweep after them.
- Content a persona creates must have a title starting with `QA:` — the cleanup
  script finds QA material by that prefix and nothing else.
- The persona contract travels in the composed prompt (`harness.md` + persona file);
  keep run instructions there, not in this file.
