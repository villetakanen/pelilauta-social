# agents/technical-writer

Headless technical-writer runner for the repository. Runs the technical-writer
skill across target files through a headless Antigravity CLI (`agy`) session,
rewriting prose and code comments directly in the working tree to conform with
`docs/WRITING.md`.

## Prerequisites

- `agy` on the PATH.
- Machine-level tool permissions configured in `~/.gemini/antigravity-cli/settings.json`:
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
  Headless `agy` requires pre-approved permissions to run non-interactively without prompting.


## Usage

Any agent (Claude Code, Codex, Antigravity) or developer can run:

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

1. Targets the named files, or discovers modified and untracked prose and code
   files across the working tree when invoked without arguments.
2. Runs headless `agy` with `.agents/skills/technical-writer/SKILL.md` and
   `docs/WRITING.md`.
3. In code files, modifies comment syntax only.
4. Applies all edits directly to the working tree.
5. Prints the before-and-after word counts and list of exceptions.
