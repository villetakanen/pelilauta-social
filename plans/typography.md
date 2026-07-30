# Typography Token Ownership

Status: Draft 2026-07-30 — initial plan, not approved
Branch: not opened (proposed `feat/ds-typography`)
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

One consequence worth stating before slice 2 is written: v20's `typography.css`
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
button in the application **1.5 pixels tall**. Twenty-two cyan-css source files
and seven cyan-lit bundles read typography tokens, so this class of failure is
not confined to buttons.

## What the application actually consumes

Measured on `apps/pelilauta/src`, 2026-07-30.

**Almost nothing reads the tokens directly** — two files, both CodeMirror
(`cnEditorTheme.ts`, `CodeMirrorEditor.svelte`), and five of the seven names they
read are `--cn-*-ui` (`--cn-font-family-ui`, `-font-size-ui`, `-font-weight-ui`,
`-letter-spacing-ui`, `-line-height-ui`). **That family is defined nowhere** — not
in v20, not in Cyan 4, not in the app. The editor has been taking initial values
in production. Same shape of defect as the dangling radius names.

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

## Decisions settled 2026-07-30

**No appearance exception is needed.** `AGENTS.md` already states that appearance
is not a compatibility contract and that v18 is not its reference, so the type
scale moving is the sanctioned direction of travel, not an exception to it. What
the epic needs from the owner is visual acceptance of running screens, once, at
the semantics slice. Only two items in this epic stop being appearance and become
behaviour, and both are called out separately: button height (slice 2) and
`container-type` on `main, article` (decision 4).

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
decisions about them. Slice 5 converts them.

## Decisions still open

1. **`text-h5`, `downscaled`, `text-link`, `text-title`.** For each: real v21
   vocabulary to define, a mistaken name to correct at the call site, or dead
   weight to delete. 96 call sites total.
2. **`.text-caption` uppercase.** Adopt v20's transform, or port the metrics and
   drop the transform.
3. **`--cn-*-ui`.** Define the family, point the editor at real tokens, or retire it.
4. **Container queries on `main, article`.** The accessibility requirement changes
   the lean here. A `rem` container query means that as the root grows the
   container measures fewer `rem`, so an h1 downshifts to h2 sooner — the mechanism
   does the large-text work by itself, and without it a 4.24rem h1 is ~102px at a
   24px root. So v20's mechanism is wanted, not merely tolerated. The
   containing-block hazard is unchanged and still needs the audit.
5. **Global element styling.** v20's `typography-semantics.css` also restyles
   tables, blockquotes, lists and links. In or out of scope.

## Proposed slices

Each slice is one PR, each is a drop-in replacement, each is independently
reversible. The epic opens with a slice that is not typography, for the reason
given below.

1. **Foundations.** Owner decision 2026-07-30: this is the first story, it is a
   `principles` book named **Foundations**, and `preflight` is in this epic's
   scope.

   The reason it comes first is not tidiness. The document reset is currently
   `@11thdeg/cyan-css/src/core/preflight.css`, pulled in live by
   `import '@11thdeg/cyan-css'` at `BaseHead.astro:5`. It owns `box-sizing:
   border-box` on `*`, `body { margin: 0 }`, the `ol, ul` list reset, the
   `[popover]` reset, `:root { color-scheme }` and every scrollbar rule;
   `core/body.css` owns background, foreground and font smoothing. Nothing in
   `packages/design-system` owns any of it, so the terminal Cyan sweep would
   delete the reset out from under the application. Typography depends on it
   directly — v20's `ul, ol { padding-left: calc(var(--cn-grid) * 3) }` only makes
   sense on top of a stripped list.

   Deliverables, per the design-system completeness rule:

   - `specs/design-system/foundations/spec.md`. Intent: the system scales
     proportionally with the reader's font-size preference and never overrides it;
     the design system owns what it asserts about the document root. Contract: no
     stylesheet sets `font-size` on `html` or `:root`; every length derives from
     `--cn-grid: 0.5rem` in `rem`; breakpoints are `rem`; `color-scheme` is
     declared once and the meta tag agrees with it; the reset belongs to the
     design system.
   - `packages/design-system/styles/reset.css`, porting `preflight.css` and
     `body.css` onto design-system token names. Kept out of `tokens.css`, because
     a reset is not a token. The scrollbar rules read
     `--cn-scrollbar-width`, `--cn-scrollbar-border-radius` and
     `--color-scrollbar-*`; those need enumerating and either owning or adding to
     `compat/cyan-4.css`.
   - `test/foundations.test.ts` — no `html`/`:root` `font-size`, no `px`
     `font-size`, no `px` breakpoint. State the blind spot plainly: it can only
     police design-system stylesheets, so the app's 18 `px` breakpoints and
     `overrides.css` stay uncovered until slice 5.
   - `books/principles/FoundationsBook.astro` +
     `apps/design/src/content/principles/foundations.mdx`. Demonstrable rather
     than prose: panels at a 16px, 20px and 24px root showing grid, type and
     breakpoints moving together.

   **The one visible change in this slice.** Three places declare the
   no-preference colour default and they disagree: `preflight.css` says
   `dark light`, `styles/color-theme.css` says `light dark`, and the
   `BaseHead.astro` meta tag says `dark light`. `tokens.css` is imported after
   cyan-css at equal specificity, so the design system's `light dark` wins today
   and both apps default to **light** — and because the CSS property overrides the
   meta tag, that `dark light` meta is inert. Owner decision 2026-07-30:
   **`dark light` is correct, the meta tag is right.** So this slice flips the
   first-paint default for readers with no OS preference, in both the app and the
   design site, and makes the meta tag meaningful again.

2. **Compat shim — no visual change.** Enumerate the Cyan-4-only
   typography tokens in `styles/compat/cyan-4.css` so that when the design
   system's definitions arrive, nothing cyan-css or cyan-lit reads goes
   undefined. The set is: `--cn-font-size-{display,h5,caption,overline,mono}`,
   `--cn-line-height-{display,h5,text-small,caption,overline,mono,button}`,
   `--cn-letter-spacing-{display,h5,text-small,caption,overline,mono}`,
   `--cn-font-weight-{h5,text-button,mono}`, and the aliases
   `--cn-text-line-height`, `--cn-text-small-font-size`, `--cn-caption-font-size`.
   `--cn-line-height-button` stays a length here — that is the point of the slice.
   Verified by a contract test in the shape of `test/token-contract.test.ts`,
   asserting every name cyan-css reads still resolves.

3. **Own the scale.** `styles/typography.css` with v20's families, sizes,
   weights, line-height ratios and letter spacings; imported from
   `styles/tokens.css`. A `test/typography.test.ts` in the shape of
   `units.test.ts`, asserting the ported values against the v20 source below.
   Book: Typography, in the `tokens` group. No application change yet.

4. **Own the semantics.** Port heading, body and utility rules into
   `styles/typography-semantics.css`; resolve the dangling names from decision 1;
   retire the corresponding cyan-css rules from the app's cascade. This is the
   slice the owner accepts visually, and the largest one.

5. **Breakpoints in `rem`.** Convert the 18-plus `px` queries — 620/621, 760, 768,
   880, 1364, 1365, 1380 — to `rem`, and publish the set as tokens rather than
   literals. v20 already has the precedent in `--cn-breakpoint-tray-wide: 64rem`.
   Also cap the layout chrome, which is where unbounded scaling actually hurts:
   `--cn-width-tray` is 21rem, or 504px at a 24px root, and starts eating the
   content column. `min()` on chrome, nothing clamped on prose or headings.

   Sequenced after the semantics slice but stated in the Foundations spec, because
   it is a consequence of that principle rather than a separate one. Slice 4
   introduces the first `rem` breakpoint regardless, since v20's
   `typography-semantics.css` ships `@container (max-width: 38.75rem)`.

6. **Own the font.** Reduce `overrides.css` to v20's weight set, drop the woff
   fallbacks, verify no call site needs 100/200/900, move the declarations into
   the design system.

Slice 4 may need splitting once decision 1 is made — 96 call sites across headings,
`text-small` and `text-caption` is plausibly two PRs rather than one.

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
- `packages/design-system/styles/units.css` on `main` carries a false commit
  citation (above). Correcting it is not typography work, but this epic is where
  it was found, and the same comment also claims the two stale cyan-css radius
  annotations are wrong — a claim worth re-checking rather than inheriting.
- Does `styles/icon.css` fold into the token entry point? Inherited open question
  from the core-token epic; typography does not settle it.
- The terminal Cyan sweep unblocks after slice 4, since typography is the last
  token family cyan-css supplies. `docs/MIGRATION.md` owns that sweep.
