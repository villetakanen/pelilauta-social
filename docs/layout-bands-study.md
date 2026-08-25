# Layout Bands Study

What the fourth layout band is, where it begins, and what the chrome, the content
compositions, the footer and the editor do in each band.

**Status: analysis complete.** The wide band is derived and stated; nothing is
implemented. The [implementation steps](#implementation-steps) are the work.

## Why this exists

v21 answers three container widths: small ends at `--cn-breakpoint-small: 38.75rem`
and tablet at `--cn-breakpoint-tablet: 64rem`
(`packages/design-system/styles/units.css:115-116`). A fourth was suspected and could
not be recovered from the sources. v18 predates the rail. v20 declares
`--cn-breakpoint-tray-wide: 64rem`
(`../pelilauta-20/packages/cyan/src/tokens/units.css:30`) and consumes it nowhere — a
search over the repository returns the declaration alone. v21 read that orphaned value
as the width where the desktop band begins; the band the token was named for was never
built, there or here.

With Cyan's unrelated thresholds gone from the surfaces already migrated, the
remaining system is small enough that the fourth band stops being a guess: it is
arithmetic over the tokens. Cyan's numbers (760px, 1365px, 1380px) leave with Cyan and
appear in no calculation below.

The first three bands of the model this study states match the shipped behaviour
(`packages/design-system/components/CnRail.astro:241-338`,
`packages/design-system/styles/rail.css:14-43`). The wide band is the one addition.

## The rule

The layout is wide when the expanded rail and one gap fit inside the inline margin a
centred composition leaves. Below that width the rail's cede narrows the content; at
and above it, the rail occupies space the content was not using, and opening or
closing it moves nothing.

## Inputs

All from `packages/design-system/styles/units.css` and
`packages/design-system/styles/content-containers.css`. One step is `--cn-grid`, 8px.

| Quantity | Steps | rem | px | Source |
| :--- | ---: | ---: | ---: | :--- |
| `--cn-gap` | 2 | 1 | 16 | `units.css:8` |
| `--cn-width-rail-collapsed` | 10 | 5 | 80 | `units.css:101` |
| `--cn-width-rail-expanded` | 32 | 16 | 256 | `units.css:102` |
| Prose composition (`--cn-measure`) | 83 | 41.5 | 664 | `units.css:19` |
| Golden composition (83 + 2 + 32) | 117 | 58.5 | 936 | `content-containers.css:153` |
| Triad composition (51 + 2 + 32 + 2 + 32) | 119 | 59.5 | 952 | `content-containers.css:139` |
| `--cn-breakpoint-small` | 77.5 | 38.75 | 620 | `units.css:115` |
| `--cn-breakpoint-tablet` | 128 | 64 | 1024 | `units.css:116` |

The small breakpoint is the one value off the grid: 77.5 steps, inherited from Cyan's
620px. Whether to move it to 78 steps is a separate decision, outside this study.

## Derivation

`.app-main` pads itself one gap each side and centres a composition in what remains
(`app-main.css:14-19`). The padding folds into the margin, so with the rail ceding
nothing, the free space either side of a composition of width W in a viewport of
width V is (V − W) / 2.

The rule asks that space to hold the expanded rail and one gap:

    (V − W) / 2 ≥ 32 + 2 steps
    V ≥ W + 68 steps

| Composition | W | Wide begins at | rem | px |
| :--- | ---: | ---: | ---: | ---: |
| Prose | 83 | 151 | 75.5 | 1208 |
| Golden | 117 | 185 | 92.5 | 1480 |
| Triad | 119 | **187** | **93.5** | **1496** |

The rule says "a composition"; the chrome is one. A threshold read per route would
flip the rail's behaviour with the page under it, so the widest composition governs:

**The wide band begins at 187 steps: 93.5rem, 1496px.**

Every input is a grid multiple, so the threshold lands on the grid. A query cannot
read a custom property, so the rule states the literal and a test derives it from the
tokens — the same guard `content-containers.test.ts` places on 59.5rem
(`content-containers.css:134-138`).

Following the naming at `units.css:109-113` — a breakpoint names the band it ends —
the token is `--cn-breakpoint-desktop: 93.5rem`.

## The four bands

| Band | Container width | Rail at rest | Rail expanded | Composition centres in |
| :--- | :--- | :--- | :--- | :--- |
| small | ≤ 38.75rem | absent | over the page, with a scrim | the viewport, stacked |
| narrow | 38.75–64rem | beside the page, ceding 10 steps | over the page, with a scrim | the remainder |
| desktop | 64–93.5rem | beside the page, ceding 10 steps | beside the page, ceding 32 steps | the remainder |
| wide | ≥ 93.5rem | in the margin, ceding 0 | in the margin, ceding 0 | the viewport |

In the wide band the rail keeps the desktop band's behaviour — it rests collapsed and
the wide toggle expands it — and stops being a layout event: both states fit inside
the margin the centred composition leaves, so `--cn-rail-occupies` stays at zero and
the toggle repaints the rail alone.

## Crossing the threshold

The composition re-centres from the remainder to the viewport, so crossing into wide
moves it toward the rail by half of what the rail was ceding: 5 steps (40px) with the
rail at rest, 16 steps (128px) with it expanded. The shift is constant — the algebra
cancels V — and happens on resize, not on toggle; the margin transition at
`rail.css:42` already animates the margin's changes. At exactly 187 steps with the
triad, the margin is 34 steps: the expanded rail and its gap, with nothing spare.

## Worked examples

Triad route. Container width is V minus what the rail cedes minus two gaps; the triad
needs 119 steps (952px) of it to hold three regions.

| Viewport | Band | Triad, rail at rest | Triad, rail expanded |
| ---: | :--- | :--- | :--- |
| 768 | narrow | stacked (656px container) | stacked, rail covers |
| 1024 | desktop | stacked (912px) | stacked (736px) |
| 1200 | desktop | three regions (1088px) | stacked (912px) — expanding reflows |
| 1280 | desktop | three regions (1168px) | three regions (992px) |
| 1440 | desktop | three regions (1328px) | three regions (1152px) |
| 1496 | wide | three regions (1464px) | three regions — toggle moves nothing |
| 1920 | wide | three regions, 484px margins | the same |

The 1200px row names the desktop band's price: between 1064px and 1240px, expanding
the rail stacks a three-region triad (for the golden, between 1048px and 1224px). The
wide band bounds that window; it does not remove it. It is inherent to ceding inline
size to the rail, and this study accepts it.

## The bar

The application bar spans the whole inline size in every band and cedes nothing
(`rail.css:32-39`); its leading padding aligns to the rail axis from the small
breakpoint up (`CnAppBar.astro:207`). The wide band changes nothing for it.

## The footer

The footer is rebuilt later; it currently uses Cyan's `.content-columns`, whose
thresholds leave with Cyan. What every band requires of the rebuilt footer: render it
inside `.app-main`, or give it the host's geometry — the gap padding, the rail cede,
the centring — and all four bands arrive with no footer-specific rule. Its three sections
are a triad.

## The editor

Editor routes mount no rail: the chrome holds the modal bar alone
(`apps/pelilauta/src/layouts/EditorPage.astro:34-41`). The narrow, desktop and wide
bands therefore do not exist there. The shell is its own container at the viewport
minus two gaps at every width (`packages/editor/CnEditorShell.svelte:288-296`), and
its one width response — frontmatter beside the canvas at 58.5rem
(`CnEditorShell.svelte:363`) — arrives at a 968px viewport. The wide band changes
nothing for the editor.

## Implementation steps

1. Add `--cn-breakpoint-desktop: 93.5rem` to `tokens/units.json` and regenerate, with
   the band-naming comment convention of `units.css:104-116`.
2. Add the wide window to `rail.css`: at and above 93.5rem, `--cn-rail-occupies`
   returns to `0rem` for both rail states. The zeroing selector must match the
   specificity of the checked-state selector at `rail.css:27`, or the expanded rail
   keeps ceding in the wide band:

   ```css
   @media (min-width: 93.5rem) {
     [data-cn-rail-scope]:has(.cn-rail),
     [data-cn-rail-scope]:has(.cn-rail-toggle.wide:checked) {
       --cn-rail-occupies: 0rem;
     }
   }
   ```

   `rail.css` states its thresholds as `@media` because `.app-main` has no ancestor
   container to query; the chrome container is a fixed viewport box, so the two forms
   resolve to the same width. The new window follows the file's form.
3. Pin the literal with a derivation test: 93.5rem equals the triad's tracks and gaps
   plus twice the expanded rail and a gap, computed from the tokens, failing on drift.
4. Change nothing else. `CnRail`, `CnRailAction`, `content-containers.css` and the
   editor shell are already correct in the wide band: the compositions respond to
   their container, and the container widens by exactly what the rail stops ceding.

## Readings this study settled

- "Fits the margin of any composition" is read as the widest composition. The cost: a
  prose-only route cedes 10 steps between 75.5rem and 93.5rem although its margin
  could hold the rail. One chrome behaviour is worth that.
- The rail rests collapsed in the wide band, as it does in the desktop band. Resting
  it expanded would cost no space there, but the rest state would then change on
  resize, and the model says wide behaves as desktop.
