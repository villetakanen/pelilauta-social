---
name: a-skill-not-symlinked-does-not-exist
branch: feat/ds-typography
date: 2026-08-01
---

**Context:** skills live in `.agents/skills/` and are exposed to Claude Code by a
symlink from `.claude/skills/`. `design-system-developer` had no symlink, so it was
never listed and never loaded. Nobody noticed because a missing skill produces no
error — the agent simply works without it and its output looks plausible.

**What happened:** three runs of a design-system implementation experiment produced
work that violated that skill twice over. Its first line is "a design-system pull
request carries its spec, its implementation, and its book on the design site" — all
three runs shipped no book, and the gap was only found by the owner asking whether the
design site explained the result. It also says of `styles/docs.css`: "prototype-age
scaffolding… do not build on it and do not extend it." Two of the three runs edited it.

A root-cause pass earlier the same session attributed the `docs.css` edits to an
ownership hole in the preflight spec's Boundaries table. That hole is real and was
fixed. But the harness already had a direct instruction not to touch the file, and the
analysis could not see it either, so it reasoned from the specs alone and produced a
correct answer that was not the whole answer.

**Suspected why:** the exposure mechanism is a manual step with no check. Seven skills
have symlinks and one did not; nothing in CI, in a hook, or in a review compares the
two directories. The failure is silent in both directions — an agent cannot report a
skill it was never told about.

**Fix:** the symlink now exists, so the skill loads from the next session. The
mechanism is unfixed: add a check that every directory under `.agents/skills/` has a
matching entry in `.claude/skills/`, in the same place `check:icons` runs. Worth asking
at retro whether the two directories should be one. Related:
[[ownership-tables-are-not-checked-for-holes]].
