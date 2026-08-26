# Chat Bar Field Study

Design reasoning for the surface a reader types a reply into.

The epic's goal is the chat bar, and this study reaches no further. It settles nothing
about forms. The tokens and the states it names are the general ones, so an input layer
can adopt them later without unpicking the work.

**Status: complete.** Every question this study opened is answered, except the focus
ring's geometry, which [no repository here can settle](#what-the-repositories-cannot-settle)
and which the implementation takes from the accessibility requirement instead.

## Why this exists

`CnChatBar` does not read as a surface a reader can type into. Its textarea carries
`padding: 0; border: none; background: none;` and one `:focus-visible` outline. There is
no hover, no resting affordance, no placeholder treatment and no field boundary.

That is what v21 defines. `packages/design-system/styles/` carries no input stylesheet.
`preflight.css:50-54,73-79` touches `textarea` for font inheritance and `resize` alone.
`semantic.css:93-94` defines `--cn-color-input` and `--cn-color-on-input`, and stops there.

Three independent reviews concluded that the epic needs neither forms nor form inputs.
That conclusion holds. What it missed is that a component with no form still needs a
state model, and v21 has none to draw on.

## What the earlier versions carry

Cyan 4 holds the last element style in the line.
`../cyan-design-system-4/packages/cyan-css/src/core/textarea.css` paints a filled box
with a bottom border, `padding: var(--cn-grid)`, a minimum height, and rules for
`:hover`, `:focus`, `:disabled`, `::placeholder` and `[data-error]`.

The v20 line dropped it. Neither `../pelilauta-20` nor `../pelilauta-20-ds` carries a
`textarea` or `input` stylesheet. Both carry five tokens under an `Inputs / Forms`
heading (`../pelilauta-20-ds/packages/cyan/src/tokens/semantic.css:90-95`):

```css
--cn-input:          light-dark(var(--chroma-surface-80), var(--chroma-surface-0));
--cn-on-input:       var(--cn-on-surface);
--cn-input-hover:    light-dark(var(--chroma-surface-70), var(--chroma-surface-0));
--cn-input-focus:    light-dark(var(--chroma-surface-70), var(--chroma-surface-0));
--cn-input-disabled: light-dark(var(--chroma-surface-80), var(--chroma-surface-20));
```

The single consumer is the editor theme, at
`../pelilauta-20-ds/packages/cyan-editor/src/cnEditorTheme.ts:16,32,37` and
`styles.css:21`. `../pelilauta-20-ds/specs/cyan-ds/cyan-editor/spec.md:56` states the
model that replaced the element style: "The editor renders as a cyan input field, not a
generic textarea." Under that model each component paints itself from the tokens, and no
element baseline exists to inherit.

v21 lifted two of the five tokens. The other three were rewritten as literals in
`styles/compat/cyan-4.css:93-105`, where they resolve for legacy Cyan selectors and reach
nothing native. Their values match the 20-ds originals step for step.

## Where the tokens place a field

All values are OKLCH lightness at hue 242, from `chroma.css:27-39`. Placements are from
`semantic.css:6-19, 85, 93`.

| Role | Light | L | Dark | L |
| :--- | :--- | ---: | :--- | ---: |
| Page, `--cn-color-surface` | surface-95 | .95 | surface-20 | .20 |
| `--cn-color-surface-1`, `--cn-color-surface-2` | surface-100 | 1.0 | surface-30 | .30 |
| `--cn-color-surface-3` | surface-100 | 1.0 | surface-40 | .40 |
| `--cn-color-input` | surface-80 | .80 | surface-0 | 0 |
| `--cn-color-border` | surface-70 | .70 | surface-30 | .30 |
| `--cn-color-on-input` | surface-10 | .10 | surface-90 | .90 |

The placement is consistent across schemes: a field is darker than the surface holding
it.

## Two defects in the inherited tokens

**Hover and focus carry the same value.** `--cn-input-hover` and `--cn-input-focus`
resolve identically in both schemes. The token set cannot distinguish the two states.

**Dark mode has no room to move, and the direction is inverted.** Dark rest is
surface-0, the end of the scale, and both state tokens resolve to surface-0 as well, so
a dark field cannot change at all. Moving further down is the wrong direction in any
case: `--cn-color-on-input` is surface-90 on a surface-0 field, which is already the widest
contrast the scale offers. The light-mode move from surface-80 to surface-70 narrows the
contrast between the text and the field rather than widening it.

## Where the focus ring comes from

v20 defines `--cn-focus-ring` as `light-dark(var(--chroma-primary-60), var(--chroma-primary-40))`
at `../pelilauta-20-ds/packages/cyan/src/tokens/semantic.css:70`, the value v21 carries.
It applies the ring at `utilities/chip.css:50`, `core/buttons.css:105` and
`CnCard.svelte:214,273`, specifies it at `specs/cyan-ds/utilities/chip/spec.md:69` and
`specs/cyan-ds/core/buttons/spec.md:66`, and documents it at
`app/cyan-ds/src/content/styles/chip.mdx:91`.

Every site is an actionable control: a chip, a button, a card. v20 carries no field, so
it rules on no field.

Cyan 4 rules the other way for the one version that has a field. `textarea:focus` sets
`outline: none` and signals with `--color-input-focus` and the bottom border
(`../cyan-design-system-4/packages/cyan-css/src/core/textarea.css`).

So the colour is inherited and the placement is not: extending the ring from an
actionable control to a field is a v21 addition that no version decided, against the one
precedent that exists. Ruling 10 keeps it anyway, on the accessibility requirement rather
than on the precedent. Its geometry is out of reach here; see
[What the repositories cannot settle](#what-the-repositories-cannot-settle).

## Where the headroom went

Cyan 4's textarea already carried the model the product owner ruled for: three states,
each with its own background and its own border colour, on a bottom border alone
(`../cyan-design-system-4/packages/cyan-css/src/core/textarea.css`).

It also had room to move in both schemes, because its surface scale runs the other way.
`--chroma-surface-10` is the light page colour and `--chroma-surface-99` the darkest
(`tokens/chroma.css:114,152`). A Cyan 4 field sat one step in from either end: light rest
surface-20 against a surface-10 page, dark rest surface-95 against a surface-90 page
(`tokens/colors.css:8,193,198`).

v20 re-pointed the same five roles onto a scale where the numbers mean the opposite, and
pinned dark rest to surface-0, the end of it. The headroom did not survive the port. v21
inherited the pinned values. The defect this study found in dark mode is a porting error,
not a decision any version made.

Cyan 4's hover was broken at the wiring rather than the values. `--color-input-hover` is
defined at `tokens/colors.css:193` and never read; `textarea:hover` reads
`--color-field-hover`, which resolves to `var(--color-input)` — the resting value. Three
named states, two visible ones.

## Settled

Recorded from the product owner, 2026-08-19.

1. **The bar is the field.** Its surface is restyled as an input rather than holding a
   field inside itself. The `+` menu action and the `→` send action sit inside the
   field's border.
2. **The bar keeps elevation 4**, the level for system controls. The elevation supplies
   the shadow and the tier. The surface background and the surface padding are not
   visible, because the input styling replaces both.
3. **The border is a hairline, derived from the grid rather than pinned to a device
   pixel.** `calc(var(--cn-grid) / 8)` is 1px at the default root size and grows with the
   reader's font setting. The divisor is the calibration knob if it wants to be heavier.
4. **Rest, hover and focus each carry their own background colour and their own border
   colour.** Every field the system grows will carry the three.
5. **A field draws a bottom border; the chat bar draws a full one.** The bar is a
   container the reader types into, not a line of a form.
6. **The field never paints an error.** A field error reports input the field rejects. A
   failed send is not rejected input, so it stays in the `supporting` region with its
   retry. v21 therefore needs no equivalent of Cyan 4's `[data-error]` treatment.
7. **Focus raises the contrast of the reader's words against the field they sit in**,
   not the contrast of the field against the page. The two point opposite ways, and this
   is the one that matters. Ruling 15 carries it out.
8. **Focus shows for a reader who taps, not only for one who tabs.** Most readers reach
   the composer by touch, and `:focus-visible` does not fire for them. The state the
   component paints is `:focus-within`.
9. **Hover covers the whole bar.** The bar reads as one object, so the pointer lifts all
   of it. The two actions keep their own hover on top.
10. **The bar keeps a focus ring.** A visible keyboard focus marker is an accessibility
    requirement, and a 1px border moving colour does not reliably meet it.
11. **`disabled` is a send in flight, not a blocked composer.** While the reply posts,
    the bar waits: the reader's text stays legible, a progress indicator replaces the
    `→`, and neither typing nor sending is accepted. It is a busy state, and the prop
    is misnamed.
12. **The placeholder clears when the reader reaches the bar**, before the first letter.
13. **The hint is cerulean**, from the surface family the bar itself is built from, not
    the primary family and not a neutral grey. One hue holds the whole surface.
14. **The system, not the chat bar, governs the placeholder treatment.** Every field the
    system grows inherits it, and nobody decides it a second time.
15. **Focus is a warm tint from the primary family, not a step along the surface scale.**
    Light focus is `--chroma-primary-99`; dark focus is `--chroma-primary-10` on a
    `--chroma-surface-10` field. Hue separates the focused field from the surface holding
    it, so the field needs no room on the lightness scale and the dark-end squeeze does
    not arise.
16. **Hover stays in the cerulean surface family, one step.** Hover and focus are
    different kinds of signal rather than two volumes of one, so hover does not preview
    the tint.
17. **The model belongs to every field, and is checked against every field.** The chat
    bar is the first one to need it, not the only one it governs.
18. **A field rests as a dip below the surface holding it, and hover rises toward that
    surface.** Reaching for the field brings it up to meet the pointer; focus then
    changes hue rather than continuing the movement.
19. **The family is named `--cn-color-field`.** The platform defines `field` as its own
    word — CSS system colours pair `Field` with `FieldText`, and `field` covers a
    textarea and a select as honestly as an input, which `input` does not. The owner
    decides the `color` segment, which puts the family out of step with the 33 unmarked
    colour roles in `semantic.css`; `plans/debt/colour-token-naming.md` carries that.
20. **`ARCHITECTURE.md` gains a `:focus-within` row.** Its state table
    (`ARCHITECTURE.md:74-82`) reserves a name for every state selector the system uses
    and has none for the reader being inside a field. The row names the selector, because
    the standard's vocabulary is the vocabulary.

### Consequences to carry into implementation

- `.surface` also declares `container: surface-area / inline-size` (`surface.css:29-34`).
  Dropping the class to restyle the bar drops that container, so the component restates
  it.
- Ruling 2 leaves the bar's padding undefined. Cyan 4 used `var(--cn-grid)` on the
  element and a minimum height of `calc(var(--cn-grid) * 5 - 1px)`; `CnChatBar` sets
  `padding: 0` and no minimum. The spacing the first reading of this defect blamed has
  the same root cause as the missing states.
- `--cn-color-input` has one other consumer in the wider line, the editor theme. A change to
  the resting value reaches it.
- Ruling 11 renames the prop and splits its treatment from the opacity drop `CnChatBar`
  applies today (`CnChatBar.svelte:224,285-287`).

## Where focus comes from

v19 shaded the focused field warm in light mode, and the product owner recovered it from
that version. No repository here holds v19, so this study records it as testimony.

Our own palette confirms the reading. The primary family rotates hue as it lightens —
`oklch(... 185)` at the dark end, `oklch(... 110)` at the light end
(`chroma.css:14-26`) — so its light end is already yellow. `--chroma-primary-99` is
`oklch(0.99 0.05 110)`: white with a warm cast. v19 was not reaching outside the palette.
It was using the sunlit end of it, which is what the theme calls the family — "a northern
forest under the sun" (`tokens/themes/default.json:3`).

The move this unlocks is that a focused field differs from its surface in **hue** rather
than lightness. Near-white but warm on a white surface; near-black but teal on a cerulean
one. Both ends of both schemes work, and the crowding at the dark end of the surface scale
stops mattering.

## What the repositories cannot settle

The width and offset of the focus ring. Every ring in v20 and Cyan 4 carries the same
geometry, and the repetition is not evidence: a wrong value copied is one value and
several copies. No version of this system reasoned about ring geometry in a document, so
there is nothing to read. The geometry comes from what the accessibility rule requires,
at the point where the component is drawn, and this study does not settle it.

Reopening the question against the codebases is how the previous session lost itself.

## The state colours

The surface a field sits on is a raised one, not the page. Every value below is a step
from that surface.

| | Light | Dark |
| :--- | :--- | :--- |
| The surface behind it | surface-100 | surface-30 |
| **Fill**, rest | surface-80 | surface-10 |
| **Fill**, hover | surface-90 | surface-20 |
| **Fill**, focus | primary-99 | primary-10 |
| **Border**, rest | surface-70 | surface-30 |
| **Border**, hover | primary-60 | primary-40 |
| **Border**, focus | primary-70 | primary-30 |
| **Placeholder** | surface-50 | surface-70 |

Rest and hover stay in the cerulean family and read as a dip that rises under the pointer.
Focus leaves the family: it is near-white-but-warm on a white surface, and
near-black-but-teal on a cerulean one. The reader's words gain contrast against the field
in both schemes, and the field separates from its surface by hue rather than by lightness.

Light rest is where `--cn-color-input` already sits. The only value the port broke is the dark
one, pinned to surface-0; it moves one step off the floor. That change reaches the editor
theme, which reads the same role, and it should — ruling 17 governs the editor too.

The border steps come from one rule: focus takes the resting border's own step in the
primary family, and hover takes one step further from the surface behind the field. Both
schemes then agree that the hover border is the stronger of the two. Focus does not need
its border to shout, because its fill has already changed family.

The placeholder is measured rather than chosen. Ruling 13 sets the family and the owner
set the floor at the 3:1 contrast a non-text element must meet, so the value is the
faintest step that clears it against the resting fill: surface-50 at 4.56 in light,
surface-70 at 4.20 in dark. surface-60 fails in both, at 2.79 and 2.37.

One caution for whoever writes a contrast test. Our surface steps are saturated at hue
242, and the WCAG luminance formula weights blue at 7%, so surface-10 through surface-50
sit at almost the same luminance despite four steps of lightness between them. They differ
plainly to the eye — OKLCH lightness is the honest measure there — but contrast arithmetic
on the dark end of the scale will not agree with what a reader sees.

## The placeholder

The hint is drawn from the cerulean surface family, at a step strong enough to read, and
the system governs that treatment for every field rather than the chat bar alone.

The grey that started this study is not a decision anyone took. `CnChatBar` writes no
`::placeholder` rule and `styles/` carries no placeholder colour, so in `apps/design` —
which loads `ds.css` alone (`Book.astro:13`) — the browser paints it. It is the one
neutral thing on a screen whose every other surface is tinted.

The application does not show the same field. `BaseHead.astro:6` loads
`@11thdeg/cyan-css` on every page, so Cyan 4's `textarea::placeholder` applies there:
italic, at `--color-on-field-placeholder`, which `compat/cyan-4.css:109` maps to
`--cn-color-on-surface-secondary`. A field therefore reads one way in the book and another in
the product, and neither is the design system's. That divergence, rather than the grey
itself, is what a field capability has to close.
