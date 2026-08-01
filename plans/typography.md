# Typography

Status: Draft 2026-07-30; cut to its findings 2026-08-01
Branch: `feat/ds-typography`
Follows: the core-token epic, which deferred typography

**Every design decision is `specs/design-system/typography/spec.md`'s, and font delivery
is `specs/design-system/fonts/spec.md`'s.** Where this file and a spec disagree about a
design decision, the spec wins. Scope is this file's.

## Out of scope

| Surface | Ruling |
| --- | --- |
| Buttons, inputs, `<select>` | Later phase. This epic does not decide their register. |

## Why

`packages/design-system` owns colour, unit and radius tokens. Typography is the last
core family still supplied by `@11thdeg/cyan-css`, and the terminal Cyan sweep is
sequenced behind it. The deferral was not caution: Cyan 4 and v20 do not disagree about
values so much as about what a typography token *is*, and porting the values without
porting the model breaks things that look untouched.

## Reading the v20 source

Everything below was read from the working checkout at `~/dev/pelilauta-20-ds`, a clone
of `github.com/villetakanen/pelilauta-20`, on 2026-07-30. It is a moving reference.

No commit hash is quoted, deliberately. `packages/design-system/styles/units.css`
cites `02880fbc995b45d459ce4f264b29d5283b1d8ced` as the origin of the unit values; that
commit is `feat(pelilauta): app-flags for deploy-time sub-app gating`, never touched
`units.css`, and is not an ancestor of that checkout's HEAD. A fixed reference means
pinning it and checking the pin, the way `units.test.ts` checks values rather than
trusting a comment.

v20's `typography.css` also comments that "Canonical font-size is set on `html{}` in
typography-semantics.css". **There is no `html` rule anywhere in v20's cyan package.**
Its rem literals resolve against the browser default, which is what makes `1.0625rem`
equal 17px. Do not port that comment, and do not add an `html` font-size on the
strength of it.

## What was measured

### The base units agree

v20's `packages/cyan/src/tokens/units.css` and Cyan 4's `@11thdeg/cyan-css/src/tokens/units.css`
are character-identical on the base three — `--cn-grid: 0.5rem`, `--cn-gap` at 2×,
`--cn-line` at 3×. `main` already ships these values. Typography is the only core family
where the two versions genuinely disagree, which is why it is the last one.

### The two models disagree about what a token is

| | Cyan 4 (v18, live) | v20 (the target) |
|---|---|---|
| Derivation | every size computed from `--cn-grid` | rem literals on an Augmented Fourth from a 17px base |
| Line height | a **length** | a **unitless ratio** |
| Responsive step | `@media (max-width: 620px)` | `@container (max-width: 38.75rem)` with `container-type: inline-size` on `main, article` |
| Heading colour | `--color-heading-1/2` | `--cn-text-heading` / `--cn-text-subheading` |
| Scale steps | display, h1–h5, text, text-small, caption, overline, mono, button | h1–h4, text, text-small, button |
| Small/caption | tokens | hardcoded in the utility class, caption also uppercase |

The spec settles the length-versus-ratio question by stating leading as a multiple of
the line unit, which is a length. One consequence survives it: across both installed
packages a line-height token is read in a *length* position in exactly two places —
`cyan-css/src/core/buttons.css:31` and `cyan-lit/dist/cn-snackbar/cn-snackbar.js:159`,
both `--cn-line-height-button`, both with a 38px fallback. Every other read is a
`line-height` declaration, where a ratio would also be valid. So the hazard is confined
to that one token, and it must stay a length.

### What the application consumes

Measured on `apps/pelilauta/src`, 2026-07-30.

**Almost nothing reads the tokens directly** — two files, both CodeMirror
(`cnEditorTheme.ts`, `CodeMirrorEditor.svelte`). Five of the seven names they read are
`--cn-*-ui`, declared in `@11thdeg/cyan-css/src/tokens/buttons.css`, which is also where
cyan-css sets the font of every button, input and textarea. Only `--cn-line-height-ui`
is defined nowhere. A UI font family living in the button tokens is itself a symptom of
a document preflight that never set `font-family: inherit` on form controls.

**Everything else arrives through global element styles and utility classes:**

- 79 `<h1>`, 35 `<h2>`, 27 `<h3>`, 29 `<h4>` — all styled by cyan-css tag selectors, none by the app.
- `text-low` 70, `text-small` 54, `text-caption` 47, `text-h5` 16, `text-center` 16, `text-high` 7, `text-right` 6, `text-h4` 3, `text-body` 3, `text-h3` 2, `text-light` 2, `text-left` 2, `text-h2` 1, `text-subheading` 1, `compact` 2.

**Three heavily-used classes resolve to nothing today**, absent from cyan-css, cyan-lit
and the app, and undefined in v20 as well: `downscaled` (70 uses), `text-link` (7),
`text-title` (3). Defining *or* deleting them changes appearance.

**`text-h5` has no v20 equivalent** (16 uses). v20's scale stops at h4.

### Where pixels move regardless

The spec's table is the authority for sizes; the divergences that matter are the ones
that are not sizes:

- `.text-caption` gains `text-transform: uppercase`. Uppercasing Finnish UI labels is a content-visible change, not a token change, which is why the spec splits label from caption.
- Headings gain container-relative downscaling: a heading inside a narrow card downshifts where it did not before, because the trigger becomes the container rather than the viewport.
- `container-type: inline-size` establishes layout containment and a new containing block for absolutely positioned descendants. In an app full of FABs, trays and docks this is the **one item in the epic that can break behaviour rather than only appearance**. The other is `--cn-line-height-button` above.

### Font payload

`apps/pelilauta/src/overrides.css` declares 12 `@font-face` rules — hairline, thin,
light, normal, bold, black, plus italics, woff2 + woff — against `lato-font@^3.0.0`.
None is a 500, while v20 uses 500 for buttons and captions, so those are synthesised
today. v20 declares 5 faces, woff2 only. What loads and why is the fonts spec's.

### Root font-size and breakpoints

Audited 2026-07-30, and better than expected: **no stylesheet in the design system, the
app or cyan-css sets `font-size` on `html` or `:root`, and none states a `font-size` in
`px`.** Type, spacing, radii and icon sizes already scale with the reader's preference.

The gap is elsewhere. **Every breakpoint in the system is `px` and there are no `rem`
breakpoints at all** — 18-plus across the app and cyan-css, including the existing
`@container main-app-content (width > 880px)`. A `px` query cannot see that the reader
enlarged their text, so at a 24px root the type grows by half and the layout keeps
deciding as though it had not. Large-text readers get correct sizes and wrong decisions
about them.

## Archaeology the code no longer shows

### `downscaled` is a Cyan 3 helper Cyan 4 retired

Defined across `cn-design-system-3/cyan-next/src/styles/typography/` in `heading_2.sass`,
`heading_4.sass`, `heading-5.css` and `text_body.sass`; it moved an element one step down
the scale. Cyan 4 retired it and said what to do instead, in
`cyan-design-system-4/apps/cyan-docs/src/books/principles/typography.mdx:51`: "Instead
of relying on downscaled helpers, use explicit heading-level classes." The application
never did that sweep, so 70 call sites carry a dead class.

The 70 are 37 `<p>`, 24 headings (7 h1, 4 h2, 5 h3, 8 h4), 6 `<span>`, and one each of
`<section>`, `<header>`, `<div>`. The mapping runs out at h4: those 8 `h4.downscaled`
sites wanted Cyan 3's h5, and 16 further sites already use `text-h5`. Read together, all
24 are one role — the title of a card, a list row or a small panel: TOC category names,
thread list items, site names, channel names, search results, stat block titles. That is
why the spec ends at h4 and downshifts by column width instead: a card title sized by
its card is strictly better than any fixed step, and it is v20's own mechanism.

The consequence to carry: containment extends past `main, article` to card and list-row
components, so the absolute-positioning risk covers card internals too.

### `.text-caption` is doing two unrelated jobs

Of 47 sites, roughly 35 are small explanatory prose — whole sentences, including field
hints in `AddChannelForm`, the EULA profile note, the SEO length counter, `tags/[tag]`'s
empty state, footer credits on four pages. Roughly 10 are true labels: `AddTopicForm`'s
form label, `KeeperCharacterCard`'s group header, `LabelManager`'s section title,
`ChannelListInfoCell`'s "createdAt" and "flowTime", reply counts and timestamps.

Two are neither, and uppercase would misrepresent them: `User.svelte:24` renders
`{account.uid}` and `ChannelSettings.svelte:184` renders `/channels/{channel.slug}`.
Both are case-sensitive identifiers — technical register, per the spec, so they leave the
caption question rather than becoming labels.

### `text-title` was an unfinished h0

v20 intended a tier one step above h1 and never landed it, which explains a loose end in
its own tokens: `--cn-font-weight-display: 300` survives with no matching size or line
height. The spec's title step is that tier, finished.

Of the three call sites, only `offline.html.astro:22` is an h0. The two in
`tags/[tag].astro` are section headers over lists — "Discussions (3)", "Pages (5)" —
which are labels. Implementation note: they carry `<Icon size="small">`, 24px against
12px label text, so the icon needs resizing at those sites.

### `snippetHelpers.ts`, and a bug that is not typography's

It renders a thread's markdown into a 220-character card preview and regex-injects
`text-h5` onto every `<h1>`–`<h6>` so an author's heading does not render at 68px inside
a card. Two callers: `ThreadCard.astro:43`, `ThreadListItem.svelte:24`. The card-preview
treatment belongs to the cards epic; the one thing this epic must do is change the
`headerClasses` default off `text-h5`, since that class stops existing.

Recorded separately because no styling choice fixes it: the helper emits real
`<h1>`–`<h6>` tags into the page, so a front page of ten thread cards injects ten
author-written `<h1>`s into the heading outline. Screen-reader heading navigation is
wrong today, independently of typography, and it belongs to whoever owns card previews.

## Rationale the spec does not carry

The spec states rules. These are reasons, held here only until the typography principles
book its Definition of Done requires exists; that book is what has to teach them.

- **Why h1 breaks the leading rule.** The strict rule — the smallest line multiple greater than the text — gives 68px text a 72px line: 4px of leading, and the same line as h2. h1 takes four line units instead.
- **Why labels uppercase and captions do not.** Finnish compounds are long and lose their word shape in capitals. Uppercase works on a column header or a stat key and fails on a sentence, and the 47 caption sites split roughly 35 sentences to 10 labels.
- **Why mono is a register rather than a tag.** A text input is technical whether or not it holds code, and an identifier in a `<span>` is technical. A timestamp written for a reader is not. Reading the family off the tag gets all three wrong.
- **Why the narrow-column threshold is the reading measure.** v20 states `38.75rem` independently of the measure it sets elsewhere, so the two can drift.
- **Why small text is off the scale.** The scale's step below reading size is caption, and captions are too small for sentences. Small text exists for secondary prose that still has to be read.
- **Why the title step does not downshift.** It is used where the page *is* the column, so there is no narrower container for it to respond to.
- **Why 17px is a ratio, not a promise.** A 17px base against a 16px root scales the reader's preference by 1.0625 rather than overriding it: 16 → 17, 24 → 25.5.

Note a type difference even where the two versions agree: v20's 24px prose line is
emergent (`1.412 × 17 = 24.004`, correct at 17px and only at 17px) where Cyan 4's is
pinned regardless of element size. Anything inheriting `--cn-line-height-text` at another
size gets off-grid leading under v20. Not a find-and-replace.

## Stories

Dependencies are facts found by investigation. How many pull requests each takes, and in
what order they ship, is a delivery-time decision and is deliberately absent.

### Preflight — shipped

`specs/design-system/preflight/spec.md` and `packages/design-system/styles/preflight.css`,
with the Base group and its book. Three of v20's reset rules could not travel with it:
`* { margin: 0 }` with its restored list markers, and the body font tokens. All three
ship with the semantics story.

### Fonts — shipped

`packages/design-system/styles/fonts.css`, 30 cut faces committed under
`packages/design-system/fonts/`, `scripts/cut-fonts.mjs` and its manifest, the base
book, and checks in `test/fonts.test.ts` and `apps/design/e2e/fonts.spec.ts`. The 12
`@font-face` rules and the `lato-font` dependency left `apps/pelilauta`; `docs.css`
and `preflight.css` gave up the families they named.

Three things the story settled that the spec left open:

- **The two unnamed weights are 100 and 900.** The spec says the set holds two the
  scale does not name, kept from what the application shipped; those are the two, and
  each keeps its italic as the application had it.
- **latin-ext is the larger file, not the smaller one.** Lato's latin-ext cut is
  ~55 KB against ~31 KB for latin, because Lato covers IPA and Latin Extended
  Additional in full. It loads only when a character needs it, so the payload is
  right, but the plan's "31 KB cut to latin" was not the whole picture.
- **Identifiers and slugs are still in the human register.** The technical register
  reaches the document's form controls and code elements by tag; a `<span>` holding a
  uid carries no marker to select. That sweep is the semantics story's.

`document.fonts.check()` cannot see a missing face — it answers whether text can be
rendered, which an installed copy of the family satisfies, so it passes with every
face blocked. The e2e check loads the FontFaceSet's own entries instead.

### Compat shim

Ensure nothing cyan-css or cyan-lit reads goes undefined once the design system defines
typography. **Derive the set from the installed packages at test time** rather than
enumerating it: an earlier enumeration here was wrong in both directions, omitting names
the two packages read and never declare — the `heading-4` family, `--cn-font-weight`,
`--cn-font-weight-heading`, `--cn-font-weight-strong`, `--cn-line-height-ui` — and
listing names cyan-css declares itself, which cannot go undefined. Verified in the shape
of `test/token-contract.test.ts`.

### The scale

`styles/typography.css`, imported from `styles/tokens.css`, with the spec's table as the
authority and a test asserting the stylesheet against it. Book: a lexicon in the `tokens`
group, and the principles book the spec requires.

**Declaring these token names changes the running application.**
`cyan-css/src/typography/headings.css` styles every heading in `apps/pelilauta` from
`--cn-font-size-h1`, `--cn-line-height-h1`, `--cn-font-weight-h1` and their siblings, and
the design system loads after cyan-css in `BaseHead.astro`. Whatever this story declares
under those names is what the application renders the moment it lands. Neither choice is
free. Declaring them moves the application onto the scale with no call-site edit, and
leaves cyan supplying the heading margins, letter-spacing, family and `.text-h*` classes
that disappear when it is removed — so appearance is accepted once now and again at that
removal. Avoiding them means naming the tokens something else and porting every heading
rule here instead of in the next story.

**Dependency: the compat shim.**

### The semantics

Port heading, body and utility rules into `styles/typography-semantics.css`, including the
global `<table>`, `<blockquote>`, list and `<a>` rules now in scope; retire the
corresponding cyan-css rules from the app's cascade. Adopt `container-type: inline-size`
on `main`, `article`, cards and list rows.

Carries the call-site sweeps: 70 `downscaled` sites (24 headings to plain `<h4>`, 37
`<p>` to small, 9 shapeless ones deleted), 16 `text-h5` sites to plain `<h4>`, ~45
`text-caption` sites split between small and the two label classes, 3 `text-title` sites,
6 `text-link` sites, and the `snippetHelpers.ts` default. Roughly 145 call-site edits.

**Dependencies: the scale, and preflight** — v20's `ul, ol { padding-left: … }` only makes
sense on top of a stripped list, which the preflight owns.

### Breakpoints in `rem`

Convert the 18-plus `px` queries — 620/621, 760, 768, 880, 1364, 1365, 1380 — and publish
the set as tokens rather than literals; v20 has the precedent in
`--cn-breakpoint-tray-wide: 64rem`. Also cap the layout chrome, which is where unbounded
scaling actually hurts: `--cn-width-tray` is 21rem, or 504px at a 24px root, and starts
eating the content column. `min()` on chrome, nothing clamped on prose or headings.

Owned by `specs/design-system/design-tokens/spec.md`, which already states that
breakpoints are `rem` for the same reason the grid is.

## Knowingly left

- **`AlgoliaSearchApp.svelte:204`** is a `<button>` hand-styled as a link whose colour has been silently missing. It keeps its dead `text-link` class. Left, not missed.
- **No containment audit gate.** If a card breaks under `container-type`, the fix belongs to the cards epic. Owner ruling.
- **No named screen set for visual acceptance.** Pre-selecting screens was an invented requirement.
- **The heading-outline bug** in card previews, above.
