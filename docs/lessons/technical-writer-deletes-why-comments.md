---
name: technical-writer-deletes-why-comments
branch: feat/21-rc2
date: 2026-09-09
---

**Context:** The #144 change moved the theme persist function into `apps/pelilauta/src/stores/session/theme.ts` and ran `pnpm technical-writer` over it and `components/svelte/app/AppThemeSwitch.svelte`.

**What happened:** The pass left both files with no comment at all. Gone are the block over `flips` stating that only the latest flip may revert, the `setTheme` doc stating that both controls call it, the `AppThemeSwitch` doc stating why the switch mounts for signed-in readers only, and the `label` prop doc. The code carries none of those facts; `actions.md` carries some. The report listed no deletion.

**Suspected why:** Step 2 of `.claude/skills/technical-writer/SKILL.md:27`, "Delete the comment when adjacent code carries the fact", was sharpened toward deletion by the reviewers-reduce lesson and now reads as licence to delete any comment near code.

**Fix:** Amend `SKILL.md:27` to "Delete the comment when the adjacent code states the same fact; keep a comment whose fact is a reason, a constraint, or a sequence the code does not state", and add deleted comment blocks to the exceptions the report must quote in step 5.
