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

## Decisions needed before implementation

1. **Approved appearance exception.** Every heading, all body copy, 101
   `text-small`/`text-caption` call sites and possibly every button change. This
   needs the same kind of explicit approval the colour port had, and it needs
   visual acceptance, not parity verification.
2. **`text-h5`, `downscaled`, `text-link`, `text-title`.** For each: real v21
   vocabulary to define, a mistaken name to correct at the call site, or dead
   weight to delete. 96 call sites total.
3. **`.text-caption` uppercase.** Adopt v20's transform, or port the metrics and
   drop the transform.
4. **`--cn-*-ui`.** Define the family, point the editor at real tokens, or retire it.
5. **Container queries on `main, article`.** Adopt v20's mechanism, or keep the
   620px media query for this epic and defer the switch.
6. **Global element styling.** v20's `typography-semantics.css` also restyles
   tables, blockquotes, lists and links. In or out of scope.

## Proposed slices

Each slice is one PR, each is a drop-in replacement, each is independently
reversible.

1. **Compat shim first — no visual change.** Enumerate the Cyan-4-only
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

2. **Own the scale.** `styles/typography.css` with v20's families, sizes,
   weights, line-height ratios and letter spacings; imported from
   `styles/tokens.css`. A `test/typography.test.ts` in the shape of
   `units.test.ts`, asserting the ported values against the v20 source below.
   Book: Typography, in the `tokens` group. No application change yet.

3. **Own the semantics.** Port heading, body and utility rules into
   `styles/typography-semantics.css`; resolve the four dangling names from
   decision 2; retire the corresponding cyan-css rules from the app's cascade.
   This is the slice the owner accepts visually, and the largest one.

4. **Own the font.** Reduce `overrides.css` to v20's weight set, drop the woff
   fallbacks, verify no call site needs 100/200/900, move the declarations into
   the design system.

Slice 3 may need splitting once decision 2 is made — 96 call sites across headings,
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
