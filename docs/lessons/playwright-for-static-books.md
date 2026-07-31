---
name: playwright-for-static-books
branch: feat/ds-typography
date: 2026-07-31
---

**Context:** `apps/design/e2e/` has one Playwright spec per book. The owner's rule
is that those exist for books rendering interactive Svelte components that static
tests cannot reach — a static book does not need a browser to prove it is correct.
That rule is written nowhere in the repository.

**What happened:** designing the Foundations book, a planning agent recommended a
full `foundations-book.spec.ts` plus a navigation entry, unprompted and with
reasoning, for a book that is entirely static. The owner has seen this before and
described it as agents wanting to write irrelevant Playwright testing. Because the
rule is undiscoverable, each agent re-derives the wrong answer from the existing
files, which all have specs.

**Suspected why:** the convention is visible only as a pattern in `apps/design/e2e/`,
and that pattern reads as "every book gets a spec".

**Fix:** state the rule where an agent will hit it — the design-system testing
guidance or `AGENTS.md`. Worth checking while doing so whether the existing specs
follow it: `icon-book` renders an interactive component and qualifies, while
`color-book` and `units-book` look static and may be the examples teaching the wrong
lesson. Related: [[over-planning]].
