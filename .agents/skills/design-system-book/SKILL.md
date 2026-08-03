---
name: design-system-book
description: Writing or changing a book on the design site.
---

# Design System Book

## Which kind

Decide before copying anything. Whether the page exists at all is
`specs/design-system/design-site-navigation/spec.md`'s.

| Kind | Template | Limit |
| :--- | :--- | ---: |
| Base — what ships, its values, what it applies to | `books/templates/base.mdx` | 300 |
| Principles — how to choose, and what goes wrong | `books/templates/principles.mdx` | 600 |
| Component — a schema | `books/templates/component.mdx` | 400 |

A book states decisions already made. If one is missing, read `docs/DESIGN.md`, then
`AGENTS.md`, then ask a human. Do not settle it in prose.

## Writing it

Copy the template to `apps/design/src/content/<group>/<slug>.mdx`. That file is the book.
The `h1` renders from `title`; do not write one.

Anything that ships in source comes from a specimen that reads it, never from prose.

No existing book, here or in v20, is a reference.

## Before the pull request

`wc -w` under the limit.

Cut a paragraph a competent reader could have written without this repository.

Never: "not X, but Y". An aphorism closing a paragraph. A knowing aside.
`grep -nwE 'easy|simply|quick|just'` returns nothing.

Imperative mood. Contractions.
