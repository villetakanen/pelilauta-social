---
name: design-system-tests
description: Decide whether a design-system change needs a test, and which kind.
---

# Design System Tests

A test exists to catch a silent divergence between two artifacts. The code is
already the statement of itself: a test that restates one artifact — asserting a
stylesheet contains the declaration it contains — adds drift surface, not safety.

## The gate

Build a test only when all three hold:

1. Two artifacts can drift apart silently — or one global guarantee can be
   violated from anywhere.
2. The divergence is invisible on the design site. A rendered specimen a human
   looks at outranks an assertion; if the failure is visual, the book page is
   the detector, and the work is a specimen, not a test.
3. The assertion can read at least one side from source. Hand-copying a value
   into a test creates a third copy that also drifts.

Fails the gate: nothing. A reviewed change to a single artifact is what review
is for.

## The kinds, cheapest first

- **Agreement:** parse both sides, assert equality. A spec table against
  published tokens; a hardcoded query literal against the token it mirrors; a
  derived name set against what an installed package actually reads.
- **Identity:** two selectors that must never diverge share one rule; assert
  the grouped rule, so ungrouping fails before drifting.
- **Hole-keeping:** a name deliberately left undefined is asserted absent, with
  the reason, so defining it fails loudly instead of taking silent effect.
- **Guarantee sweep:** a rule that binds every stylesheet — no pixel queries,
  no root font size, no family named outside its owner — swept across the whole
  directory, so a new file is born covered.
- **Specimen throw:** a book specimen that reads source fails the build when
  the source stops matching the page's claim. The book is the check.
- **Browser (e2e):** only for what no parse can see — computed style after the
  cascade, a container query resolving, a face actually loading, geometry.

## Naming the agreement

Each test states the two artifacts it holds in agreement. A test that holds one
artifact against itself is deleted, not fixed.
