---
name: meta-skill-architect
description: Use when creating or refactoring a local SKILL.md package. Produces a focused trigger, concrete workflow, explicit handoffs, minimal supporting assets, and discovery checks without implementing the target workflow itself.
---

# Meta-Skill Architect

Create or refine one local agent skill that gives an agent only the context and procedure needed for a bounded workflow.

## Workflow

1. Define the target.
   - Name the exact requests that should activate the skill.
   - Name the expected output and allowed write paths.
   - List required output formats, structural anchors, tools, or APIs only when the workflow depends on them.
   - Identify neighboring skills and the condition for handing work to each one.

2. Select the package contents.
   - Start with `SKILL.md` only.
   - Add `references/` for static material that would otherwise bloat or duplicate the main instructions.
   - Add `scripts/` only for reusable deterministic operations or validation.
   - Do not create empty supporting directories.

3. Write focused instructions.
   - Use frontmatter `name` and `description`; the directory and name must match.
   - Make the description state both what the skill does and when it activates.
   - Prefer affirmative targets and ordered actions over general philosophy.
   - Include a concrete target shape or short example when prose alone leaves the output ambiguous.
   - Include project-specific facts only when they change the workflow.
   - Reference canonical repository guidance instead of copying it.
   - State explicit stop, ask, and handoff conditions where judgment changes ownership.

4. Check boundaries.
   - Remove generic software-engineering guidance already supplied by repository instructions.
   - Remove implementation details belonging to the target workflow's developer skill.
   - Remove repeated rationale once the required action is clear.
   - Confirm that neighboring skills do not activate for the same request without a clear precedence rule.

5. Validate discovery.
   - Keep one canonical copy under `.agents/skills/<name>/SKILL.md`.
   - Add relative symlinks for configured tools that require their own project discovery path.
   - Never commit local tool settings or workstation-specific paths.
   - Restart each configured tool and verify one positive trigger and one neighboring non-trigger.
   - Report completion, blockers, and handoff in the active task or issue unless the repository already defines a durable state mechanism.

## Handoffs

- Hand application implementation to the relevant developer skill.
- Hand product or architecture decisions to the human or planning workflow.
- Hand tool-specific configuration beyond discovery symlinks to the tool-configuration workflow.

## Boundaries

- Write only the requested skill package and required discovery symlinks.
- Do not execute the workflow that the new skill describes.
- Do not create global agent configuration, duplicate skill copies, or unrelated repository guidance.
- Do not introduce a shared agent-state file unless the repository already owns and documents that state contract.
