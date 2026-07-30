---
name: narrow-criticism-sweeping-rewrite
branch: feat/ds-navigation
date: 2026-07-30
status: proposed
---

**Context:** `AGENTS.md` already forbids consumer-free foundation work without
approval and a timebox.

**What happened:** Two instances. `140720c` answered a specific criticism —
about forcing code-level contract detail into blueprints — by rewriting
`specs/TEMPLATE.md` and removing its concrete sections wholesale; see
[[harness-artifact-altitude]] for what that cost downstream. The second is the
lesson queue itself: drafting that finding, I proposed rewriting
`specs/TEMPLATE.md` again and re-heading four specs. The owner chose to log
instead, which stopped it.

**Suspected why:** The mechanism by which agent-driven harness evolution
degrades rather than compounds. The damage never appears at review time, because
reviewers check whether the new structure is coherent, not whether it was
warranted; it appears when the next author works inside it. `140720c` was
consumer-free by its own description, so — as in
[[check-upgradability-before-workaround]] — the rule was present and the trigger
was not recognised.

**Fix:** Fix the instance; record the general case. Changing a generator —
template, skill, practice guide — needs its own approval and a consumer, meaning
the next artifact actually written through it. The signal to watch is the ratio:
one sentence criticised, one template rewritten.
