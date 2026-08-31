# agents/technical-writer

This runner executes the technical-writer skill across target files through a headless Antigravity CLI (`agy`) session, rewriting prose and code comments directly in the working tree to conform with `docs/WRITING.md`.

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

## Usage

Agents or developers run the tool using these commands:

```sh
# Run on specific files
pnpm technical-writer specs/clock/spec.md packages/clock/CnClock.svelte
# or
agents/technical-writer/run.sh specs/clock/spec.md packages/clock/CnClock.svelte

# Run on all changed files in the working tree
pnpm technical-writer
# or
agents/technical-writer/run.sh

# Optional flags:
agents/technical-writer/run.sh [files...] [--model <id>] [--effort <low|medium|high>]
```

## Behaviour

1. Targets named files, or discovers modified and untracked files containing prose across the working tree when invoked without arguments.
2. Runs headless `agy` with `.agents/skills/technical-writer/SKILL.md` and `docs/WRITING.md`.
3. In source files, modifies comment syntax only.
4. Applies all edits directly to working tree files.
5. Reports before-and-after word counts and lists exceptions.
