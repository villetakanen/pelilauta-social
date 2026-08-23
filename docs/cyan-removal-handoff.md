# Deprecate Cyan — Working Log

Where the epic stands, for the session that picks it up next. Scope, guardrails and
step order are in `plans/deprecate-cyan-and-qol.md`; this file holds state and traps.
Delete it when the epic closes.

## State

Branch `feat/deprecate-cyan-and-qol`, version `21.0.0-beta.42` — bumped already, so no
further bump on this branch. `apps/design`'s Playwright suite passes 327/327 and
`pnpm test` 786; any failure in either is real.

`apps/pelilauta` imports no Cyan CSS. `@11thdeg/cyan-lit` stays imported and rendering,
as the epic's guardrail requires. Two removals from the plan have not happened:
`@11thdeg/cyan-css` is still a dependency at `apps/pelilauta/package.json:29` with
nothing importing it, and `apps/pelilauta/src/overrides.css` still exists and is still
imported by `BaseHead.astro:7` and `EditorHead.astro:3`.

## What the triage has fixed

Every page names itself in view, and the front page's streams are named rather than
carrying a hidden heading that copied the document title (`44adddb5`).

Content container layouts gained the rule they were missing: every content area — a
Prose flow root, or an occupied Golden or Triad region — separates its children by
`--cn-line`, and the three modes differ only in the width they offer and in Prose's
breakout. `--cn-gap` is now the inline gap and the page-edge inset, nothing else
(`f532ce68`, `3c4aae86`).

Dividers publishes `hr`, so a writer's `---` is visible again (`27179a87`). A control has
the click area Cyan 4 and v20 both advertised and never delivered, six grid units in
either axis, inside the row it already occupied (`75d8d2df`, `313359c5`).

## What the removal exposed and nobody has taken

Cyan's atomics are gone, so around 450 call sites in `apps/pelilauta/src` name classes
that declare nothing — `flex` 96, `toolbar` 57, `p-2` 47, `downscaled` 44, `m-0` 39,
`items-center` 30, `mt-2` 30, `flex-col` 24, and a tail of spacing and alignment names.
This is the epic working as intended, not a discovery. What it needs is a destination
per class, and v20 has one: its Cyan publishes eighteen classes in total, and its whole
layout vocabulary is `.cn-app-main`, `.cn-content-{grid,prose,golden,triad}`,
`.cn-grid-full`, `.cn-card-grid`, `.flex`, `.flex-grow` and `.flex-none`. No `.flex-col`,
no `.toolbar`, no spacing atomic at all. This cycle proved the pattern the replacement
follows: the container states the rhythm and the markup stops asking.

Also open, and each visible on a rendered page rather than in a suite:

- `CnCard.svelte:94` hardcodes `<h4 class="title">`, so a card heading is level 4
  wherever it sits and every stream skips `h2` to `h4`.
- The application's `h1` renders very large on every page. It is the element default,
  not a per-page mistake.
- Twelve `border-t` sites draw nothing, and `hr` now paints — five `<hr>` in the app
  paint for the first time and none has been looked at, all being behind a session.
- `.toolbar` and `.flex` need layout answers case by case. The action row's own geometry
  is `plans/debt/card-action-row-height.md`, and it now turns on the Actions spec's
  seven-unit occupied row rather than on the click area.

## Traps

- `--cn-button` names a **unit** prefix (`--cn-button-size`,
  `--cn-button-physical-size`). Grep the bare string before trusting a sweep near it.
- A book page can fail to render its whole body while `pnpm test`, `astro check`, lint
  and the design suite stay green
  (`docs/lessons/a-book-page-can-vanish-with-every-gate-green.md`). Look at rendered
  pages; a green suite is not that evidence.
- A custom property that references itself computes to invalid silently, everywhere.
- `container-type: inline-size` applies size containment, which discards a replaced
  element's intrinsic width. An `<img>` placed directly in a content area collapses to
  zero — `plans/debt/prose-flow-collapses-a-replaced-child.md`.
- A `display` on `.content-triad > *` has to exclude `astro-island`, which is
  `display: contents` and delegates the region box, and `script`, `style` and
  `template`, which would take a track they are not.
- `test/lengths.test.ts` permits a pixel length only in `outline*` and `border*`.
  Anything else states grid multiples.
- `test/preflight.test.ts` pins `ds.css`'s import list and order. A new stylesheet
  changes that test in the same commit.
- The design suite's pass count is only trustworthy when no `astro dev` is churning
  alongside it. A run overlapping a server restart reported 271 of 327 with no failures.
