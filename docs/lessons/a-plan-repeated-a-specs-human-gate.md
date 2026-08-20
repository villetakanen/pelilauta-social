---
name: a-plan-repeated-a-specs-human-gate
branch: feat/reply-authoring
date: 2026-08-20
---

**Context:** `plans/reply-authoring.md` carried a success criterion — the dock stands
above a virtual keyboard on a narrow viewport — that
`specs/design-system/components/cn-chat-bar/spec.md:135` already asks for as an
actual-mobile review in its Definition of Done.

**What happened:** Asked whether the epic was done, I reported the criterion as
outstanding, which read as work an agent had left undone. It is a gate only a person with
a phone can close: a headless browser opens no keyboard, and `docs/ACCEPTANCE_TESTING.md`
defines a UAT spec as a journey a browser drives. Two exchanges went into establishing
that nothing was blocked and nothing was unbuilt. The criterion was struck from the plan
in the same session, along with a second one the operator ruled the footer's.

**Suspected why:** `plans/TEMPLATE.md:14` already forbids this — "Not activities, not a
spec's acceptance criteria" — but the criterion was phrased as an outcome a reader
observes, which is exactly the shape the template asks for, so nothing about it read as
the prohibited kind.

**Fix:** Add the test the prohibition lacks to `plans/TEMPLATE.md:14`: a criterion no
check and no agent can settle belongs to the governing spec's Definition of Done, whatever
shape it is written in.
