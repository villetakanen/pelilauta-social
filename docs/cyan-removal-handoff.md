# Deprecate Cyan — Working Log

Where the epic stands, for the session that picks it up next. Scope, guardrails and
step order are in `plans/deprecate-cyan-and-qol.md`; this file holds state and traps.
Delete it when the epic closes.

## State

Branch `feat/deprecate-cyan-and-qol`, version `21.0.0-beta.42` — bumped already, so no
further bump on this branch. `apps/design`'s Playwright suite passes 330/330 and
`pnpm test` 808; any failure in either is real.

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

A content area caps every replaced child at its own width, so a 690px image in a 256px
column no longer overflows it (`2395755b`). Dividers gained its second mark, the
ornamental `CnSeparator`, shipped with no call site (`32ff7d9c`).

The transparency ladder is published, and with it the two defects its absence had cost
(`66a3c459`). The ground plane over a poster was 80% opaque, defended by a comment
claiming that was the most transparent share keeping body text at WCAG 2.2 AA over
near-white artwork — a promise no share can make against an image the system has never
seen. It is `--cn-transparency-6` now. Levels 1 and 2 had no poster rule at all, so
payload stood opaque on the artwork; they cede `--cn-transparency-2`. Levels 3 and 4 stay
opaque, floating over content rather than over the page. `poster.test.ts` fails on any raw
percentage inside a `color-mix` in `poster.css`.

Typography publishes `.text-center` and `.text-end`, replacing Cyan's physical
`.text-right` (`a8d1a288`). Why logical and not physical is `docs/DESIGN.md`'s new Modern
CSS guidance (`687d2d92`), which states the convention every stylesheet here already
followed and nothing had written down.

The front page is rebuilt. The syndicated feeds are one stream ordered by recency with a
guaranteed place for Myrrys, reading a per-publisher envelope from a route that is the
only thing touching the network (`f167a244`). Its posts carry a surface each and no
divider between them. The three column headings share one scale, and `snippetHelpers`
flattens a writer's headings to `text-h4` rather than the dead `text-h5` (`a5989850`).
The login invitation opens the page instead of hiding in the sites stream, carrying the
front page's first `h1` (`5d0a7871`).

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
  wherever it sits. Its `.title` also copies the four h4 tokens instead of composing
  `.text-h4`, so a card title never downshifts while everything around it does.
- The application's `h1` renders very large on every page — the element default, not a
  per-page mistake. The front page's new invitation is the first surface that renders
  one on purpose, at 68px, and it was left untamed rather than papered over locally.
- `text-h5` declares nothing and four sites still name it: `ProfileTool.svelte:111,116`,
  `SearchResult.svelte:21`, `BlueskyPostCard.astro:16`, `ChannelInfoRow.astro:17`. All
  are headings reaching for the smallest step, which post-v19 is `text-h4`.
- Twelve `border-t` sites draw nothing, and `hr` now paints — five `<hr>` in the app
  paint for the first time and none has been looked at, all being behind a session.
- `seo.ts:29`'s library description still promises characters, which ADR 0003 removed.
  The front page's and the login page's now read one shared string; the library's needs
  a decision about what the library is without character sheets.
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
  alongside it. A run overlapping a server restart reported 271 of 327 with no failures,
  and a server already holding :4322 makes Playwright refuse to start with no reason
  printed. `npx astro dev stop` in each app before a run; check :4321 and :4322 both.
- A new token source emits a stylesheet imported from `tokens.css`, not `ds.css`.
  `test/token-contract.test.ts` pins the former's order and `test/preflight.test.ts`
  the latter's list, so the wrong entry point fails the wrong test.
- `poster.css`'s stage is `@media screen and (min-width: 38.75rem)`, and print is not
  `screen`, so the poster and every cession inside the stage are already inactive on
  paper. There is no `@media print` rule to find, and an agent looking for one deleted
  a true claim from the book as unsupported.
- Cyan is not a design source in any manner — not its naming, not its values. It is the
  inventory of what goes. v20 is the design source; v21's own git history is the record.
  `content-prose` also predates the design system here, so grepping call sites of it
  says nothing about whether anyone chose it.
- A spec states what its own capability does. Expected behaviour of its consumers —
  components or people — belongs in Context, never in Constraints, and neither the
  template nor `spec-review` checks for it yet
  (`docs/lessons/a-constraint-described-its-consumers.md`).
