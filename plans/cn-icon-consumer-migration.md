# cn-icon Consumer Migration Plan (final arc)

Status: Draft 2026-07-22
Branch: `feat/cn-icon` (closing arc)
Intent: `specs/design-system/components/cn-icon/spec.md`; `specs/design-system/iconography/spec.md`
Practice: `docs/practices/consumer-migration.md` (required pre-flight)

## Production Outcome

Every remaining direct `<cn-icon>` element consumer in `apps/pelilauta` renders
through the local server-rendered `<Icon>` component. When the arc closes, app
source contains **zero direct `<cn-icon>` element usages**; icons resolve through
the tiered local catalog (open-source → managed → bundled fallback → missing) with
no visual regression against live v18.

### What this arc is *not*

`@11thdeg/cyan-lit` is **not** removed and `public/icons/` is **not** deleted.
`cn-card`, `cn-loader`, `cn-story-clock`, and `cn-d20-ability-score` remain Cyan
Lit components, and `cn-loader` imports `cn-icon.js` — so `cn-icon` stays
registered and `/icons/{noun}.svg` stays served for those components. The end
state is "no direct `<cn-icon>` consumers," not "drop the package." Dependency
removal, if ever pursued, is a separate future epic gated on migrating the other
Cyan components.

## Why This Is An Arc, Not One Merge

- **Surface size.** The arc began with 95 files using the literal `<cn-icon>`
  element. After the server-surface delta in PR #41, zero `.astro` files and 73
  Svelte files remain; recount before each new batch.
- **The dominant risk is per-consumer and invisible to automation.** The local
  component renders `<span class="cn-icon">`, so every `@11thdeg/cyan-css` rule
  scoped to the `<cn-icon>` *tag* (size, control spacing,
  flex/heading layout) silently stops applying at each migrated site. Unit and
  registry tests never render in the consumer context and cannot see it.
  Rendered-in-context visual acceptance is the only gate that catches it
  (consumer-migration pre-flight step 7). What it checks is theme-independent —
  size, spacing, layout — so one theme is sufficient.
- **Delivery contract.** Each merge — not the lifetime branch diff — is the
  deployable, coherently reversible unit; migrate one bounded surface at a time.
  A single 95-file merge that each needs its own visual acceptance is neither
  coherently reversible nor independently verifiable.

Decision (human, 2026-07-22): deliver the closing arc as **several bounded PRs by
surface**, each independently reversible and visually accepted, followed by a
terminal PR that confirms zero remaining consumers, keeps catalog guards green,
and repairs or explicitly dispositions the ungated footer e2e.

## Current Catalog State

The app vocabulary reaches static nouns, the `NounSelect` catalog,
`systemToNoun`, `TagSynonyms`, and persisted channel/topic choices. The catalog
sort completed the local tiers needed by dynamic consumers:

| Tier | Current role |
| --- | --- | --- |
| Open source (`packages/design-system/icons/open-source`) | 27 openly licensed nouns with provenance and `currentColor` guards. Renamed from "community" 2026-07-28; admits project-created *and* permissively licensed third-party artwork |
| Managed (`packages/myrrys-proprietary/icons`) | Proprietary/branded and approved managed nouns, optional at build time |
| Bundled fallback (`components/icon-fallback.ts`) | Essential UI symbols plus the mandatory missing glyph |

`chart-line`, `compass`, and `tentacles` have approved missing-glyph outcomes.
Human-retired `check` and `open-down` were revisited and **ported** at their
migrating batch (Sort round 4, Batch G); `import-export` remains retired and
renders the missing glyph in `SiteAdminActions`.

### The dynamic-noun consumers force catalog completeness

Several consumers render a **persisted, user-chosen** noun, not a literal:
`channel.icon` / `topic.icon` (default `discussion`), `systemToNoun(system)`,
`tagInfo.icon`. Users pick these from `NounSelect`'s ~66-noun catalog and the
value is persisted in Firebase. To migrate any of these consumers without a
compatibility regression, **every reachable noun needs a reviewed disposition:**
catalog artwork or an explicit approved missing-glyph outcome. This is the
concrete need that pulls catalog decisions into the consumer slice.

### Missing-noun handling (human, 2026-07-22)

Per-noun **design spike** at the batch that first touches the consumer: decide
whether the icon is genuinely needed in that context. If needed, refactor in
reviewable artwork (sourced from v20 `pelilauta-icons` at the pinned commit or
v18 evidence, recording provenance — no invented vocabulary). If not needed,
leave it to the missing glyph, which matches today's blank. Do not blanket-port.
`compass`/`tentacles` are dynamic game-tag nouns and default to a spike only if
a live tag actually uses them.

## Carried Decisions Every Batch Obeys

From `docs/practices/consumer-migration.md` and the approved specs:

1. **Run the pre-flight before each batch.** Enumerate the cyan-css rules scoped
   to `cn-icon` for that context, decide how each is re-expressed against the
   local component, then implement, then visually accept in context.
2. **A class does not match a tag rule.** Re-express size via the public
   `--cn-icon-size-*` tokens in the consumer's scope (or `size=` prop); never
   override the private `--icon-dim`, never with `!important`. Re-express
   margin/layout behavior as a DS rule targeting the `.cn-icon` class or the
   consumer's own layout — record which.
3. **Resolve every noun before consumer migration:** add approved catalog
   artwork or record an explicit missing-glyph decision inside the batch that
   first reaches it.
4. **Per-consumer rendered-in-context visual acceptance is a required gate.**
5. **Preserve behavior first, then replace the Lit dependency.** Keep persisted
   noun values, routes, auth, and accessible names unchanged. The local `<Icon>`
   keeps v18's noun announcement (SVG `<title>`); icon-only controls keep their
   existing accessible name on the control.

## Batches

Ordered so shared/common nouns are ported early and dynamic-noun surfaces come
after the catalog is complete. Each batch is one PR: `feat/cn-icon` → `main`.
Counts are approximate; the exact file split is confirmed at each batch's
pre-flight. Each batch: pre-flight → catalog port for its nouns → migrate →
`astro check` + unit + contract tests + both app builds → visual acceptance.
Keep deprecated e2e selectors aligned, but do not use that suite as acceptance
evidence unless it is explicitly restored to a gate.

### Server Surface — complete or in review

PRs #36 and #37 delivered status/error pages and static server chrome. PR #41
finishes the remaining direct `.astro` consumers across channels, sites, tags,
docs, Bluesky, and entry tags. Its source head `e9f1b53` has zero direct
`<cn-icon>` in the server surface and a green Netlify preview. The broken footer
selector in `e2e/color-theme.spec.ts` remains terminal-batch debt.

After PR #41, 73 Svelte files remained direct consumers; recount before the next
batch. The next bounded surface starts at Batch C.

Follow-up outside PR #41: `ChannelApp` still uses `chevron-left` as a forward
breadcrumb separator while `SimplifiedChannelApp` uses `chevron-right`. This is
inherited behavior now made audible; decide it in a later bounded consumer slice.

### Batch C — Threads & discussion (svelte) — accepted

`svelte/threads/*`, `svelte/discussion/*`, `svelte/inbox/NotificationItem`.
Ten files, 24 usages, migrated to the local `Icon`. 73 → 63 consumer files
remain.

Pre-flight outcomes:

- **Control spacing was the missing re-expression.** This batch is the first to
  put the local component inside real `button` / `a.button` chrome with a
  sibling label, so `button cn-icon:first-child:not(:only-child)` (negative
  `--cn-grid` pull-back), `button cn-icon:only-child` (both-side pull-in plus
  the 1px drop), and the `button.fab` cancel had no `.cn-icon` equivalent yet.
  Added to the temporary application-owned
  `apps/pelilauta/src/styles/migrations/cyan-icon.css`, mirroring the legacy
  selector shapes exactly, so a bare `a.fab` (`ChannelFabs`) keeps its
  untouched spacing as today. That helper also owns contextual size
  standardization, the `items-start` flex-grow cancel, and the reached legacy
  `h3` alignment until local Button, Fab, layout, and typography capabilities
  replace them. Stable Icon CSS remains limited to the icon token vocabulary.
- **Bare `a.fab` icon size is a transitional departure (human 2026-07-27).**
  Cyan has no rule sizing icons in a bare `.fab`: `core/fab.css:68` sets only
  `font-size`, which never reaches the legacy `:host` box
  (`height/width: var(--cn-icon-size, 36px)`), and the small-size collapse is
  scoped to the `button` element (`tokens/buttons.css:81`) and `button` /
  `a.button` (`core/buttons.css:72`). `ChannelFabs`' create-thread
  `<a class="fab">` therefore rendered at 36px in v18 and renders at 24px under
  the helper's `.fab` clause (inherited from `b002bbe`; this batch is the first
  bare `a.fab` consumer to reach it). The `a.fab.button` login branch was
  already 24px and is unchanged. Accepted as a transitional effect of the
  incremental migration; **icon sizing in fab contexts is owned by the future
  Fab epic**, which absorbs this helper and settles the behavior.
- **`loader` spike (LabelManager): missing glyph.** No `loader.svg` exists in
  `public/icons/`, the open-source tier, or the managed tier, so the legacy
  element already renders a 404 blank in production today. `cn-loader` is the
  real spinner; swapping it in is a behavior change, not an icon migration.
  Migrated as-is, which turns today's blank into the missing glyph — the same
  deliberate transitional state as the human-retired nouns. Human approval of
  this outcome is part of this batch's acceptance.
- **`check` (NotificationItem) stays the missing glyph**, per the human
  retirement decision in the sort ledger. This batch converts that consumer's
  blank into the missing glyph, which is the recorded intent.
- **Dynamic `channel.icon`** (`ChannelThreadList`, three sites) resolves
  against the vocabulary completed in the dynamic-noun batch; no persisted
  value changes.
- **`class` passthrough was not added.** `NotificationItem` passed
  `class="mt-1 flex-none"` to the legacy element; re-expressed as a wrapper
  span carrying those layout classes, following the `AppFooter` pattern rather
  than widening the component's contract.
- **e2e selectors broken by this batch were repaired in it:**
  `reply-edit.spec.ts` (`send`, `edit`) and `thread-asset-upload.spec.ts`
  (`send`) now select `.cn-icon[data-noun="…"]`. Not run here — the suite needs
  the emulator and is in no gate.

Acceptance (human, 2026-07-27): rendered Light/Dark contexts accepted; the
`loader` missing-glyph outcome approved.

Debt found, not owned by this batch: `thread-labels.spec.ts` selects
`cn-icon[noun="label-tag"]`, already broken by PR #41's
`EntryTagsWithLabelsSection` migration. Same silent-failure class as the footer
`color-theme.spec.ts` selector; both belong to the terminal batch.
`site-asset-upload.spec.ts`'s `cn-icon[noun="delete"]` breaks with Batch D and
is that batch's to repair.

### Batch D — Sites (svelte)

`svelte/sites/**` (toc, handouts, settings, assets, data, clocks, fabs).
Twenty-five files, 45 usages, migrated to the local `Icon`. 63 → 38 consumer
files remain. Delivered as one PR (human decision 2026-07-27, declining a
D1/D2 split).

Pre-flight outcomes:

- **No new tag rule is reached.** The inventory over this surface matches rules
  the Batch C helper already owns: `button` / `a.button` size and spacing, the
  `button.fab` / `a.button.fab` margin cancel, and `h3 cn-icon`.
  `ManualTocOrdering`'s `sort` icon is the first real consumer of the `h3`
  alignment rule, which Batch C added speculatively. `.flex.items-start >
  cn-icon` and `cn-sortable-list cn-icon[noun="drag"]` have no consumer here —
  `ManualTocOrdering` uses neither a sortable list nor a drag icon.
- **Batch C's bare-`a.fab` sizing departure does not recur.** Every fab on this
  surface is `a.fab.button` (`ClocksFabs`, `PageFabs`, `HandoutFabs`,
  `HandoutsFabs`) or `button.fab` (`UploadAssetFab`). Both already resolved to
  the small icon size in v18 via `a.button cn-icon` / `button cn-icon`, so
  sizing is unchanged. The departure remains specific to bare `a.fab`
  (`ChannelFabs`) and stays owned by the Fab epic.
- **`sort` spike (ManualTocOrdering): artwork ported.** Human decision
  2026-07-27: reuse the existing project chevron rotated 90° rather than source
  new artwork. Added as a community icon derived from `chevron-left` via
  `rotate(-90 64 64)`, giving a down-chevron; same polygon, so no invented
  vocabulary. Follows the existing `chevron-right` mirror precedent. This turns
  today's production blank into real artwork.
- **`import-export` (SiteAdminActions) stays the missing glyph**, per the human
  retirement decision in the sort ledger.
- **Dynamic nouns resolve completely.** `SystemSelect` (`systemToNounMapping`)
  and `SiteAdminActions` (`systemToNoun`) reach the same nine values —
  `homebrew`, `ll-ampersand`, `dd5`, `myrrys-scarlet`, `thequick`, `mekanismi`,
  `pbta`, `hood`, `pathfinder` — all present in the managed tier, with
  `homebrew` as the mapped default. No persisted value changes.
- **`class`/`style` passthrough was not added.** `SiteThemeImageInput` passed
  `class="flex-none"` and inline flex styles to the legacy element;
  re-expressed as a wrapper span, following the `NotificationItem` and
  `AppFooter` pattern rather than widening the component's contract.
- **e2e selectors broken by this batch were repaired in it:**
  `site-asset-upload.spec.ts` (`assets` via `UploadAssetFab`, `delete` via
  `AssetArticle`) now selects `.cn-icon[data-noun="…"]`. Not run here — the
  suite needs the emulator and is in no gate.

Debt found, not owned by this batch: `manual-toc-ordering.spec.ts` selects
`cn-icon[noun="drag-handle"]`, a noun that exists nowhere in `apps/pelilauta/src`.
It is a dead selector independent of this migration; it belongs to the terminal
batch alongside the footer and `label-tag` selectors.

### Batch E — Characters (svelte)

`svelte/characters/**`: `ConfirmCharacterDeletion`, `CharactersFab`,
`CharacterApp/CharacterHeader`, `CharacterApp/CharacterArticle`,
`library/CharacterLibraryApp`, `library/CharacterLibraryFabs`. Six files, eight
live usages, migrated to the local `Icon`. 38 → 33 consumer files remain.

Pre-flight outcomes:

- **No new tag rule is reached.** The inventory over this surface matches rules
  the Batch C helper already owns: `button` / `a.button` size and spacing
  (`ConfirmCharacterDeletion`'s `a.button.text` + `button.button.primary`,
  `CharacterArticle`'s `a.button.text`), `button cn-icon:only-child`
  (`CharacterHeader`'s bare settings `button`), and the `a.button.fab` margin
  cancel (`CharactersFab`, `CharacterLibraryFabs`). `.flex.items-start >
  cn-icon` has no consumer: `CharacterLibraryApp`'s empty-state section is
  `.flex.flex-column`, not `items-start`. `h3 cn-icon` is not reached —
  `CharacterArticle`'s toolbar heading is an `h2` and holds no icon.
- **Batch C's bare-`a.fab` sizing departure does not recur.** Both character
  fabs are `a.fab.button` with an explicit `small`, so they resolved to 24px in
  v18 via `a.button cn-icon` and resolve to 24px now via `size="small"` under
  the helper. Unchanged.
- **`xlarge` maps exactly.** `CharacterLibraryApp`'s empty-state `monsters`
  icon carried the legacy `xlarge` attribute (`:host([xlarge])` →
  `--cn-icon-size-xlarge`, 128px); `size="xlarge"` resolves the same token. It
  sits in no button/fab scope, so the helper's token override does not apply.
- **`CharacterCard` is out of scope.** It renders `<cn-card noun={systemKey}>`,
  not `<cn-icon>`. `cn-card` is a retained Cyan Lit component per this arc's
  boundary, so the `systemKey` dynamic noun stays served by `/icons/{noun}.svg`
  and migrates with a future Card epic, not here.
- **Every noun already had reviewed artwork; no spike was needed.**
  `arrow-left` and `add` are community; `delete`, `monsters`, `tools`, and
  `edit` are managed. No missing-glyph outcome and no catalog change in this
  batch.
- **No e2e selector is broken by this batch.** The character specs
  (`create-character`, `character-sheet-editing`, `character-keeper`) select
  `cn-card[noun=…]`, which is untouched; `library.spec.ts:76` mentions
  `cn-icon` only in a comment describing the dead sort-controls block below.

- **Dead sort-controls block removed (human 2026-07-28).** `CharacterLibraryApp`
  carried a commented-out sort-controls block containing
  `<cn-icon noun={directionNoun}>` alongside references to `directionNoun`,
  `toggleOrder`, `filters`, `FilteredSites`, and `userSites` — none of which
  exist in the file or are imported by it. It was dead scaffolding rather than a
  consumer, but it was the last literal `<cn-icon>` string under
  `svelte/characters/**` and would have tripped Batch H's zero-usage grep gate.
  Deleted here on human direction, keeping the gate honest instead of carrying
  a known false positive to the terminal batch. No rendered output changes, and
  no e2e is affected: `library.spec.ts`'s sort-direction test targets
  `nav.toolbar` on `/library`, which is `site-library/UserSitesList`, not this
  component. That live consumer migrates in Batch G.

`svelte/characters/**` now contains zero `<cn-icon>` strings, commented or live.

Acceptance (human 2026-07-28): rendered-in-context visual review is by hand, as
on every release, and remains the gate that catches a missed tag rule. What this
batch does not need is a separate dual-theme pass: every noun was
already-reviewed artwork, the `Icon` inherits colour via `currentColor`, and no
colour or theming surface is touched. Deterministic checks are green.

### Batch F — Admin (svelte), tier rename, and the `delete` artwork

`svelte/admin/**` — sheets, channels, `User`, `AdminTray`, `SentryTestButton`.
Sixteen files, 44 usages, migrated to the local `Icon`. 32 → 16 consumer files
remain. This batch also carries two human-directed changes that are not
consumer migration; both are recorded below because they change shipped visuals
and the licensing surface.

Pre-flight outcomes:

- **`.flex.items-start > cn-icon` finally has a consumer.** `ChannelSettings`
  renders the dynamic `channel.icon` as a direct child of
  `div.flex.flex-row.items-start`, the first live consumer of the rule Batch C
  added speculatively. It also passed `class="flex-none"`. These are not
  equivalent: the tag rule sets only `flex-grow: 0`, while `.flex-none` sets
  `flex: none` (grow **and** shrink). Re-expressed as a wrapper
  `<span class="flex-none">`, following the `NotificationItem` precedent —
  `.flex > .flex-none` matches the span, preserving `flex: none` exactly.
  Relying on the helper's `.flex.items-start > .cn-icon` instead would have
  silently dropped `flex-shrink: 0`. The helper rule consequently still has no
  live consumer.
- **Plan correction: `warning` is not on a `cn-card`.** This plan previously
  recorded `warning` as `cn-card noun="warning"` and therefore out of scope.
  `SentryTestButton:60` is a real `<cn-icon noun="warning" small>` inside a bare
  `<button>`. It is in scope and needed a disposition.
- **`warning` spike: artwork ported.** Human decision 2026-07-28 — adopt Ant
  Design Icons' filled `exclamation-circle` (MIT, © 2018-present Ant UED,
  `ant-design/ant-design-icons@6c18c63fbcfcf71dae09cd6bd6d63a48f8b688f1`),
  normalized to `currentColor` since the source declared no fill. `warning` had
  no artwork in any tier or under `public/icons/`, so this turns today's
  production blank into real artwork. Second vendored licence in the tier
  (`LICENSE-ant-design-icons`), and the second source proving the open-source
  tier's per-noun attribution model works.
- **`tag` and `check` stay the missing glyph.** Neither has artwork in any tier
  or under `public/icons/`, so both render blank in production today and
  migrating preserves that, per the recorded missing-noun rule. `check` is
  additionally a human retirement. Both Fluent and Ant Design are now admitted
  sources and offer a `tag` mark, so porting it later is cheap — a design
  decision, not part of this migration.
- **No new size or spacing re-expression.** `button` / `a.button` contexts and
  `button.fab` (`SheetFabs`, icon + `sr-only` span, so
  `:first-child:not(:only-child)`) are all owned by the existing helper. No bare
  `a.fab`, so Batch C's sizing departure does not recur. No `h3` icon and no
  `cn-sortable-list` on this surface.
- **Dynamic nouns resolve.** `systemToNoun(characterSheet.system)` reaches the
  same nine managed values verified in Batch D; `arrow-up`/`arrow-down` are
  open-source tier; `channel.icon` is persisted and resolves against the full
  vocabulary, as in Batch C. No persisted value changes.
- **No e2e selector is broken.** No spec targets an admin `cn-icon`. The
  outstanding `label-tag`, `assets`, and `drag-handle` selectors are unchanged
  debt; `assets` belongs to Batch G (`AddFilesButton`).

Human-directed changes carried in this batch:

- **Tier renamed `community` → `open-source` (human 2026-07-28).** The tier's
  real distinction is *openly licensed* versus *proprietary*, not authorship, and
  the old name caused exactly that confusion when third-party artwork was
  admitted. Directory, generated registry (`icons/open-source.ts`),
  `OpenSourceNoun`/`getOpenSourceIcon`/`openSourceNouns` identifiers, both DS
  book pages, the registry tests, the biome generated-file exclusion, and
  `PROVENANCE.md` all move together. Mechanical and gated by the registry parity
  check.
- **`delete` artwork replaced; `trash` retired onto it (human 2026-07-28).** New
  artwork is Fluent UI System Icons `bin-recycle-24-filled`, MIT, © 2020
  Microsoft Corporation, taken from `microsoft/fluentui-system-icons` at
  immutable commit `5ecd79ea56f2be0169859b3b881dcc890be932fc`, normalized from
  `fill="#212121"` to `currentColor`. The licence text is vendored beside the
  artwork as `LICENSE-fluent-ui-system-icons`, and `PROVENANCE.md` now documents
  that the tier admits permissively licensed third-party sources with per-noun
  attribution.

  This is a **deliberate visual change to already-shipped surfaces**, not a
  compatibility-preserving migration: `delete` has 17 consumers and 10 were
  already migrated and live (`AssetArticle`, `ReplyArticle`, `Clock`,
  `CreateClockApp` ×2, `HandoutMeta`, `SiteOwnersTool`, `SitePlayersTool`,
  `NotificationItem`, `ConfirmCharacterDeletion`). Human decision 2026-07-28
  chose to land it in this batch rather than a separate slice.

  `ProfileTool`'s `trash` — the only `trash` consumer, and blank in production
  since no tier ever had that artwork — is repointed to `noun="delete"` rather
  than aliasing, keeping the compatibility boundary against invented aliases.
  That file's own `cn-icon` → `Icon` migration stays in Batch G.

Follow-up, not owned here: the managed tier still ships `delete.svg`, now
permanently shadowed by the open-source entry (resolution is open-source →
managed). Removing it is a `@myrrys/proprietary` submodule change and a separate
human decision.

### Batch G — Settings, auth, editors, shared UI, and `NounSelect`

`svelte/settings/*`, `svelte/login/*`, `svelte/thread-editor/*`,
`svelte/page-editor/*`, `svelte/app/*`, `svelte/ui/NounSelect`,
`svelte/search/*`, `svelte/frontpage/*`, `svelte/site-library/*`. Sixteen
files, 24 usages, migrated to the local `Icon`. 16 → **0** consumer files
remain: this batch closes the consumer arc, and Batch H is now purely the
gate-and-disposition merge. `ReactionButton` was listed in this batch's scope
but has no `cn-icon` usage; it was already icon-free.

Pre-flight outcomes:

- **`NounSelect` passes the completeness check.** Its 61-noun catalog plus the
  batch's literal nouns — 63 distinct nouns — were resolved through the real
  `Icon` code path (`getOpenSourceIcon` → `getManagedIcon` → `FallbackIcons`),
  not inferred from directory listings. 61 resolve to reviewed artwork; only
  `open-down` and `check` fall to the missing glyph.
- **`open-down` and `check` are ported, not left to the missing glyph.** Both
  were human-retired in Sort round 2 (2026-07-23) and had artwork in no tier and
  none under `public/icons/`. The review below establishes that migrating such a
  noun replaces production's *blank* with a *visible* missing glyph, so the
  human decision 2026-07-28 was to port both rather than ship that mark — see
  Sort round 4. Batch G therefore ships **zero missing glyphs on its own
  surface**: all 63 nouns resolve to reviewed artwork, verified through the real
  `Icon` resolution path.
- **No new size or spacing re-expression.** Every icon on this surface sits in
  a context the existing helper already owns: bare `button` / `a.button`
  (`AddFilesButton`, both login sections, `PageEditorForm`,
  `RemoveAccountSection`, `AuthnSection`, `ProfileTool`, both thread editors,
  `UserSitesList`, and both `NounSelect` button contexts) and `a.button.fab`
  (`FrontpageFabs`, `LibrarySitesFabs`). Both fabs are `a.button.fab`, not bare
  `a.fab`, so Batch C's sizing departure does not recur. No `h3` icon, no
  `.flex.items-start` icon child — `WithAuth`, `PageEditorForm`'s alert,
  `AlgoliaSearchApp`, and `AuthnSection` are all `justify-center` or
  `items-center` contexts, which no `cn-icon` tag rule matches. That helper rule
  still has no live consumer.
- **Verified that legacy already collapsed `large` inside buttons.** Cyan sets
  `--cn-icon-size-large: var(--cn-icon-size-small)` on `button`
  (`tokens/buttons.css`) *and* forces `button cn-icon` height/width
  (`core/buttons.css`), and `cn-icon`'s size attributes resolve those same
  public tokens from its shadow root. So `NounSelect`'s
  `large={size === 'large'}` trigger icon was already small in production, and
  the helper's token collapse reproduces that rather than shrinking it. Checked
  rather than assumed, because the helper collapses a token where legacy also
  had a higher-specificity tag rule.
- **`AuthnSection`'s `class="mx-1"` needed a wrapper.** The local `Icon` takes
  `noun`, `size`, and `aria-label` only, so a consumer class has nowhere to
  land. Re-expressed as `<span class="mx-1">` around the icon, following the
  `NotificationItem` / `ChannelSettings` precedent; the span is the flex child
  that carries the margin, exactly as the icon did.
- **`NounSelect` owns the batch's only component-scoped tag selector.**
  `.search-container cn-icon` positions the search affordance absolutely. Two
  things break it at once: a class does not match a tag rule, *and* Svelte
  scoping does not cross a component boundary, so even `.search-container
  .cn-icon` would be compiled with a scope class the `Icon`'s span never
  carries. Re-expressed as `.search-container :global(.cn-icon)` and commented
  in place. This stays the consumer's own rule — it is layout local to
  `NounSelect`, not reached legacy Cyan behavior, so it does not belong in the
  `styles/migrations/` helper.
- **`assets` e2e selectors repaired here, as scheduled.** `AddFilesButton` is
  the `assets` consumer, so this batch owns the five
  `button:has(cn-icon[noun="assets"])` locators in
  `thread-asset-upload.spec.ts` (plus the one in `README-ASSET-TESTS.md`), now
  `button:has(.cn-icon[data-noun="assets"])`. `library.spec.ts` mentions the tag
  only in a comment and locates by `button`, so `UserSitesList` breaks nothing
  there. Remaining unrepaired selectors are unchanged debt owned elsewhere:
  `label-tag` (`thread-labels.spec.ts`), `drag-handle`
  (`manual-toc-ordering.spec.ts`, a noun that exists in no tier), and the footer
  selector in `color-theme.spec.ts` (Batch H).
- **One imperative `cn-icon` remains, and it is out of scope.**
  `SvelteSortableList` builds its delete buttons with
  `document.createElement('cn-icon')` and appends them into `cn-sortable-list`'s
  slots. It is not a `<cn-icon>` element literal, so Batch H's planned grep gate
  would not see it. It is also not migratable as a consumer swap: it renders
  into a retained Cyan component whose own CSS
  (`cn-sortable-list cn-icon[noun="drag"]`) needs the tag. Recorded as a named
  exception rather than left silent — see the Batch H amendment below.

Deterministic checks are green: `astro check` 0 errors, 465 app unit tests and
11 design-system registry tests pass, `check:icons` parity OK, both app builds
succeed, and `grep -rn '<cn-icon' apps/pelilauta/src` returns nothing.

#### Correction: "preserves today's blank" is wrong about the visual

This plan has said, from Sort round 2 onward, that migrating a noun with no
artwork in any tier "preserves today's blank." That is true of the *disposition*
and false of the *rendering*, and Batch G's review is where it was checked
rather than repeated:

- Legacy `cn-icon` renders `<svg><use href="/icons/{noun}.svg#icon"></svg>`
  (`@11thdeg/cyan-lit` `cn-icon.js`). A 404 paints nothing — the element keeps
  its box, but there is no mark.
- The local `Icon`'s missing glyph is real, visible artwork: a filled circle
  with an exclamation mark (`packages/design-system/components/icon-fallback.ts`,
  `FallbackIcons.missing`). It reads as an error indicator.

So every missing-glyph disposition in this arc is a **visible change on a
shipped surface**, not a no-op. Batch G newly introduces it in two places:
`open-down` in every `NounSelect` trigger (channel and topic admin forms) and
`check` in the account-deletion confirm CTA. It is already live on `main` from
earlier batches: `check` (`NotificationItem`, `AddChannelForm`), `tag`
(`AddTopicForm`), `import-export` (`SiteAdminActions`), and `loader`
(`LabelManager` ×2 — a noun that has never existed in any tier, inherited blank
from the v18 import).

**Human decision 2026-07-28: port both nouns** (Sort round 4 below). Batch G
ships no new missing glyph. Porting `check` also retires the mark on two
*already-migrated* consumers, `NotificationItem` and `AddChannelForm`, which have
been showing it on `main` since Batches C and F.

Still on the missing glyph app-wide, and **not** owned by Batch G — Batch H
dispositions them:

| Noun | Consumer | Status |
| --- | --- | --- |
| `tag` | `AddTopicForm` | Batch F recorded it as intentional; both admitted MIT sources offer a `tag` mark, so porting stays cheap. |
| `import-export` | `SiteAdminActions` | Human-retired in Sort round 2; migrated in Batch D. |
| `loader` | `LabelManager` ×2 | A **defect, not a disposition**: a spinner slot pointing at a noun that has never existed in any tier. Inherited from the v18 import (`14fe061` already had `<cn-icon noun="loader">`), so it was blank in v18 too. Wants a loader component, not icon artwork — its own slice. |

Treat "renders the missing glyph" and "renders blank" as different outcomes
everywhere in this plan.

### Batch H — Terminal PR (arc close)

- Assert **zero `<cn-icon>` element usages** remain in `apps/pelilauta/src`
  (grep gate); confirm `cn-icon` stays registered only via retained Cyan
  components (`cn-loader` import) and `public/icons/` is untouched.
- **Amendment (Batch G):** the element-literal grep reached zero at Batch G, but
  it does not cover `SvelteSortableList`'s
  `document.createElement('cn-icon')`. The gate must match imperative creation
  too, and record that one usage as the arc's declared exception: it renders into
  the retained `cn-sortable-list`, whose own Cyan CSS is scoped to the
  `cn-icon` tag, so it belongs to the future Cyan-component epic, not to this
  arc. State the exception in the gate rather than letting a literal-only grep
  imply the app has no `cn-icon` left at all.
- Keep the existing catalog↔provenance parity and community `currentColor`
  checks green; repair the footer e2e selector and decide whether to gate it.
- Confirm the absent-submodule build still degrades managed nouns to the missing
  glyph (inherited verification; re-run once here).
- Before the final production integration, resolve any active lesson candidates
  that exist per `docs/practices/lessons.md`, optionally compact them to the
  minimal log, and make the release decision.

## Deterministic Acceptance (per batch unless noted)

- Migrated files contain no `<cn-icon>` element; server output / rendered DOM
  shows local `.cn-icon` markup.
- Every noun reachable in the batch's surface resolves to reviewed artwork or
  the intended missing glyph; no persisted noun value changes.
- `astro check` 0 errors; pelilauta + design builds pass; existing unit and
  migration contract tests pass.
- Community catalog additions carry provenance; monochrome artwork uses
  `currentColor`; proprietary artwork is never copied into public DS source.
- (Batch H) Zero-consumer grep gate passes; parity + `currentColor` checks are
  wired and green; absent-submodule build degrades gracefully.

## Human Acceptance (per batch)

Rendered-in-context review of the batch's surface, with explicit attention to
button/fab/heading/flex contexts where cyan-css tag rules applied. Sign off
community-asset provenance for that batch's ports. Approve each missing-noun
spike outcome (port vs. missing glyph).

**Light and Dark review is not a gate on these batches (human 2026-07-28).** It
belongs to the design-system colour and theming capabilities, not to application
consumer screens. The local `Icon` renders monochrome artwork with
`currentColor`, so a consumer migration cannot change theme behaviour; branded
managed artwork keeps its encoded colours in both themes either way. A batch
whose only nouns are already-reviewed artwork and whose checks are green needs
no separate human theme pass.

## Compatibility Boundaries

Must not: remove/upgrade `@11thdeg/cyan-lit`; delete or relocate `public/icons/`
while Cyan components still request it; change Firebase data, persisted noun
values, routes, or auth; invent aliases or artwork for absent nouns; recolor or
redesign approved source artwork; bundle unrelated refactors into a migration
merge.

## Stop / Re-scope Rule

Per the delivery contract, one working day without a production-integrated slice
is a mandatory re-scope gate. If a batch's tag-rule re-expression cannot be
resolved against the local component within a batch, stop and record the
specific cyan-css rule and context in the plan or PR before continuing — do not
hardcode per-consumer sizes as a workaround (that repeats the v20 `!important`
specificity bug).

## Sequencing Dependency Note

Batches B and G are the completeness pressure points: B first requires the full
dynamic-noun vocabulary; G's `NounSelect` renders all of it. A–F may otherwise
proceed in the order that best fits available review capacity, provided each
batch's own nouns are ported before its consumers migrate.

## Provenance Sort Ledger (human-owned)

Provenance (bought/licensed vs project-created) cannot be inferred from the
files or from where they currently sit (`public/icons/` vs the submodule); only
the human decides. Recorded here as the human sorts, batch by batch. Community
ports normalize to `currentColor` unless noted; `myrrys` = move into the
`@myrrys/proprietary` submodule (kept at its encoded color only when branded).

Sort round 1 (human 2026-07-23):

| Noun | Decision | Status |
| --- | --- | --- |
| add, arrow-up, arrow-down, card, chevron-left, clock, close, dots, drag, dragger | ours → community (currentColor) | **Done** — ported + normalized + verified |
| assets, copy-md, delete, design | bought → myrrys (currentColor) | **Done** — added to submodule (`96ae625`), pointer bumped |
| bsky | bought → myrrys (keeps brand `#1185fe`) | **Done** — added to submodule, brand color preserved |
| components | delete (drop the icon) | **Done** — removed from `NounSelect`, public SVG deleted |

`components` deletion caveat: any channel/topic persisted with `icon:
'components'` now falls to the missing glyph (no such value found in source
defaults; low risk). Public originals for the community/myrrys ports remain under
`public/icons/` for legacy `cn-icon` fetches until the terminal cleanup batch.

Sort round 2 (human 2026-07-23):

| Noun | Decision | Status |
| --- | --- | --- |
| filter, font, info, kebab, label-tag, palette, reduce, pdf | ours → community (currentColor) | **Done** — ported + normalized (filter `#000`; kebab/pdf no-fill; info Inkscape cruft stripped) |
| fork, idea, login, love, quote, save, share, tools, undo | bought → myrrys (currentColor) | **Done** — submodule (`9eceea2`), pointer bumped |
| edit | bought → myrrys (currentColor) | **Done** — submodule (`7bf9abc`); `edit.svg` also kept in `public/icons` for legacy `cn-icon` |
| check, file-pdf, import-export, open-down | delete from repo (human 2026-07-23) | **Done** — public SVGs removed + `NounSelect` entries removed |

Deliberate deletions (human-directed, git-reversible). Live consequence until
the affected consumers migrate: legacy `<cn-icon>` still references these, so
they now render the blank/404 glyph — `check` in `RemoveAccountSection`,
`NotificationItem`, `AddChannelForm`; `import-export` in `SiteAdminActions`;
`open-down` is `NounSelect`'s own dropdown-arrow (line 176). `file-pdf` was
catalog-only (no live blank). These spots resolve when those consumers migrate
to the local `Icon` (they'll show the missing glyph there too, by design, since
the nouns are intentionally gone).

Sort round 3 (human 2026-07-27, Batch D):

| Noun | Decision | Status |
| --- | --- | --- |
| sort | ours → community, derived from the project `chevron-left` rotated 90° (`rotate(-90 64 64)`) rather than sourced as new artwork | **Done** — added + registry regenerated + provenance recorded |

`sort` had no artwork in any tier nor under `public/icons/`, so its legacy
consumer (`ManualTocOrdering`) rendered blank in production. Reusing the
existing project chevron follows the `chevron-right` mirror precedent: the same
project polygon under an SVG transform, not invented vocabulary.

Sort round 4 (human 2026-07-28, Batch G):

| Noun | Decision | Status |
| --- | --- | --- |
| open-down | ours → open-source, derived from the project `chevron-left` rotated 90° (`rotate(-90 64 64)`), following the `sort` precedent rather than sourcing new artwork | **Done** — added + registry regenerated + provenance recorded |
| check | third-party MIT → open-source: Ant Design Icons outlined `check`, chosen via `shadcn.io/icon/ant-design-check-outlined` | **Done** — geometry taken from `ant-design/ant-design-icons@6c18c63fbcfcf71dae09cd6bd6d63a48f8b688f1` (`packages/icons-svg/svg/outlined/check.svg`), normalized to `currentColor`, provenance recorded under the already-vendored `LICENSE-ant-design-icons` |

Both nouns reverse their Sort round 2 retirement, and the reason is the
correction recorded in Batch G: the local `Icon` paints a visible missing glyph
where legacy painted nothing, so leaving them retired would have shipped an
error-looking mark into `NounSelect`'s trigger and the account-deletion CTA.

Two notes on the ports. `open-down` is **geometrically identical to `sort`** —
both are the project chevron rotated to point down — and is deliberately kept as
its own noun and its own file rather than an alias, because this arc's
compatibility boundary forbids invented aliases and the two nouns carry
independent dispositions. `check` was identified from the shadcn.io aggregator
page the human named, but the artwork is taken from the pinned upstream commit:
the aggregator publishes no path data, and provenance requires an immutable
source. As with `warning`, the aggregator credits contributor "HeskeyBaozi"
while the upstream LICENSE names Ant UED, which is what `PROVENANCE.md` records.
