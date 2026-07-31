# Replacing the legacy `.astro` books

Status: In progress 2026-08-01
Branch: `feat/ds-typography`

## Why

Four design-site books were whole-page Astro components behind a one-line MDX shell.
They predate the design-system app and contradict
`specs/design-system/design-site-navigation/spec.md`, which says a book is prose MDX that
imports a specimen for the parts reading real source. They also keep
`packages/design-system/styles/docs.css` alive.

The sweep runs before the typography epic. The scaffolding was producing wrong decisions:
a proposal to sequence typography around how prose books render, and a browser test bound
to markup a prototype book emitted.

## Done

- **Preflight, units** — `TokenTable` specimen, `tokens/units` rebuilt as a lexicon,
  `UnitsBook.astro` deleted. Merged, PR #64.
- **Colour** — split into `tokens/color` (lexicon) and `principles/color-system` (usage).
  `ColorBook.astro` deleted. Specimens added: `ColorRamp`, `RoleTable`, `ContrastMatrix`,
  and `books/specimens/color.ts` for OKLCH resolution and WCAG contrast. Open in PR #65.

## Remaining

1. `packages/design-system/books/components/IconBook.astro` → `components/icon`. First
   book to use `books/templates/component.mdx`. Keep `e2e/icon-book.spec.ts`: it renders
   `Icon.svelte` server-side across sizes and tiers, which needs a browser.
2. `packages/design-system/books/principles/IconographyBook.astro` →
   `principles/iconography`. No e2e spec covers it.
3. Delete `styles/docs.css` with the last of them, and the `prose: false` case in
   `apps/design/src/content.config.ts` if nothing else uses it.

## Colour decisions

Settled 2026-08-01:

- Two themes, Dark and Light, both shipped in the same release. Dark is the default and
  the theme the interface is designed in. Light is checked before merge; where they
  disagree, Light is adjusted.
- The browser or OS selects the theme through `color-scheme`. A signed-in account may pin
  one, applied by `apps/pelilauta` at SSR. The design system never reads account state.
- The compatibility layer is removed before `v21.0.0-rc.1`. Recorded in
  `docs/MIGRATION.md`.

Open, and blocking a fuller colour book:

- What elevation means, and whether five surface roles are needed. `--cn-surface-1`
  to `-3` are all `surface-100` in Light. Deferred: the surfaces epic is not close.
- Whether contrast below AA is acceptable on a raised Dark surface. `--cn-on-surface` on
  `--cn-surface-4` is 4.32:1. Tied to the same epic.
- Whether colour may carry meaning without an icon or label. Needs discussion.
- Whether `--cn-color-success` resolving to `primary-60` is intended. Success has no
  family of its own, so brand and success share a hue.

## Corrections made while writing these books

Recorded so they are not re-derived:

- v20's colour book disagrees with v20's own `semantic.css` on four of five mappings
  sampled, including the surface its contrast rule names. v20's typography book has every
  line height wrong against `typography.css`. Verify v20 prose against v20 CSS before
  porting it.
- `--cn-color-primary` aliases `primary-70`, and `--cn-link` uses `primary-50`. Steps
  80–99 are used by two roles. Earlier drafts called 80/90 the brand colour.
- Inside an MDX block element, `<code>--cn-grid</code>` is parsed as markdown text and
  smartypants converts the hyphens to an em dash. Use backticks.
- A static file server used for screenshots must serve `.css`. One that only served
  `.html` produced unstyled screenshots and a review that meant nothing.

## Writing

Owner feedback 2026-08-01: books, specs and code comments were written in a rhetorical
register that made them unreadable. Three constructions to avoid:

- "not X, but Y"
- an aphorism closing a paragraph
- a knowing aside

State the fact, then stop. Reasoning belongs in the commit message.

## Where to continue

`IconBook.astro`, using `books/templates/component.mdx`. Before writing prose, read the
`git log` for `apps/design/src/content/principles/color-system.mdx` — it was rewritten
four times, and the last rewrite is the register to match.
