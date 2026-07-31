# The Design Site's Prototype-Age Books

Status: Recorded 2026-07-31, unstarted

## What is wrong

`specs/design-system/design-site-navigation/spec.md` is approved and says a book is
one MDX entry whose body is prose, importing a specimen component for the parts that
need live code. Four books do the opposite: the MDX file is a one-line shell calling a
whole-page Astro component.

- `packages/design-system/books/tokens/ColorBook.astro`
- `packages/design-system/books/tokens/UnitsBook.astro`
- `packages/design-system/books/components/IconBook.astro`
- `packages/design-system/books/principles/IconographyBook.astro`

They predate the design-system app, so at the time there was nowhere else for a page
to live. They now function as a template by example, which is how the fifth book was
written before this note existed.

`packages/design-system/styles/docs.css` is the other half. It is the editorial
vocabulary those pages share — `.hero` at `min(48rem, 76vh)`, an `h1` at
`clamp(3.5rem, 12vw, 9rem)`, `.kicker`, `.lede`, `.facts` stat tiles, and
`clamp(4rem, 9vw, 8rem)` of padding on every `.book > section`. It makes a reference
page read as a product launch, and it survives only because those four books consume
it.

## What done looks like

Each of the four is an MDX book following `packages/design-system/books/TEMPLATE.mdx`,
with a specimen component for the parts that must read real source — the colour and
unit books are parsed from stylesheets today, and that property is worth keeping.
`docs.css` is deleted with the last of them, and the `prose` frontmatter flag stops
having a false case.

There is deliberately no stand-in reading measure or prose rhythm. Books render plain
until the design system owns content grids and typography, each with a spec. A ported or
invented value would be read later as something the design system had decided, which is
how `styles/units.css` came to cite a commit that never touched it.

## Why it is not one pull request

Each book is a rewrite of a page a reader currently uses, and the colour and icon
books have Playwright specs asserting their rendered content. One book at a time, each
with its spec's acceptance re-run.
