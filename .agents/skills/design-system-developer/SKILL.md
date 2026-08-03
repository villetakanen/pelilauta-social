---
name: design-system-developer
description: Building or changing a design-system component or token.
---

# Design System Developer

A design-system pull request carries its spec, its implementation, and its book on
the design site.

A check holds two artefacts in agreement: a stylesheet against a spec, a manifest,
another stylesheet, or the files on disk. Do not assert a stylesheet against its own
contents, and do not browser-test a value the CSS declared.

## What the change has to be for

v21 exists to remove Cyan. A design-system change earns its place by moving the
application off `@11thdeg/cyan-css`, and the test is a dependency:

**With cyan-css absent, would the application render this correctly?**

Correctly, not identically. Appearance afterwards is v20's and a human's. A
like-for-like claim against what the application renders today is a defect.

Declaring a token Cyan already declares fails this test. Cyan's value is shadowed in
the cascade while Cyan still supplies the rule that reads it, so the application
depends on Cyan exactly as much as it did before, in one more place. The surface moves
when the design system owns the rule that reads the token.

## The book

Write it with the `design-system-book` skill. Invoke it. Do not write MDX from here.

## Two things here are not patterns

**`packages/design-system/books/*.astro`** — whole-page book components behind a
one-line MDX shell. Debt from before there was a design-system app, and the reason
the navigation spec had to state the MDX rule they break. Do not add one, and do not
copy their structure.

**`packages/design-system/styles/docs.css`** — prototype-age scaffolding whose hero,
kicker, lede and stat-tile vocabulary makes a documentation page read as a marketing
spread. It survives only because those `.astro` books consume it. Do not build on it
and do not extend it.

## Where design intent comes from

v20, and human direction. Where either disagrees with the shipped
application, they win: the application is v18's, and appearance is not a
compatibility contract.

Look for v20's answer before writing your own, and look past the obvious place. Its
CSS is in `packages/cyan/src/{tokens,core,layouts,utilities}` **and inline in
`.astro` global style blocks** — a search of the token and core directories alone
has already produced two wrong conclusions. Its documented intent is in its books.
