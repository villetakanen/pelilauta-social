---
name: writing-rules-do-not-propagate-between-skills
branch: feat/backdrop
date: 2026-08-10
---

**Context:** Commit `36229e6` (2026-08-09) found the CnPoster spec's first draft was
210 lines, named the cause — cn-card was used as the register model, so its bulk came
with it — and hardened `.agents/skills/spec/SKILL.md` with three subtraction rules: one
fact per sentence, no `because` tail, no sentence restating the previous one.

**What happened:** The next day the same vector produced the same result one artifact
type over. `.agents/skills/design-system-book/SKILL.md:70` named `cn-card.mdx` as a
worked instance, and its Voice section required the construction the spec skill had just
banned — "Every choice carries its rationale". The book came out at three times the
length it needed, and the register spread from the book into the CSS header and a JSON
comment written in the same session. The owner caught it by reading the output.

**Suspected why:** Writing rules live inside whichever skill last needed them, so a rule
learned in one skill is invisible to the six others that also produce prose.

**Fix:** Extract the shared rules into `docs/practices/writing.md` — one fact per
sentence, no reason-tail, no restatement, the template is the model and no sibling file
is — and have the prose-producing skills reference that file instead of each restating
its own copy.
