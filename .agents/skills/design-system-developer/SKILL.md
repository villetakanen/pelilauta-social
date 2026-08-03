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

v21 exists to remove Cyan. A design-system change moves the application off
`@11thdeg/cyan-css`, and the test is a dependency:

**With cyan-css absent, would the application render this correctly?**

Correctly, not identically. A like-for-like claim against what the application renders
today is a defect.

Declaring a token Cyan already declares fails this test. Cyan's value is shadowed in
the cascade while Cyan still supplies the rule that reads it, so the application
depends on Cyan as much as it did before. The surface moves when the design system owns
the rule that reads the token.

## The book

Write it with the `design-system-book` skill. Invoke it. Do not write MDX from here.

## Not patterns

**`packages/design-system/styles/docs.css`** — prototype-age scaffolding whose hero,
kicker, lede and stat-tile vocabulary makes a documentation page read as a marketing
spread. What is left of it serves the index page, plus link and table rules nothing else
owns yet. Do not build on it and do not extend it.

A book under `packages/design-system/books/` is a specimen: one component rendering
one thing an MDX book reads from source. Do not write a whole-page book component
behind a one-line MDX shell.

## Where design intent comes from

Take the appearance from v20, at `~/dev/pelilauta-20/`. Where it disagrees with the
shipped application, v20 wins: the application still renders v18, and appearance is not
a compatibility contract.

Find v20's answer before writing your own. Its CSS is in
`packages/cyan/src/{tokens,core,layouts,utilities}` **and inline in `.astro` global
style blocks** — search both. Its intent is in its books, under
`app/cyan-ds/src/content/`.

Where v20 is silent or contradicts itself, ask before deciding, and deliver everything
that does not depend on the answer.
