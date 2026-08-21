---
name: a-book-page-can-vanish-with-every-gate-green
branch: feat/deprecate-cyan-and-qol
date: 2026-08-21
---

**Context:** The colour-token rename (`4e8ffa44`) turned a `TokenTable` prefix in
`apps/design/src/content/base/links-actions-buttons.mdx:124` into `--cn-color-button`,
a prefix no token matches.

**What happened:** The specimen threw at render and the page served only its layout
chrome — no mdx body — for two further commits. `pnpm test`, `astro check`, lint and
the design e2e suite stayed green throughout; the e2e failures that did appear read as
load flakes and passed in isolation, so they were dismissed. The break was found by
hand, while fixing `LinkStateTable.astro`.

**Suspected why:** No check asserts that a book page renders its content — every
existing e2e asserts specific elements on specific pages, so a page missing from the
suite can vanish whole.

**Fix:** One smoke test in `apps/design/e2e` that walks every content-collection
route and asserts the article body renders content beyond the layout's `h1`.
