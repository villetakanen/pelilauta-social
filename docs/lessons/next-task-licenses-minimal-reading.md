---
name: next-task-licenses-minimal-reading
branch: feat/buttons-and-links
date: 2026-08-06
---

**Context:** `next-task` was run against `plans/buttons-and-links.md`, an epic whose
`### Done` list is empty, so the proposal had to come from its `### Open` scope.

**What happened:** five successive proposals, all of them a variant of "spec or style
native links first". None named the epic's first Open bullet,
`plans/buttons-and-links.md:43` — **Capability contracts**, which states that the
division between links, actions, button and FAB presentation and tray placement is
itself undecided. Four of the five revisions were triggered by the owner asking a
question rather than by new evidence; one was triggered by reading
`specs/design-system/preflight/spec.md`. Along the way the run asserted that
`spec/SKILL.md` required cross-spec ownership edits inside a spec task, which that
skill contradicts — its **Delivery Boundary** says a missing spec is a separate task.
`specs/design-system/spec.md` and v20's `core/buttons.css` were never opened.

**Suspected why:** `.claude/skills/next-task/SKILL.md:9` says to inspect *only* what
is needed to understand the epic's state, which reads as a budget on reading, where
`spec/SKILL.md:2` names its sources and orders them read.

**Fix:** give `next-task` the sources step `spec` already has — the epic's Open
items, the domain's parent spec, and v20 for the surfaces in question — and drop
"only" from line 9. Second candidate, separable: state that an Open item declaring a
capability boundary undecided is a valid task, so a boundary question is proposable
instead of being answered implicitly by whichever capability the run picked first.
Related: [[agents-write-models-not-anchors]].
