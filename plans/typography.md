# Typography Token Ownership

Status: Draft 2026-07-30; corrected 2026-07-31 from the preflight investigation
Branch: `feat/ds-typography`
Follows: the core-token epic, which deferred typography for the reasons below

## Why

`packages/design-system` owns colour, unit and radius tokens. Typography is the
last core family still supplied by `@11thdeg/cyan-css`, and the terminal Cyan
sweep is sequenced behind it. Until the design system owns typography it cannot
publish a type scale, and every heading in `apps/pelilauta` is styled by a
package v21 intends to remove.

The deferral was not caution. Cyan 4 and v20 do not disagree about *values*;
they disagree about what a typography token **is**. Porting the values without
porting the model breaks things that look untouched.

## What "the v20 source" means here

Everything below was read from the working checkout at
`~/dev/pelilauta-20-ds`, `packages/cyan/src/tokens/typography.css`,
`tokens/typography-semantics.css` and `fonts/fonts.css`, on 2026-07-30. That
checkout is a clone of `github.com/villetakanen/pelilauta-20`, so it is a moving
reference, not a frozen one. No commit hash is quoted, deliberately: the existing
clause in `packages/design-system/styles/units.css` cites
`02880fbc995b45d459ce4f264b29d5283b1d8ced` as the origin of the unit values, and
that commit is `feat(pelilauta): app-flags for deploy-time sub-app gating` — it
never touched `units.css` and is not an ancestor of that checkout's HEAD. If the
port needs a fixed reference, the way to get one is to pin it and check the pin,
the way `units.test.ts` checks values rather than trusting a comment.

## The base units are not in dispute

Read from both sources rather than from either comment: v20
(`packages/cyan/src/tokens/units.css`) and Cyan 4
(`@11thdeg/cyan-css/src/tokens/units.css`) are character-identical on the base
three.

```css
--cn-grid: 0.5rem;                      /*  8px */
--cn-gap:  calc(var(--cn-grid) * 2);    /* 16px */
--cn-line: calc(var(--cn-grid) * 3);    /* 24px */
```

So the multiples are 1×, 2×, 3× of `--cn-grid`, and the base is `0.5rem` — not
`1rem`. This is what `main` already ships, and the values are right even though the
citation attached to them is not. Typography is therefore the only core family
where the two versions genuinely disagree, which is why it is the last one and the
hard one.

One consequence worth stating before the scale story is written: v20's `typography.css`
comments that "Canonical font-size is set on `html{}` in
typography-semantics.css". **There is no `html` rule anywhere in v20's cyan
package.** Its rem literals therefore resolve against the browser default of
16px, which is what makes `1.0625rem` equal 17px. The scale is self-consistent;
the mechanism the comment describes does not exist. Do not port that comment, and
do not add an `html` font-size on the strength of it — that would rescale every
rem in the application.

## The model difference

| | Cyan 4 (v18, live) | v20 (the target) |
|---|---|---|
| Derivation | every size computed from `--cn-grid` | rem literals on an Augmented Fourth (1.414) scale from a 17px base |
| Line height | a **length** (`calc(6 * var(--cn-grid))` → 48px) | a **unitless ratio** (`1.412`) |
| Responsive step | `@media (max-width: 620px)` | `@container (max-width: 38.75rem)` with `container-type: inline-size` on `main, article` |
| Heading colour | `--color-heading-1/2` | `--cn-text-heading` / `--cn-text-subheading` |
| Scale steps | display, h1–h5, text, text-small, caption, overline, mono, button | h1–h4, text, text-small, button |
| Small/caption | tokens (15px/13px) | hardcoded in the utility class (14px/12px, caption also uppercase) |

The line-height type change is the dangerous one. `cyan-css/src/core/buttons.css:31`
reads `height: var(--cn-line-height-button, …)`. Cyan 4 sets that token to 38px;
v20 sets it to `1.5`. Dropping v20's value in front of live cyan-css makes every
button in the application **1.5 pixels tall**.

Corrected 2026-08-01: this paragraph continued "twenty-two cyan-css source files and
seven cyan-lit bundles read typography tokens, so this class of failure is not
confined to buttons." Measured, it is confined. Across both packages a line-height
token is read in a length position in exactly two places —
`cyan-css/src/core/buttons.css:31` and
`cyan-lit/dist/cn-snackbar/cn-snackbar.js:159` — both `--cn-line-height-button`, both
with a 38px fallback. Every other read is a `line-height` declaration, where a ratio
is valid.

Superseded 2026-08-01 in any case: `specs/design-system/typography/spec.md` states
leading as a multiple of the line unit, which is a length. The ratio-versus-length
hazard leaves the epic with that decision.

## What the application actually consumes

Measured on `apps/pelilauta/src`, 2026-07-30.

**Almost nothing reads the tokens directly** — two files, both CodeMirror
(`cnEditorTheme.ts`, `CodeMirrorEditor.svelte`), and five of the seven names they
read are `--cn-*-ui` (`--cn-font-family-ui`, `-font-size-ui`, `-font-weight-ui`,
`-letter-spacing-ui`, `-line-height-ui`).

Corrected 2026-07-31: **four of those five are defined**, in
`@11thdeg/cyan-css/src/tokens/buttons.css`, which is also where cyan-css sets the
font of every button, input and textarea. Only `--cn-line-height-ui` is defined
nowhere, so the editor takes an initial value for that one alone rather than for
the family. A UI font family living in the button tokens is itself a symptom: it is
compensating for a document preflight that never set `font-family: inherit` on form
controls.

**The app consumes typography through global element styles and utility classes:**

- 79 `<h1>`, 35 `<h2>`, 27 `<h3>`, 29 `<h4>` — all styled by cyan-css tag selectors, none by the app.
- `text-low` 70, `text-small` 54, `text-caption` 47, `text-h5` 16, `text-center` 16, `text-high` 7, `text-right` 6, `text-h4` 3, `text-body` 3, `text-h3` 2, `text-light` 2, `text-left` 2, `text-h2` 1, `text-subheading` 1.
- `compact` 2.

**Three heavily-used classes resolve to nothing today** — absent from cyan-css,
cyan-lit and the app: `downscaled` (70 uses), `text-link` (7), `text-title` (3).
v20 does not define them either. Defining or deleting them changes appearance.

**`text-h5` has no v20 equivalent** (16 uses). v20's scale stops at h4.

**Divergences that will move pixels even when the port is correct:**

- h1 grows ~64px → ~68px; its leading grows 80px → ~88px.
- h2 shrinks 51px → 48px; h3 shrinks 36px → ~34px; both keep their leading.
- h4 keeps its size (25px → 24px) but its **leading shrinks 40px → 32px**.
- `.text-small` 15px/24px → 14px/21px (54 uses).
- `.text-caption` 13px/16px → 12px/18px **plus `text-transform: uppercase` and weight 500** (47 uses). Uppercasing Finnish UI labels is a content-visible change, not a token change.
- Headings gain container-relative downscaling. A heading inside a narrow card downshifts under v20 where it did not under v18, because the trigger becomes the container, not the viewport.
- `container-type: inline-size` on `main, article` establishes layout containment and a new containing block for absolutely positioned descendants. This is a layout risk in an app full of FABs, trays and docks, and it is the one item here that can break a compatibility contract rather than only appearance.

**Font payload:** `apps/pelilauta/src/overrides.css` declares 12 `@font-face`
rules (hairline, thin, light, normal, bold, black, plus italics, woff2 + woff)
against `lato-font@^3.0.0`. v20 declares 5 (300/400/500/700 + 400 italic, woff2
only). v20's `--cn-font-family` names `Lato, system-ui, -apple-system, sans-serif`
against Cyan 4's longer Tailwind-derived stack.

## Decisions settled 2026-08-01, with the spec

`specs/design-system/typography/spec.md` now holds the design decisions. Where the
sections below disagree with it, the spec wins. What changed:

**Leading is a multiple of the line unit and taller than the text it holds, stated as
a length.** This is v21's rule, not v20's, and it recomputes most of the scale.

| step | size | line | | v20 had |
|---|---|---|---|---|
| title | 96px | 120px | 5 × line | absent |
| h1 | 68px | 96px | 4 × line | 88px |
| h2 | 48px | 72px | 3 × line | 64px |
| h3 | 34px | 48px | 2 × line | 48px |
| h4 | 24px | 48px | 2 × line | 32px |
| text | 17px | 24px | 1 × line | 24px |
| small | 15px | 24px | 1 × line | 14px on 21px |
| caption | 12px | 24px | 1 × line | 12px on 18px |

h1 takes four line units rather than the three the strict rule gives, because three
leaves 4px around 68px text.

**Small text is 15px.** v20's token says 15px and its own utility hardcodes 14px; the
token is right. This supersedes every 14px/21px figure below.

**The title step is 96px on 120px at weight 200**, superseding the 6rem-on-104px
proposal under "`text-title` is the missing tier above h1" — 104px is not a line
multiple.

**Weights: title 200, h1 300, h2–h4 and prose 400, labels and buttons 500, emphasis
700.** 200 is already a loaded face; the app declares 100/200/300/400/700/900. 500 is
the only named weight with no face, and it gets one, which confirms the font-face
story as a payload increase.

**Mono is a register, not a tag.** Form inputs, code, and machine-facing values such
as identifiers and slugs. This is wider than the `--cn-*-ui` repoint below, which
justified mono by the editor being a markdown source view. It also resolves the two
case-sensitive caption sites — `User.svelte:24` and `ChannelSettings.svelte:184` are
technical register, so they leave the caption question rather than becoming
`.text-label`.

**The narrow-column threshold is the reading measure**, which
`specs/design-system/content-containers/spec.md` already owns, rather than v20's
independent `38.75rem`. One owner for the threshold, and it moves with the measure.

**Unchanged from 2026-07-30, and reconfirmed:** the scale stops at h4; `text-h5` and
`downscaled` heading sites become plain `<h4>` and downshift by column width; caption
and label split with label carrying the uppercase; the title step exists for
`text-title`'s call sites.

### Rationale the spec does not carry

The spec states rules; these are the reasons behind them, kept here because no
typography principles book exists yet. The book is a Definition-of-Done item in the
spec, and this is the material it has to teach.

- **Why h1 breaks the leading rule.** The strict rule — the smallest line multiple
  greater than the text — gives 68px text a 72px line, which is 4px of leading and
  the same line as h2. h1 takes four line units instead.
- **Why labels uppercase and captions do not.** Roughly 35 of the 47 `text-caption`
  sites are whole sentences and about 10 are true labels. Finnish compounds are long
  and lose their word shape in capitals, so uppercase works on a column header or a
  stat key and fails on a sentence.
- **Why mono is a register rather than a tag.** A text input is technical whether or
  not it holds code, and an identifier printed in a `<span>` is technical. A
  timestamp written for a reader is not. Reading the family off the tag gets all
  three wrong.
- **Why the narrow-column threshold is the reading measure.** v20 states `38.75rem`
  independently of the measure it sets elsewhere, so the two can drift. Pointing at
  the measure gives the threshold one owner.
- **Why 15px small text is off the scale.** The scale's step below reading size is
  12px, which is caption, and captions are too small for sentences. Small text exists
  for secondary prose that still has to be read.
- **Why the title step does not downshift.** It is used where the page is the column,
  so there is no narrower container for it to respond to.

## Decisions settled 2026-07-30

**No appearance exception is needed.** `AGENTS.md` already states that appearance
is not a compatibility contract and that v18 is not its reference, so the type
scale moving is the sanctioned direction of travel, not an exception to it. What
the epic needs from the owner is visual acceptance of running screens, once, at
the semantics story. Only two items in this epic stop being appearance and become
behaviour, and both are called out separately: button height (the compat shim) and
`container-type` on `main, article`.

**Prose is already at the goal and does not move.** v20 and Cyan 4 both put body
text at 17px on a 24px line with ~0.5px tracking. v20 says it as `1.0625rem` and
the ratio `1.412`; Cyan 4 says it as `calc(var(--cn-grid) * 2.125)` and the length
`var(--cn-line)`. Same result, and the visible change in this epic is confined to
the headings and the small/caption steps.

Note the type difference even where the result agrees: v20's 24px is emergent
(`1.412 × 17 = 24.004`, correct at 17px and only at 17px) where Cyan 4's is pinned
at 24px regardless of the element's size. Anything inheriting
`--cn-line-height-text` at another size gets proportional off-grid leading under
v20. Fine for prose, which is always 17px; not a find-and-replace.

**Accessibility is the reason the scale is expressed the way it is.** The
requirement is that the system respond to the reader's font-size preference, so
`--cn-grid: 0.5rem` is the single scaling origin, everything derives from it in
`rem`, and nothing sets a root font-size. A 17px base against a 16px root means
the reader's preference is scaled by 1.0625, not overridden: 16 → 17, 24 → 25.5.
The "17px" in this plan is therefore a ratio, not a promise.

Audited 2026-07-30, and the position is better than expected: **no stylesheet in
the design system, the app or cyan-css sets `font-size` on `html` or `:root`, and
no stylesheet anywhere states a `font-size` in `px`.** Type, spacing, radii and
icon sizes already scale.

The gap is elsewhere. **Every breakpoint in the system is `px` and there are no
`rem` breakpoints at all** — 18-plus across the app and cyan-css, including the
existing `@container main-app-content (width > 880px)`. A `px` query cannot know
the root font-size, so at a 24px root the text grows by half and the layout keeps
deciding as though it had not. Large-text readers get correct sizes and wrong
decisions about them. The breakpoint story converts them.

### The scale stops at h4, and `downscaled` becomes explicit classes

Owner, 2026-07-30: **v20's scale ending at h4 is intentional. There is no smaller
heading style.** Below h4 you are in text, not headings.

`downscaled` is a Cyan 3 helper — defined across
`cn-design-system-3/cyan-next/src/styles/typography/` in `heading_2.sass`,
`heading_4.sass`, `heading-5.css` and `text_body.sass` — that moved an element one
step down the scale. Cyan 4 retired it and said what to do instead, in its own docs
at `cyan-design-system-4/apps/cyan-docs/src/books/principles/typography.mdx:51`:
"Instead of relying on downscaled helpers, use explicit heading-level classes."
The application never did that sweep, so 70 call sites carry a class that resolves
to nothing. Owner ruling: do the sweep v20 intended —
`<h1 class="downscaled">` → `text-h2`, and so on down.

The 70 break down as 37 `<p>`, 24 headings (7 h1, 4 h2, 5 h3, 8 h4), 6 `<span>`,
and one each of `<section>`, `<header>`, `<div>`.

The mapping runs out at h4. Those 8 `h4.downscaled` sites wanted the step below h4,
which in Cyan 3 was h5 — and 16 further sites already use `text-h5`, which Cyan 4
defines and v20 does not. Read together, all 24 turn out to be one role: the title
of a card, a list row or a small panel. TOC category names, thread list items, site
names, channel names, search results, stat block titles.

Owner decision: **they become plain `<h4>`, and cards and list rows become
containers.** v20's container query already renders `h4` as bold 17px body text
below 38.75rem, so a card title downshifts by available width instead of by a
hardcoded step. This is strictly better than any fixed class, and it is v20's own
mechanism.

Consequence to carry into the containment audit: `container-type: inline-size` now
extends past `main, article` to card and list-row components, so the
absolute-positioning audit must cover card internals, not just page-level chrome.

### `.text-caption` splits into two classes

The 47 `text-caption` sites are doing two unrelated jobs. Roughly 35 are small
explanatory prose — whole sentences, including field hints in `AddChannelForm`,
the EULA profile note, the SEO length counter, `tags/[tag]`'s empty state and the
footer credits on four pages. Roughly 10 are true labels: the `AddTopicForm` form
label, `KeeperCharacterCard`'s group header, `LabelManager`'s section title,
`ChannelListInfoCell`'s "createdAt" and "flowTime", reply counts and timestamps.

Two sites are neither, and uppercase would actively misrepresent them:
`User.svelte:24` renders `{account.uid}` and `ChannelSettings.svelte:184` renders
`/channels/{channel.slug}`. Both are case-sensitive identifiers, and
`text-transform` changes what a reader transcribes without changing the value.

Owner decision 2026-07-30: **split into `.text-caption` and `.text-label`, sharing
the same metrics, with `.text-caption` carrying the uppercase.** So `.text-label`
is the label treatment for anything that must preserve its own casing, and
`NumberStat`'s stat key and `FeaturedTags`' `<h2>` join the label set rather than
staying pseudo-headings.

### `text-title` is the missing tier above h1

Owner, 2026-07-30: `text-title` was intended as an "h0" in v20 — one step above h1 —
and never landed. That explains a loose end in v20's own tokens, which keep
`--cn-font-weight-display: 300` with no matching size or line height. The surviving
weight token is half of this tier.

Continuing the 1.414 scale up from h1's 4.24rem gives **6rem (96px)**, on a 104px
line to stay on the 8px grid. Cyan 4's abandoned `display` was 102px on 112px, so
this is the same tier expressed on v20's scale. Define the tokens as
`--cn-font-size-display` and siblings, completing the family whose weight already
exists; expose the utility as `.text-title`, which is what the call sites use.

Of its three existing call sites, only `offline.html.astro:22` is an h0. The two in
`tags/[tag].astro` are section headers over lists — "Discussions (3)", "Pages (5)",
each with an inline icon — and the owner's ruling is that they are **`.text-label`**.
Note for implementation: they carry `<Icon size="small">`, which is 24px against
12px label text, so the icon needs resizing at those sites.

### The remaining sweeps, as ruled

- **Prose sites.** The ~35 whole-sentence `text-caption` sites become `text-small`
  (14px/21px). `.text-label` shares caption metrics at 12px, which is too small for
  sentences, so it stays reserved for labels — including the two case-sensitive
  identifier sites, `User.svelte:24` and `ChannelSettings.svelte:184`.
- **The 9 shapeless `downscaled` sites** — 6 `<span>`, 1 `<section>`, 1 `<header>`,
  1 `<div>` — are deleted. On a `<section>` or `<div>` the class expressed
  inheriting-container intent, not a heading step, and it resolves to nothing today,
  so deletion changes nothing on screen.
- **`text-link`.** All seven occurrences are removed from the six `<a>` elements,
  where cyan-css `core/anchors.css` already colours anchors. Owner ruling:
  **do nothing to the button.** `AlgoliaSearchApp.svelte:204` is a `<button>`
  hand-styled as a link whose colour has been silently missing, and it keeps its
  dead `text-link` class. Recorded as knowingly left, not missed.
- **`--cn-*-ui`.** The five undefined tokens the CodeMirror theme reads are
  repointed at **mono**, because it is a markdown *source* editor. v20 keeps the
  mono family (`--cn-font-family-mono`) but no mono metrics, so this defines a small
  mono tier from Cyan 4's on-grid values: 14px on a 24px line, weight 400, normal
  tracking.
- **Containment audit.** Dissolved. Owner ruling: adopt containment on `main`,
  `article`, cards and list rows; if a card breaks, the fix belongs to the cards
  epic, which is expected soon. No audit gate in this epic.
- **Global element styling.** In scope — "it's the same port". v20's
  `typography-semantics.css` restyling of `<table>`, `<th>`, `<td>`,
  `<blockquote>`, `<ul>`, `<ol>`, `<li>` and `<a>` ports with the rest, rather than
  leaving tables and blockquotes on cyan-css rules while everything around them
  moves.
- **Font faces.** Owner ruling: **keep all of them, and add 500.** The app declares
  12 `@font-face` rules today and none of them is a 500, while v20 uses weight 500
  for buttons, `.text-caption` and `.text-medium` — so those are currently
  browser-synthesised or silently falling back to 400. Adding `lato-medium` and its
  italic makes 14. The font-face story is therefore a payload *increase*, not the reduction
  first proposed, and it buys real 500-weight rendering.
- **Visual acceptance.** No named screen set. The owner looks at what the owner
  looks at; pre-selecting screens was an invented requirement and is dropped.

### Deferred, with a trigger

`utils/snippetHelpers.ts` renders a thread's markdown into a card preview truncated
to 220 characters, and regex-injects `text-h5` onto every `<h1>`–`<h6>` so an
author's heading does not render at 68px inside a card. Two callers only:
`ThreadCard.astro:43` and `ThreadListItem.svelte:24`; everything else uses
`createPlainSnippet`, which strips markdown to text and has no class dependency.

Owner ruling: **leave the helper alone.** The card-preview treatment is decided in
the cards epic, not here. The one thing this epic must still do is change the
`headerClasses` default off `text-h5`, since that class stops existing once the scale lands
and an author `<h1>` would otherwise render at full size.

Recorded separately, because no styling choice fixes it: the helper emits real
`<h1>`–`<h6>` tags into the page, so a front page of ten thread cards injects ten
author-written `<h1>`s into the document heading outline. Screen-reader heading
navigation is wrong today, independently of typography, and it belongs to whoever
owns card previews.

## Stories

The epic's stories and the dependencies between them. Dependencies are facts found
by investigation; how many pull requests each story takes, and in what order they
ship, is a delivery-time decision and is deliberately absent here.

One story is not typography at all, for the reason given under it.

### Preflight

Still the first story. It was drafted 2026-07-30 as a `principles` book named
**Foundations**; it is neither, for two reasons found on 2026-07-31. What that book
would have taught — the reader sets the scale, with its 16/20/24px table — is already
published in the Spatial System book, and `specs/design-system/principles/spec.md`
says a principles book teaches a decision, which a document reset does not. Its home
is a new design-site group, **Base**, placed after Principles and holding Preflight
alone. Tokens keeps its books and its URLs.

**Both versions were supposed to have a preflight modelled on modern-normalize and
Tailwind Preflight, and neither finished one.** Cyan 4 has `core/preflight.css` — box
model, `body { margin: 0 }`, the list reset, `[popover]`, `color-scheme` and the
scrollbar rules — which is a small fraction of that model with none of its
form-control or media normalization. v20 has no preflight file at all: the same job
is done inline in `packages/cyan/src/layouts/AppShell.astro`'s `<style is:global>`
block, with the element-level half in `tokens/typography-semantics.css`, mixed
together with app-shell layout that is not reset material. That inline block is
drift, not a source.

So the story is not "port Cyan 4's reset". It is: write the preflight both versions
intended, with modern-normalize and Tailwind Preflight as the model — copy-pasted
from as a template, as before, not added as a dependency — and Cyan 4's file as the
inventory of what the live application currently depends on. This corrects the
earlier draft of this story, which claimed v20 owned no reset rules at all.

Owner decisions, 2026-07-31:

- Margin zeroing follows Tailwind's enumerated element set, not v20's `*`.
- `astro-island { display: contents }` is kept. cyan-css instead reaches through the
  island with duplicated `.flex-col > astro-island > *` selectors in
  `atomics/flex.css`, which the rule makes redundant.
- Image `max-width` and the scrollbar rules are **not** preflight decisions — the
  first is container-level, the second a themed surface. Both exist today only in
  cyan-css, so the spec records them as knowingly unowned: nothing fails when the
  terminal sweep deletes them, which is exactly why they need writing down.

**Sequencing.** Three of v20's reset rules cannot travel with this story. `* { margin: 0 }`
and its restored list markers depend on add-backs that live in
`typography-semantics.css`, and body's font tokens are typography by definition. All
three ship with the semantics story.

**Already delivered.** The earlier draft called the no-preference colour default "the
one visible change here". `55dafc9` shipped it: `styles/color-theme.css` says
`dark light` and the meta tag agrees. This story carries no visible change.

Deliverables: `specs/design-system/preflight/spec.md`, which owns the rule set;
`packages/design-system/styles/preflight.css`; the Base group and its Preflight book;
and a test asserting the stylesheet matches the spec's enumeration, that every custom
property it reads resolves, and that nothing sets `font-size` on `html` or `:root`.
The test can only police design-system stylesheets, so the app's 18 `px` breakpoints
and `overrides.css` stay uncovered until the breakpoint story. The reader that
changes is the design site: it imports no cyan-css, which is why `styles/docs.css`
has been hand-rolling a reset of its own.

### Compat shim

Enumerate the Cyan-4-only typography tokens in `styles/compat/cyan-4.css` so that
nothing cyan-css or cyan-lit reads goes undefined once the design system defines
typography. The set is: `--cn-font-size-{display,h5,caption,overline,mono}`,
`--cn-line-height-{display,h5,text-small,caption,overline,mono,button}`,
`--cn-letter-spacing-{display,h5,text-small,caption,overline,mono}`,
`--cn-font-weight-{h5,text-button,mono}`, and the aliases
`--cn-text-line-height`, `--cn-text-small-font-size`, `--cn-caption-font-size`.
`--cn-line-height-button` stays a length — that is the whole point. Verified by a
contract test in the shape of `test/token-contract.test.ts`, asserting every name
cyan-css reads still resolves.

No visual change. **Dependency: must land before the scale story.**

Corrected 2026-08-01: the enumerated set above is wrong in both directions. It omits
names the two packages read and never declare — the `heading-4` family,
`--cn-font-weight`, `--cn-font-weight-heading`, `--cn-font-weight-strong`,
`--cn-line-height-ui` — and it lists names cyan-css declares itself, which cannot go
undefined when the design system declares typography. Derive the set from the
installed packages at test time rather than restating it here. The button-collapse
motive is retired by the leading decision.

### The scale

`styles/typography.css` with v20's families, sizes, weights, line-height ratios and
letter spacings; imported from `styles/tokens.css`. A `test/typography.test.ts` in
the shape of `units.test.ts`, asserting the ported values against the v20 source.
Book: Typography, in the `tokens` group.

Three additions to v20's published set, each ruled above: the **h0/display tier** at
6rem on a 104px line, completing the family whose `--cn-font-weight-display` already
exists; the **mono tier** at 14px/24px/400; and **`.text-label`** alongside
`.text-caption`, sharing metrics, without the uppercase.

No application change. **Dependency: the compat shim.**

### The semantics

Port heading, body and utility rules into `styles/typography-semantics.css`,
including the global `<table>`, `<blockquote>`, list and `<a>` rules now in scope;
retire the corresponding cyan-css rules from the app's cascade. Adopt
`container-type: inline-size` on `main`, `article`, cards and list rows.

Carries the call-site sweeps: 70 `downscaled` sites (24 headings to plain `<h4>` or
the next class down, 37 `<p>` to `text-small`, 9 deleted), 16 `text-h5` sites to
plain `<h4>`, ~45 `text-caption` sites split between `text-small` and the two label
classes, 3 `text-title` sites, 6 `text-link` sites, and the `snippetHelpers.ts`
default. Roughly 145 call-site edits.

This is what the owner accepts visually. **Dependencies: the scale, and
preflight** — v20's `ul, ol { padding-left: calc(var(--cn-grid) * 3) }` only makes
sense on top of a stripped list, which the preflight owns.

### Breakpoints in `rem`

Convert the 18-plus `px` queries — 620/621, 760, 768, 880, 1364, 1365, 1380 — to
`rem`, and publish the set as tokens rather than literals. v20 already has the
precedent in `--cn-breakpoint-tray-wide: 64rem`. Also cap the layout chrome, which
is where unbounded scaling actually hurts: `--cn-width-tray` is 21rem, or 504px at a
24px root, and starts eating the content column. `min()` on chrome, nothing clamped
on prose or headings.

Owned by `specs/design-system/design-tokens/spec.md`, which already states that
breakpoints are `rem` for the same reason the grid is — the preflight spec asserts
what the document does, not what a query measures. Note that the semantics story
introduces the first `rem`
breakpoint regardless, since v20's `typography-semantics.css` ships
`@container (max-width: 38.75rem)`.

### The font faces

Move the `@font-face` declarations out of `apps/pelilauta/src/overrides.css` into
the design system, and **add `lato-medium` and its italic** — 12 faces become 14.
Owner ruling: keep every existing weight, because all of them may end up needed.
This is a payload increase rather than the reduction first proposed, and what it
buys is real 500-weight rendering for buttons, `.text-caption` and `.text-medium`,
which are currently browser-synthesised from 400.

Independent of the others.

## Verification

Parity verification does not apply here, and saying so up front matters: this
epic changes appearance by design, so the contract tests can only assert that
**names resolve** and that **ported values equal the v20 authority**. Appearance
is the owner's visual acceptance.

What must be deterministic:

- Every typography custom property cyan-css and cyan-lit read resolves to a value
  of the right *type* — length where a length is used, ratio where a ratio is used.
  The button-height case is the regression test that earns this.
- Ported values equal `pelilauta-20-ds/packages/cyan/src/tokens/typography.css`.
- E2E: an app screen with buttons, a card-embedded heading and a `text-caption`
  label, so the container-query and button-height failures are caught by a check
  rather than by a human noticing.

## Open

- Whether the 2026-07-30 decisions in `plans/core-tokens.md` — salvaged onto this
  epic from the abandoned `feat/ds-foundations` — belong in
  `specs/design-system/design-tokens/spec.md` instead, where the spec rather than
  a plan would own them.
- ~~`packages/design-system/styles/units.css` carries a false commit citation.~~
  Settled 2026-07-31 in the units-lexicon story: the citation is gone from both
  `units.css` and `icon.css`, which carried the same one. The accompanying claim
  that cyan-css's radius annotations are stale was re-checked rather than
  inherited, and is correct — cyan-css comments `large` as 12px and `xl` as 16px
  where its own formulas compute 16px and 32px.
- ~~Does `styles/icon.css` fold into the token entry point?~~ Settled in the
  preflight story: `tokens.css` imports it, and the icon values are published in
  the Units and grid lexicon as the spatial-system spec says they should be.
- The terminal Cyan sweep unblocks once the semantics land, since typography is the last
  token family cyan-css supplies. `docs/MIGRATION.md` owns that sweep.
