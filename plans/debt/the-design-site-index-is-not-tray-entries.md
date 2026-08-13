# The design site's index is not tray entries

`apps/design/src/components/DocsNav.astro` renders bare anchors grouped under labels.
The tray it now stands in declares the compact presentation while it rests as a rail,
which a navigation destination answers by showing its icon alone. These links have no
icon and ignore the declaration, so between `--cn-breakpoint-small` and
`--cn-breakpoint-tablet` the rail is 10 grid units wide holding wrapped, clipped book
titles: "Colour & Surface" over three lines, "Iconography" cut off mid-word.

The tray is behaving as `specs/design-system/tray/spec.md` states. The index is not
entries.

Human decision 2026-08-13: this does not matter yet. The design site is read on a
desktop, where the tray is open and the titles are legible, and the rail band is the one
window a reader of the books is least likely to be in.

## Remaining change

Decide what a book's rail entry is. A glyph per book needs about twenty nouns the icon
set does not have; a glyph per group — Principles, Base, Tokens, Components — needs four,
and makes the book titles nested entries, which is the shape the tray already states.
Until then the rail carries clipped text.
