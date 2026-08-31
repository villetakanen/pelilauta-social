# agents

This directory contains harness-agnostic autonomous runners for Pelilauta.

Each runner executes agent workflows through a headless Antigravity CLI (`agy`) session without interactive prompts.

## Runners

- `agents/qa/`: Runs persona QA testing against the application.
- `agents/technical-writer/`: Rewrites prose and code comments across target files to conform with `docs/WRITING.md`.

## Prerequisites

- The environment requires `agy` on `PATH`.
- Configure machine-level tool permissions in `~/.gemini/antigravity-cli/settings.json`:
  ```json
  {
    "permissions": {
      "allow": [
        "command",
        "command(*)"
      ]
    }
  }
  ```
  Headless `agy` requires pre-approved tool permissions to execute non-interactively.
