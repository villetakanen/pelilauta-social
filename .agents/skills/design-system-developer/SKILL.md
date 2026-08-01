---
name: design-system-developer
description: Building or changing a design-system component, token, or book.
---

# Design System Developer

A design-system pull request carries its spec, its implementation, and its book on
the design site.

A check holds two artefacts in agreement — a stylesheet against a spec, a manifest,
another stylesheet, or the files on disk. A check that reads one stylesheet and
asserts its own contents is a slow `grep`, and a browser test that reads back what
the CSS declared tests the browser.

## What the change has to be for

v21 exists to remove Cyan. A design-system change earns its place by moving the
application off `@11thdeg/cyan-css`, and the test is a dependency — not a deletion,
and not a screenshot:

**With cyan-css absent, would the application render this correctly?**

Correctly, not identically. What a surface looks like afterwards is v20's and the
owner's; matching what the application renders today is not evidence of anything, and
a like-for-like claim is a defect.

Declaring a token Cyan already declares fails this test. Cyan's value is shadowed in
the cascade while Cyan still supplies the rule that reads it, so the application
depends on Cyan exactly as much as it did before, in one more place. Tokens are inputs
to a surface, not a surface: the surface moves when the design system owns what reads
them too.

## A book is an MDX file

Copy the template for the kind of book you are writing to
`apps/design/src/content/<group>/<slug>.mdx`. That file **is** the book: frontmatter,
prose, and markdown tables where a list of values is the point. The `h1` renders from
`title`; do not write one.

| Writing | Template | Shape |
| :--- | :--- | :--- |
| A base book | `books/templates/base.mdx` | A technical definition. What ships, its values, what it applies to. Under 300 words. |
| A principles book | `books/templates/principles.mdx` | Teaches how to use the system: choosing within it, and what goes wrong. |
| A component book | `books/templates/component.mdx` | A schema. One or two sentences, the example, the props table, then guidance. |

The distinction is not stylistic. A component page is read against the last component's,
so its headings are slots that must match; an argument in a heading cannot be scanned.
Published design systems converge on this — Primer, Polaris, Radix, USWDS and GOV.UK all
reach an example within a sentence or two, and none of them argues in a heading. **A
component page that never shows its own invocation has failed**, however well it reads.

`prose: true` asks the shell to render the `h1` and group the body. It adds no styling:
the design system owns neither content grids nor typography yet, so books look plain,
and inventing a measure or a rhythm here would be read later as a decision it made.

Where the page would otherwise repeat a stylesheet by hand, import a **specimen**
component for that part and keep the prose in MDX. A specimen reads real source, so
the book cannot describe a rule or a value that does not ship.

Length is counted in words, not lines: a base book stays under 300, a principles book
under 600. Over that is reasoning that belongs in a spec, or a second book.

No book in this repository or in v20 is a reference for shape or length. They are
being replaced for that reason. The templates are the reference.

Groups, ordering and publication are
`specs/design-system/design-site-navigation/spec.md`.

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

v20, and owner direction. Where either disagrees with the shipped
application, they win: the application is v18's, and appearance is not a
compatibility contract.

Look for v20's answer before writing your own, and look past the obvious place. Its
CSS is in `packages/cyan/src/{tokens,core,layouts,utilities}` **and inline in
`.astro` global style blocks** — a search of the token and core directories alone
has already produced two wrong conclusions. Its documented intent is in its books.
