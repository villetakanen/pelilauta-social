---
name: design-system-developer
description: Building or changing a design-system component, token, or book.
---

# Design System Developer

A design-system pull request carries its spec, its implementation, and its book on
the design site.

## A book is an MDX file

Copy the template for the kind of book you are writing to
`apps/design/src/content/<group>/<slug>.mdx`. That file **is** the book: frontmatter,
prose, and markdown tables where a list of values is the point. The `h1` renders from
`title`; do not write one.

| Writing | Template | Shape |
| :--- | :--- | :--- |
| A principles or base book | `books/templates/principles.mdx` | An essay. It teaches a decision, and its headings argue. |
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

v20's books are the reference for shape and length **of a principles book** —
`~/dev/pelilauta-20-ds/app/cyan-ds/src/content/principles/*.mdx`, 50 to 200 lines
each. Longer than that is usually two books. They are not the reference for a
component book, which is shorter and follows its own template.

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

v20, and recorded owner decisions. Where either disagrees with the shipped
application, they win: the application is v18's, and appearance is not a
compatibility contract.

Look for v20's answer before writing your own, and look past the obvious place. Its
CSS is in `packages/cyan/src/{tokens,core,layouts,utilities}` **and inline in
`.astro` global style blocks** — a search of the token and core directories alone
has already produced two wrong conclusions. Its documented intent is in its books.
