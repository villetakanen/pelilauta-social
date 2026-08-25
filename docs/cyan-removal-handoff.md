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

Fields paint every textual input type, not `input[type="text"]` alone, and the three
forms that stood a sibling label beside their input wrap it instead (`359f4db5`). The
fields spec went `proposed` with the widening and awaits its read. The footer settled
on the content-columns defaults and the create-thread FAB keeps its label at every
width (`ed24d046`).

The front page's triage is done. Its census against the published stylesheets left
three dead-class sites, and `ThreadCard.astro` dropped its atomics — the card's
actions row already zeroes child margins and spaces by gap, so nothing replaced them.
The card title's fixed `<h4>` and bespoke tokens are filed as
`plans/debt/card-title-hardcodes-its-heading.md`. Still open on the page:
`TopThreadsStream.astro`'s `.error` div declares nothing (reachable only when the
thread fetch fails), and the untamed `h1` below.

The login page's triage is done. Its three sections stand on `.surface` in place of
Cyan's `elevation-1 p-2` — and the password form's `debug` — each action row is a
scoped `.actions` rule in its own component, and `SyndicatedLoginSection`'s scoped
button layout went, since buttons.css states it. The removal exposed a poster gap:
the level-1 cession in `poster.css` matched `.elevation-1` and never a surface at its
default level, so a bare `.surface` stood opaque on the artwork. The selector now
carries the unoverridden-surface arm surface.css already uses, and the poster spec's
constraint says so.

The channel directory's triage is done (`c90fe8bf`). Each row stands on `.surface`
with a local stopgap layout — identity beside latest activity at the measure — and
the category section states the rhythm between heading and rows; both are anchored
in `plans/debt/the-design-system-has-no-listing-row.md`. The page wraps in
`.content-prose`, the row link spans name and description as in v18, and the
latest-is-newest note no longer renders on an empty channel. The stopgap's grid gap
is `var(--cn-line) var(--cn-gap)` — line rhythm stacked, inline gap in columns —
and the `38.75rem` container-query literal carries the comment naming
`--cn-breakpoint-small`, both per review. `e2e/channels.spec.ts` selectors follow
the markup (`main section article` for rows), though the suite is never run in
flight.

The channel page (`/channels/[key]`) followed the directory. The page wraps its one
island in `.content-golden`, and the island renders the listing and the channel card
as its two top-level elements, so Golden reaches through and each takes a region —
the region's own grid then spaces the thread rows, so the list needs no rhythm class.
`ThreadListItem.svelte` is the third local listing-row stopgap, in the same debt
file; its tag spans wear `.chip` in place of the dead `pill`. The header — breadcrumb,
title, search — is a local flex row marked as a stopgap with no debt anchor, since no
toolbar layout is published; `ChannelSearchBox` dropped its dead atomics and lays its
form out locally, and stays wrapped in one div inside the header so its login prompt
stacks under the form rather than joining the flex row (a review catch). A JSX-style
`{/* */}` comment in a Svelte template parses as an expression and breaks the whole
component; `astro check` catches it.

The thread page (`/threads/[threadKey]`) followed the channel page. Its frame was
already right: `Base.astro:76` docks the composer in chrome, `index.astro:41-46` stacks
a `.content-golden` holding the article and the info column over `.content-prose`
replies, and `CnBubble`, `CnMenu`, `CnChatBar`, `CnReactionButton` and `CnLightbox`
already carried the reply, with no
`cn-*` Lit element left in the tree. The pass dropped the dangling atomics from nine
components and put the layout each carried into one scoped rule per component.
`border-t` became `<hr>`, which `dividers.css` now paints, so the info column reads as
bands under one column rhythm rather than the padded boxes Cyan drew — the operator's
ruling. `toolbar items-center` became `text-center`, since a button is an inline-block
and the line box already centres it, and `text-h5` at `BlueskyPostCard.astro:16` became
`text-h4`. `.text-prose` reached its first two call sites in the application, on the
thread body (`ThreadArticle.astro:38`) and the reply body (`ReplyArticle.svelte:111`),
the two regions that render author-written markdown. The pass also fixed a byline
defect: `ThreadInfoSection.astro` ran the author, "aiheessa" and the channel link
together with no space between them, because Astro drops the indentation whitespace
around a `client:only` island and around a text expression; explicit `{" "}` restores
it.

Two local error rules on the page painted `--cn-color-error` as a text colour. In the
v19 token scheme that role is a ground and `--cn-color-on-error` is its foreground, so
error text on the page surface is not a shape this design language has: the dark arm
measures 4.09:1 against the surface, under the AA floor. The system publishes
`.surface.error` instead, a ground carrying the pair at 10.18:1 light and 4.80:1 dark,
and `ThreadChatBar.svelte` and `LabelManager.svelte` take it.
`plans/debt/text-h5-has-no-declaration.md`
is deleted: post-v19's scale stops at h4, so there is no compact heading step left to
specify, and the downshift covers what needs a smaller heading; the standing conversion
is now in `docs/cyan-removal-page-checklist.md`.

Two design-system gaps the thread page found. A `select` was not a field: the
exclusion in `specs/design-system/fields/spec.md` was a build-order decision written as
a design ruling, and the only reason behind it — that a field draws no inner control —
described what is easy to paint. `fields.css` paints a `select` now, in every state, and
leaves the platform-drawn disclosure alone. The same page then showed that no field fit
a container narrower than its own content: a form control sizes itself from its content
and a narrower parent does not shrink it. Every field takes at most the inline size
offered, and the book renders one in a narrow container so the next change measures the
fit rather than asserting it.

Open on the thread page, and each visible on a rendered page:

- A disclosure has no design-system treatment. `preflight.css:153-155` sets
  `summary { display: list-item; }` and nothing else in the system names `details` or
  `summary`, so the admin block on the thread page shows a browser marker and takes
  `.surface` and a local `cursor: pointer` for the rest.
- `specs/design-system/fields/spec.md` and `specs/design-system/surface/spec.md` are
  both `proposed` and await a read.
- `surface/spec.md:104` and `:117` state that surface sets no foreground colour, and
  `.surface.error` sets one. The exception is written into the error-notice section and
  the two constraints are not yet scoped to match.
- `.surface.error` outweighs `.elevation-2` and above on background while their shadow
  still applies, so an elevated notice keeps a shadow and loses its level colour. The
  spec does not say whether the notice composes with elevation.
- `semantic.css:119` declares `--cn-color-info`, which the colour rulings say must not
  exist.
- The Context of `specs/design-system/fields/spec.md` now says a reader is "typing or
  choosing", and every example in front of that clause is a typing act. Moving a thread
  to another channel is the choosing act the thread page shows.

The debug utility is back, as its own capability rather than Cyan's painted box
(`specs/design-system/debug/spec.md`, live). `.debug` swaps the surface family for
rowan, a hand-authored demonstration scale in `styles/chroma-themes.css`; the swap
reaches the semantic roles because the generated role stylesheets emit on
`:root, .debug` — a scoped chroma override cannot re-resolve a role computed on
`:root` alone. `styles/debug.css` is not in `ds.css`: BaseHead loads it behind
`import.meta.env.DEV`, so no production bundle carries it. The class marks the
password login section and `ChannelsAdmin.svelte:187`'s dump.

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
- The library description in `locales/fi/seo.ts:36` and `locales/en/seo.ts:36` still
  promises characters, which ADR 0003 removed.
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
