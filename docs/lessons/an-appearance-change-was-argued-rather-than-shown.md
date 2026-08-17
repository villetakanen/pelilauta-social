---
name: an-appearance-change-was-argued-rather-than-shown
branch: feat/chrome
date: 2026-08-14
---

**Context:** `packages/design-system/styles/color-theme.css:185` declares
`--cn-color-info`, the background of the card corner flag and of
`CnNotificationAction`'s badge. A designer asked for it to be lighter.

**What happened:** the change was one line. Reaching it took five exchanges of
contrast tables, ramp inventories and hue analysis, and two reverted edits nobody
had asked for — a palette step added to `color-reference.css`, and a pill-size
change to `chrome-actions.css`. The request was twice restated as unfollowable.
The three suites that verified the final line ran in under three minutes.

**Suspected why:** `.agents/skills/design-system-developer/SKILL.md` routes every
change through migration correctness, so a change to appearance had no path and
was answered with correctness tools.

**Fix:** add a line to `.agents/skills/design-system-developer/SKILL.md`: where
the change is to appearance, render the candidates on the design site and ask,
rather than deriving the value from contrast arithmetic.
