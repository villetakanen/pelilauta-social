# agents

Harness-agnostic autonomous runners for Pelilauta.

Each runner in this directory executes specialized agent workflows through a
headless Antigravity CLI (`agy`) session without manual prompting.

## Runners

- `agents/qa/`: Persona QA testing against the application.
- `agents/technical-writer/`: Rewrites prose and code comments across target
  files to conform with `docs/WRITING.md`.

## Prerequisites

- `agy` on the PATH.
- Machine-level tool permissions configured in
  `~/.gemini/antigravity-cli/settings.json`:
  ```json
  {
    permissions: {
      allow: [
        "command",
        "command(*)"
      ]
    }
  }
  ```
  Headless `agy` requires pre-approved tool permissions to run non-interactively
  without prompting.
