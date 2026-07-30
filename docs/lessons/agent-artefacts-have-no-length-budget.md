---
name: agent-artefacts-have-no-length-budget
branch: feat/ds-typography
date: 2026-07-30
---

**Context:** The owner asked why agent-authored artefacts run very long, and why
plans come out over-detailed. It is not confined to one document.

**What happened:** `plans/typography.md` reached 443 lines. The two findings written
to log that problem exceeded the four-short-paragraphs shape
`docs/practices/lessons.md` prescribes, and their commit messages ran longer than
the findings themselves. Nothing in the repository states a length budget for any
artefact: `AGENTS.md` and `specs/TEMPLATE.md` both specify what a document must
contain and never what it must not exceed.

**Suspected why:** writing is nearly free for an agent while reading is not, so the
cost never appears in the loop that produces the text — it lands entirely on the
owner.

**Fix:** three candidates, cheapest first. State a maximum per artefact kind — XP's
index card was a physical constraint doing real work. Require that a turn adding to
a document also compresses it, since appending is local and compression is global.
And for plans specifically, treat detail as a decision-avoidance smell: writing six
stories with deliverables is easier than writing "we do not know how this splits
yet." Related: [[epic-plan-accretes-decision-prose]],
[[epic-plans-preplan-slices]].
