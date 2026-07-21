# feat/cn-icon Lessons

Status: **Active — long-living epic branch.** `feat/cn-icon` is the continuous
context for the iconography epic and delivers each slice to `main` as its own
pull request. Delivered so far: local Icon migration `v21.0.0-beta.2` (merge
`5cf6b0c`, tag `v21.0.0-beta.2`), 2026-07-21. Remaining epic work: catalog /
iconography-principles capability, and the next bounded Lit→Svelte consumer
migrations. (The contextual-icon-sizing slice shipped on a separate branch as
`v21.0.0-beta.3`; see `docs/lessons/feat-icon-context-sizing.md`.)

## Slices In Progress

### Slice: factory writeback (governance) — PR #34

- **Outcome.** Not a product change: reworks the delivery governance the epic
  runs under — merge-is-the-deployable-unit, `main` integrated only via PR from
  a `feat/*`/emergency branch, factory work rides in its establishing slice;
  adds `delivery-slice`/`delivery-review` skills; narrows `release`.
- **Integration identity.** PR #34 `feat/cn-icon` → `main`, source head
  `c098165` (after review corrections). Merged 2026-07-21 as `18ea7b3`
  (reconciled here during the next slice, per the lessons practice — no doc-only
  merge). `feat/cn-icon` fast-forwarded to `18ea7b3`.
- **Checks.** No `apps/`/`packages/` source touched; type/build gates
  unaffected. commitlint + pre-push hooks pass.
- **Gate.** `delivery-review` (release-significant factory change) — independent
  adversarial pass, **no blockers**. Two record corrections applied before merge:
  reconciled the stale "Next production problem" beta.3 earmark (it shipped as
  contextual-icon-sizing), and corrected the recorded PR source head to `184447a`.
  Non-blocking `README.md` status-paragraph edit accepted (consistency with the
  removed cycle-setup exception). Human authorized merge-if-clean.
- **Carry-forward.** Next slice on this branch: iconography-principles capability
  (see below).

### Slice: iconography-principles capability — in progress

- **Production outcome (human-decided 2026-07-21).** *Icon usage is readable
  from the design system* — a consumer can read, on `design.pelilauta.social`,
  the available icon vocabulary (which nouns exist and may be used), the usage
  principles, and the tier/provenance governance behind them. **The DS book page
  is the slice deliverable**; the separate spec
  `specs/design-system/iconography/spec.md` is its intent. This makes the slice
  a proper production slice (named target `apps/design`), not foundation-only.
- **Scope correction.** An earlier framing treated this as spec-only with the
  book deferred and a 1-day timebox; the human corrected it — the book (icon
  usage readable from the DS) is the whole point. Re-scope the slice around the
  book page as the observable outcome; the 1-day timebox no longer applies as
  stated. Admission rule codifies current practice: adding a community noun is a
  human-approved change recording source in `PROVENANCE.md`; tier membership
  confers project licensing; community artwork is monochrome `currentColor`.
- **Resolved open decisions (2026-07-21).** (1) Noun **alias policy** — deferred
  out of scope until a real consumer need appears; capability governs distinct
  nouns only. (2) DS **book** — **required** for Done (governance-only work is
  not exempt from the Delivery-Contract book rule); it is in fact the
  deliverable per the production-outcome correction above.
- **Gate.** Spec adversarial-review pass (spec skill) → human spec approval
  (`draft`→`approved`) before any implementation. Then a catalog-vs-provenance
  parity check and absent-submodule build are the named deterministic
  acceptance checks.
- **Adversarial spec review (spec-skill gate).** Independent pass raised 3
  blockers, all resolved in a revision:
  - B1: `PROVENANCE.md` has no licence column, so a "row has source + licence"
    check was unrunnable. Resolved: community-tier membership confers project
    licensing (admission requires project-licensable artwork); the row records
    *source* only. No phantom licence column.
  - B2: "absent-submodule build completes" was contradicted by
    `managed-tier.ts` (runtime-only guard) and named no probe. Resolved: grounded
    in the cn-icon cycle's verified absent-submodule builds; named `dd5` as the
    concrete managed-only probe that must degrade to the missing glyph.
  - B3: tier precedence was mis-attributed to the `cn-icon` spec, which never
    mentions tiers. Resolved: precedence is owned *here*, ported from v20
    `02880fbc`, and cited.
  Non-blocking also fixed: bundled-fallback tier grounded in `icon-fallback.ts`;
  parity made bidirectional; accessibility anchored to the Icon contract instead
  of restated; colour acceptance tightened to a concrete `fill="currentColor"`
  grep; circular DoD item reframed to an observable catalog state.
- **Re-review (spec gate, 2nd pass).** No blockers. Non-blocking fixes applied:
  aliased body text reworded to match the resolved (not "open") decision;
  vocabulary scope pinned (community nouns enumerated in full, managed/fallback
  by example since managed is proprietary/absent-able); book acceptance narrowed
  to page *legibility* in both modes so it does not re-verify icon rendering the
  cn-icon contract owns; added a Non-Goal keeping the extend-IconPage-vs-new-page
  choice a plan decision to avoid a duplicate page.
- **Design-first reframe (human feedback 2026-07-21).** The human read the spec
  and found it over-weighted to *technical* detail (tiers, provenance,
  deterministic checks) and under-weighted on *design*. Corrected: the book is a
  usage/design-principles page — why icons are used, clarity over decoration,
  icon-only vs. labelled, accessibility-in-use, size/alignment, do's and don'ts,
  and the **vocabulary grouped by purpose**. Governance/tiers demoted to a
  supporting "Where icons come from" section. Adapted the human's example draft
  to our reality: local `Icon` (`noun=`) not `<cyan-icon>`, and the vocabulary
  reflects the actual catalog (community = fox, search; managed/fallback by
  example) rather than an aspirational icon list.
- **Spec gate (reframed, 3rd pass).** Sound, no blockers. Resolved: NB1
  (purpose categories over-promised vs. the real catalog; Intent illustrated
  with non-existent `edit`/`roll`/`bookmark`) — groups now appear only when
  populated, Intent illustration de-nouned, managed icons enumerated in full;
  N1 (accessibility "action" wording over-applied to standalone icons) — scoped
  to icon-only controls, standalone icons convey their noun's meaning. N2
  (subjective "readable") accepted: pinned to the content checklist + named
  human review.
- **Status.** Spec **approved** by the human 2026-07-21 (`status: approved`).
  Implementation in progress.
- **Implementation (2026-07-21).** Built the deliverable:
  - `packages/design-system/pages/IconographyPage.astro` — usage/principles
    page: intent, usage principles (clarity/accessibility/size-alignment),
    do & don't, vocabulary grouped by purpose, "where icons come from".
  - Route `apps/design/src/pages/iconography.astro` (`/iconography`); linked
    from the DS index (`HomePage.astro`, "02 / ICONOGRAPHY").
  - `getManagedNouns` added to `components/managed-tier.ts` (guarded, empty when
    the submodule is absent) so the book enumerates the managed tier.
  - Vocabulary enumerated live at build: **34 nouns** rendered (2 community + 28
    managed + 4 named fallback), grouped into Navigation & system / Community &
    interaction / Tabletop & gaming / Game systems, plus a "More in the catalog"
    catch-all so no existing noun is hidden and none is invented.
  - **Verified:** `pnpm --filter ./apps/design build` — icon-registry fresh,
    `astro check` 0 errors, `/iconography` generated, 34 icon SVGs present.
- **Remaining before the slice PR.** Deterministic acceptance checks
  (catalog↔provenance parity, community `currentColor` grep, absent-submodule
  `dd5`→missing) wired into a gate; human rendered-in-context visual acceptance
  (Light + Dark) of `/iconography`.
- **Vocabulary + catalog-growth decision (human 2026-07-21).** (1) The managed
  (myrrys) tier is **enumerable**, so the book lists **all** managed icons when
  the submodule is present — not merely "by example." This also relieves the
  thin-catalog concern (community is only fox/search today). (2) Community icons
  are **ported from the pelilauta app decisively, one by one** — each port is an
  individual human-approved admission recording source + provenance, not a bulk
  import; this ties catalog growth to the per-consumer migrations. Fold both
  into the spec in the next revision (with the gate findings): change managed
  from "by example" to "enumerated when present", and state the one-by-one
  porting model in the admission/governance section.

## Update Rule

Read this file before doing work on `feat/cn-icon`. Update it as soon as work
produces a meaningful observation, correction, failed assumption, decision, or
reusable technique. Do not wait for cycle close or a separate prompt.

Keep facts, interpretations, and decisions distinguishable. This file is
working memory, not proof that the planned outcome has shipped.

## Delivered Slice — local Icon migration (`v21.0.0-beta.2`)

Historical record of the first shipped slice; superseded state reconciled at the
top Status. Shipped on `feat/cn-icon`:
the legacy `--color-on` inheritance fix, the five icon sizing tokens, the
two-tier source model (community catalog in the public design-system package;
proprietary artwork consumed from the relocated `@myrrys/proprietary`
submodule), the server-rendered `Icon` component, the three migrated consumers
(app bar, footer, featured tags), the `/components/icon` book, focused package
and design-book tests, and a root test dispatcher with a pre-push hook.

Checks: `astro check` 0 errors; pelilauta build and design build complete;
design-system 8/8 unit tests; pelilauta 463/463 unit tests; the icon-book
Playwright spec passes.

An adversarial review round then landed (see `plans/cn-icon-review-notes.md`,
findings 17–18 below): the managed tier is now optional at build and runtime
(BLOCKER 1); SVG normalization moved to generation time, deleting the render
regex (MEDIUM 4); builds gate on registry freshness (NOTE 7). HIGH 2 (scope
bundling) is accepted with an explicit RC scope note (below); HIGH 3 (new test
coverage) is declined this cycle; LOW 5 is a record correction (below); NOTE 8
is a standing gate for future migrations; the LOW 6 broken e2e is a documented
known issue. Re-verified absent-submodule: both apps build; present: both build,
design-system 8/8, icon-book e2e passes, managed `dd5` branded artwork resolves.

## Intended Production Outcome

Restore contextual color inheritance for existing Pelilauta icons, then migrate
the shared app bar, front-page featured tags, and footer to the local
server-rendered icon capability with an integrated design-system book.

## Findings

### 1. The Theme Adapter Broke Icon Color Inheritance

Cyan 4 `cn-icon` declares `color: var(--color-on, currentColor)`. The color-theme
compatibility layer defined the previously absent global `--color-on` property,
so icons stopped falling back to contextual `currentColor` from links, buttons,
selected rows, and status surfaces.

The existing browser check did not catch this. It used the footer icon as an
inheritance probe even though that icon has an explicit inline color.

Decision: the iteration first restores legacy icon inheritance globally and
adds a real parent-to-icon computed-color assertion.

### 2. v20 Is The Target Icon Model, Not Just Inspiration

v20 substantially changed icon sourcing, rendering, fallback, color ownership,
and accessibility. Recreating a smaller unrelated model would discard reviewed
product work and create another migration later.

The target decisions are:

- trusted compile-time source registries;
- deterministic community, managed, fallback, and missing precedence;
- complete icon markup in the initial server response;
- source-owned color, where monochrome artwork uses `currentColor` and branded
  artwork retains approved internal colors;
- a stable missing-icon fallback;
- decorative-by-default semantics;
- five explicit sizes with medium as the default.

Decision: use v20 commit
`02880fbc995b45d459ce4f264b29d5283b1d8ced` as immutable design and
implementation provenance, while reconciling its catalog with live v18 usage.

### 3. Current v18 Assets Remain Compatibility Authority

The v20 registries do not contain every noun used by the current application.
Tracked assets under `apps/pelilauta/public/icons/`, including current-only
artwork such as `search`, `bsky`, `label-tag`, `undo`, and `pbta-logo`, are the
best compatibility evidence for those nouns.

Decision: copy required current-only SVGs into the local catalog with provenance
preserved. Do not move or remove the public originals while legacy Cyan icons
still request them.

Nouns absent from both sources remain explicit product decisions. The iteration
must not invent aliases or artwork for them.

### 4. Icon Sizing Tokens Belong In This Vertical Slice

v21 does not yet own the five established icon sizing properties required by
the local component. Treating that absence as a separate token foundation would
repeat the horizontal sequencing failure from the stopped core-token epic.

Decision: port only the five v20/Cyan icon size properties with this production
consumer: 16, 24, 36, 72, and 128 pixels at the default root size. General
spacing, sizing, typography, radius, and token generation stay outside scope.

### 5. The Migration Surface Is Larger Than The First Slice

The imported application has 182 declarative `cn-icon` usages across 98 files
and one imperative creation site. Consumers include static Astro, hydrated
Svelte, dynamic and persisted nouns, custom-element selectors, and missing
assets.

Decision: migrate a representative public set first rather than mechanically
rewriting the whole application. Keep Cyan Lit registration for remaining
consumers.

### 6. The v20 Registry Generator Can Be Feature Work

A generator is not automatically overengineering. In v20 it directly maintains
the consumed icon registry from trusted SVG sources. That differs from adding a
generic projection for hypothetical token consumers.

Decision: adapt the v20 generator when it is the smallest way to keep the
production-required catalog and generated registry aligned. Do not expand the
catalog or add generic generation infrastructure to justify the mechanism.

### 7. Lessons Must Be Captured During The Work

The first planning pass recorded findings in the plan and waited for a separate
close-time artifact. That made lessons difficult to discover between prompts.

Decision: every delivery branch maintains an active lessons file from its first
meaningful task. Every agent task and project skill reads it before work and
updates it whenever new evidence appears. The same file is finalized after
acceptance or a stop decision.

### 8. One Continuous Lessons File Is Enough

Maintaining active lessons and then creating a separate close-time summary would
duplicate evidence and encourage close-time reconstruction. If the active file
already accumulates findings, decisions, verification, and outcome evidence,
the second artifact has no distinct job.

Decision: use one `docs/lessons/<branch-name>.md` file from first finding through
cycle close. Finalize its outcome and compound decisions in place. Existing
closed cycle records move to `docs/lessons/`, and the separate close-time skill
and practice are removed.

### 9. Spec Conventions Needed Consolidation Before Implementation

Spec work was governed by a skill without a template, provenance for spec
claims lived only in the plan and this lessons file, no review step gated
`draft` → `approved`, and the imported `apps/pelilauta/AGENTS.md` still
described the superseded persona and PBI workflow alongside the root contract.

Decision: align spec conventions with the ASDLC.io Living Specs practice
before starting cn-icon implementation. `specs/TEMPLATE.md` defines the
Intent + Contract anatomy; specs carry `provenance:` frontmatter; the spec
skill gains an adversarial review gate before human approval; the legacy
nested AGENTS.md is removed and root `CLAUDE.md` symlinks to `AGENTS.md`.
The cn-icon spec adopts provenance frontmatter now and passes the review gate
before its approval.

### 10. Adversarial Review Caught Real Spec Defects

The first run of the new spec review gate (2026-07-20, independent critic
session) found genuine defects the authors missed. Verified against the
installed `cyan-lit@4.0.0-beta.30` source: v18 renders the default design
icon for an empty noun, a blank sized box for an unknown noun, and announces
the technical noun to assistive technology via an SVG title. The draft spec
presented departures from all three as plain facts, left the empty-noun state
undefined, lacked the template's Contract half, and held two compatibility
prohibitions only in the plan.

Human decisions on the surfaced changes:

- Empty or absent noun is treated as unknown — deliberate change from the
  v18 design-icon quirk. Accepted.
- Unknown nouns render the approved missing-icon glyph — deliberate change
  from v18's blank box. Accepted.
- Decorative-by-default accessibility was rejected; the icon keeps v18's
  noun announcement. The plan's accessibility notes must follow the spec on
  this point before implementation.

Decision: the spec was rewritten to declare the accepted changes, define the
empty-noun state, add Contract (Definition of Done, Regression Guardrails),
move the asset-relocation and invented-artwork prohibitions into Non-Goals,
and replace untestable acceptance wording. The gate stays mandatory for
future specs; it paid for itself on first use.

### 11. Specs Anchor, They Don't Model

Human review of the rewritten icon spec caught it promising "exact" pixel
sizes that the design-token vocabulary owns, and a Non-Goals sentence whose
compressed clause structure was unreadable. A spec that restates values it
does not control is spec-as-model: it silently forks the owning source and
breaks when that source evolves.

Decision: specs promise only what their capability owns. Values owned by
tokens, parent specs, or upstream contracts are referenced as their owner's
decision, with observed values kept in provenance as evidence. The rule is
now step 9 of the spec skill and a note in `specs/TEMPLATE.md`; prefer plain
sentences over compressed prohibition clauses.

### 12. Iconography Principles Is Epic Scope, Not Slice Scope

Cyan 4 documents icons on two pages: a principles page and the component
usage page. Inspection of the live legacy principles page shows it is only an
auto-generated icon inventory; the design thinking it should carry is absent.
The new design system keeps the two-page shape, and the principles content is
therefore mostly new design work rather than a migration.

Decision (human, 2026-07-20): the epic includes an iconography principles
capability — its own intent spec at `specs/design-system/iconography/spec.md`,
its own book page with a registry-generated catalog inventory, and ownership
of catalog governance that the component spec then anchors to. It ships as
its own slice targeted for `v21.0.0-beta.3`, not in this production slice.
Recorded in `plans/cn-icon.md` under Further Work.

### 13. Proprietary Icons Are A Separate Non-Licensed Submodule Tier

Investigating the v20 source model (`~/dev/pelilauta-20` at the pinned commit
`02880fbc`) before starting step 3–5 showed the source-tier precedence is not
just a resolution nicety — it is a **licensing boundary**.

- The community tier `@pelilauta/icons` (`packages/pelilauta-icons`) holds
  project-licensed artwork such as `fox`.
- The managed tier `@myrrys/proprietary` is a **separate nested git repo**
  (submodule), README: "All rights reserved. No license is granted to use these
  assets outside of the pelilauta.social site... not licensed under the main
  project license." It holds `dd5`, `pathfinder`, `ll-ampersand`, `pbta`,
  `discussion`, and other branded nouns.
- The v20 registry generator (`scripts/generate-icon-registry.ts`) runs once per
  tier and inlines each SVG's source as a string into an `index.ts` **inside
  that tier's own package**. The proprietary artwork's generated registry
  therefore stays within the private submodule; it is never inlined into the
  open packages. `CnIcon.svelte` resolves community → managed → bundled fallback
  → missing glyph.

This directly contradicts the pre-investigation wording of plan step 4 ("copy
`search`, `fox`, `dd5`, `pathfinder`, `ll-ampersand`, `pbta-logo` into the local
catalog"). Four of those six nouns are proprietary. `packages/design-system` is
a public, reusable package; inlining all-rights-reserved artwork into it would
spread proprietary art into exactly the surface v20 keeps clean. The three
selected consumers split across the boundary: `AppBar` → `search`, `AppFooter`
→ `fox` (both community), and **`FeaturedTags` → `dd5`, `pathfinder`,
`ll-ampersand`, `pbta-logo` (all proprietary)** — so the first slice cannot
avoid the managed tier.

Decision (human, 2026-07-20): adopt the v20 two-tier model in v21 now.
Community artwork lives in the public design-system catalog; proprietary
artwork is consumed from the `@myrrys/proprietary` submodule via a generated
registry that stays inside the private boundary, never copied into the public
design-system source.

### 14. v21 State: Submodule Pinned Before The Icon Registry Existed

The `@myrrys/proprietary` submodule is already declared in v21 at
`apps/pelilauta/public/myrrys-proprietary`, but only as a **public asset
directory** — legacy pages serve `/myrrys-proprietary/*.webp` images from it; no
v21 code consumes it as a package. Its pinned commit `b34789a` predates the icon
work and contains only the webp asset folders (`fair-use`, `juno-viinikka`,
`letl`, `public-domain`) — no `icons/`, no generated `index.ts`, no
`package.json`. The icon registry (`icons/`, generated `index.ts`,
`@myrrys/proprietary` `package.json`) exists only from `13857fc` onward, which
is the submodule repo's current `origin/main`. `origin/main` still carries all
four webp folders, so advancing the pointer adds the icon tier without
disturbing the assets already served.

- `dd5`, `pathfinder`, `ll-ampersand` exist verbatim in the submodule tier.
- `fox` and `search` are community, not proprietary. `fox` is in v20
  `pelilauta-icons`; `search` is a v18 current-only asset present in neither v20
  package (only `apps/pelilauta/public/icons/search.svg`).
- **`pbta-logo` noun reconciliation:** `FeaturedTags` requests `pbta-logo`. The
  submodule tier has `pbta`, not `pbta-logo`, and its `pbta` artwork **differs**
  from the artwork production shows today. In v18, `public/icons/pbta-logo.svg`
  and `public/icons/pbta.svg` are byte-identical, and that is the artwork on the
  live front page. Mapping `pbta-logo` → submodule `pbta` would silently change
  the rendered logo — a compatibility break the spec's no-invent/no-alias rule
  forbids. Preserving appearance means the exact v18 `pbta-logo` artwork must be
  the source; being branded, it belongs in the proprietary submodule tier, not
  the public catalog.

### 15. Proprietary Assets Serve From A Relocated Package Via A Sync Step

Human direction during delivery: the `apps/pelilauta/public/myrrys-proprietary`
submodule was a legacy v18-era pointer. The registry-bearing commit belongs at
`packages/myrrys-proprietary` as a real workspace package the icon component
imports; the v18 pointer should not be kept.

Legacy pages still reference the submodule's image assets by URL
(`/myrrys-proprietary/*.webp`). A committed symlink under `public/` is not
safe: Astro 5.18 copies `public/` with `fs.cp(..., { recursive: true })`, whose
default `dereference: false` would emit a dangling symlink into `dist/`. The
resolution is a no-dependency `sync-proprietary-assets.mjs` step, run before
dev and build, that materializes the non-code asset folders into a gitignored
`public/myrrys-proprietary/`; the submodule stays the single source of truth.
`@myrrys/proprietary` resolves through Vite + TS aliases (workspace-contract
approach), not package-linking.

### 16. The Root Test Dispatcher Immediately Caught A Latent Regression

Adding the root `pnpm test` dispatcher (plan step 9) surfaced a failing
pelilauta unit test on first run: `test/styles/colorThemeContract.test.ts`
reported `missing: --color-on`. The branch's first commit removed the bare
`--color-on` mapping (finding 1) but never updated this contract test, which
had no runner wired, so the regression sat latent.

The fix encodes the approved decision rather than reverting it: `--color-on` is
intentionally undefined, excluded from the alias-resolution check, and a new
assertion proves it stays undefined and is only ever used as
`var(--color-on, currentColor)`. This is exactly the acceptance criterion that
the `--color-on` regression is removed without leaving another
production-consumed property unresolved. Lesson: a deterministic check is only
protective once something actually runs it.

### 17. The Managed Tier Is Optional At Build Time, Not Only Runtime

Adversarial review BLOCKER 1: the static `import ... from "@myrrys/proprietary"`
made a missing submodule a compile-time failure for every page rendering an
icon. The chosen fix was a dynamic/optional import. Empirically, that alone does
NOT clear the blocker: Vite resolves the alias at build and inlines the module,
so a `try/catch` dynamic import guards only runtime, and in a bundled build the
module is never absent at runtime if it was present at build. Removing the submodule
still failed the build with `[vite:load-fallback] Could not load .../index.ts`.

The resolution that actually holds: a `resolveId`/`load` Vite plugin
(`packages/design-system/vite/optional-proprietary.mjs`, `enforce: "pre"`)
resolves `@myrrys/proprietary` to the real registry when present and to an
inline empty virtual module when absent — no stub file committed. Plus the
guarded dynamic import (`managed-tier.ts`) for runtime, and
`sync-proprietary-assets` now warns-and-exits-0 instead of exiting 1. Verified:
with the submodule fully removed, both `astro check` and `astro build` succeed
in both apps and icons degrade to the fallback → missing glyph.

Lesson: "make the import optional" is not equivalent to "make the build
optional" under a build-time alias resolver — verify the actual absent case, do
not reason from the import syntax.

### 18. Generation-Time Normalization Preserves Heterogeneous Fills

MEDIUM 4: both tiers stored whole SVG documents and the component reverse-
engineered inner markup + viewBox with a render-time regex (non-global, root
attributes discarded). Moving normalization into the two generators (community
`.mjs`; a new generator committed to the `@myrrys/proprietary` submodule) so each
icon stores `{ inner, viewBox }` deleted that regex and its failure class. The
extraction keeps inner markup verbatim, which matters because the proprietary
artwork encodes color in four different ways (`fill=` attribute, inline
`style="fill:…"`, `<g fill=…>`, and a `<style>` block in `pbta-logo`). Checked
first that no root `<svg>` carries a presentational fill, so dropping the
wrapper is lossless. The submodule pointer advanced to its normalized registry.

### 19. Delivery-Record Correction: Where The `--color-on` Contract Lives

LOW 5: the delivery self-declaration implied `icon.css` consumes
`var(--color-on, currentColor)`. Accurate statement: `icon.css` holds only the
five sizing tokens; the new `Icon.svelte` hardcodes `fill="currentColor"`; the
`var(--color-on, currentColor)` inheritance contract lives in legacy `cn-icon`
(`@11thdeg/cyan-lit`) and is protected by keeping bare `--color-on` undefined
(documented at `styles/compat/cyan-4.css:55-56`). New and legacy icons behave
identically only while `--color-on` stays globally undefined; a scope that sets
it would diverge them. This is a record fix, not a code change.

### 20. Visual Acceptance Caught Tag-Selector Regressions No Gate Could

Human visual acceptance found two live regressions that every deterministic
check had passed over — both instances of the LOW 6 class (cyan-css styles the
`cn-icon` element by tag; the local component renders `<span class="cn-icon">`).

- App-bar search rendered at 36px instead of 24px: cyan-css
  `core/buttons.css` forces `a.button cn-icon { width/height: var(--cn-icon-size-small) }`,
  a tag selector the span does not match. Fixed with `size="small"` on the
  consumer.
- Footer fox was no longer centered: the color-wrapper `<span>` added during
  migration became the flex item of `.flex-col.items-center`, displacing the
  icon. Fixed with `display:contents` on the span, which drops its box (so the
  icon is the flex item again) while still passing its inherited `color` to the
  icon.

Lesson: replacing a custom element with a class-bearing element silently breaks
every tag-scoped rule the design system wrote for it — size, margin, layout —
and unit/registry tests cannot see it because they never render in the consumer
context. Per-consumer visual acceptance in the real app is the only gate that
catches this today; migrating a button- or layout-hosted icon must include a
pass over cyan-css tag selectors for that context. This strengthens the NOTE 8 /
HIGH 3 case that consumer migrations need a rendered-in-context check.

## RC Release Note — Bundled Scope (HIGH 2)

This candidate is one merge/revert unit but lands four related changes; the
release PR/tag note must state this explicitly (reverting the icon feature also
reverts these):

1. **Icon migration** — tiered server-rendered `Icon`, catalog + generators,
   app bar / footer / featured-tags consumers, `/components/icon` book.
2. **Color-theme compatibility** — the `--color-on` inheritance fix and its
   contract test / compat layer (`styles/compat/cyan-4.css`, e2e + contract).
3. **Docs/process migration** — root `AGENTS.md`/`CLAUDE.md`, retros→lessons,
   `specs/TEMPLATE.md`, this runbook.
4. **Tooling** — centralized `lefthook.yml`, commitlint config, skill symlinks.

Decision (2026-07-21): keep bundled with this explicit disclosure rather than
rewriting already-pushed history.

## Known Issues Carried Into Release

- **LOW 6 — `apps/pelilauta/e2e/color-theme.spec.ts` is broken by the footer
  migration.** It selects the `cn-icon` custom-element tag
  (`main > footer cn-icon`, line 143) and throws when absent, but the migrated
  footer now renders `<span class="cn-icon">`. It surfaced no failure only
  because `test:e2e` is in no gate (the HIGH 3 gap). Left untouched this cycle
  per the human decision not to invest in the test system now; must be repaired
  (retarget the selector to `.cn-icon` / the migrated element) before that e2e
  is trusted or gated.

## Compound Decisions So Far

| Finding | Decision | Destination |
| --- | --- | --- |
| Icon colors no longer inherit context | Accept | Compatibility correction and focused browser assertion in this iteration |
| v20 source and color handling is mature | Accept | `plans/cn-icon.md` implementation authority |
| v18 contains required current-only SVGs | Accept | Compatibility additions to the local icon catalog |
| Five sizing tokens are missing | Accept inside this slice | Icon styles, contract tests, and book |
| All-at-once migration is too broad | Defer remaining consumers | Later production slices based on concrete surfaces |
| Icon registry generation may be directly useful | Accept conditionally | Adapt only for the consumed catalog |
| Root test dispatch is missing | Accept narrowly | Root test command and pre-push hook in this iteration |
| CI and broader root orchestration | Reject for now | None |
| Active lessons file was absent | Accept correction | This file plus root and skill workflow rules |
| Separate close-time summary duplicates lessons | Reject separate artifact | Finalize the same lessons file at cycle close |
| Spec conventions were fragmented | Accept | `specs/TEMPLATE.md`, provenance frontmatter, adversarial review gate in the spec skill |
| Legacy nested AGENTS.md contradicted root contract | Accept removal | Root `AGENTS.md` (symlinked as `CLAUDE.md`) is the single agent contract |
| Iconography principles deserve real design content | Accept as epic scope, defer from slice | Own spec, book page, and catalog governance in a `v21.0.0-beta.3` slice |
| Proprietary icons are a non-licensed submodule tier, not catalog copies | Accept two-tier model now | Community catalog in public DS package; proprietary via `@myrrys/proprietary` submodule registry; amend plan step 4 |
| v21 submodule pins a pre-registry commit | Relocated to `packages/myrrys-proprietary`, always tracking latest proprietary `main` (now `69588a6`) | Adds icon tier, preserves served webp assets |
| `pbta-logo` differs from submodule `pbta`; mapping would change the rendered logo | Resolved 2026-07-21: add exact v18 `pbta-logo` artwork to the proprietary repo, resolved via the managed tier | Preserves the live front-page logo appearance |
| AR BLOCKER 1: managed tier is a compile-time hard dependency | Accept — make it optional via a Vite resolver + guarded dynamic import + soft sync; dynamic import alone was insufficient (finding 17) | `vite/optional-proprietary.mjs`, `managed-tier.ts`, both astro configs, sync script |
| AR MEDIUM 4: render-time SVG regex | Accept — normalize at generation time in both generators; store `{ inner, viewBox }` (finding 18) | Community + submodule generators, `Icon.svelte`, submodule pointer |
| AR NOTE 7: registry can ship stale | Accept — run `check:icons` at the start of both app builds | `apps/*/package.json` build scripts |
| AR HIGH 2: scope bundling | Accept bundled + explicit RC scope note; do not rewrite pushed history | RC Release Note section above |
| AR HIGH 3: test gates give false confidence | Reject new coverage this cycle (DS test system too immature) | Deferred; NOTE 8 gate remains |
| AR LOW 5: inaccurate `--color-on` record | Accept — record correction only, code already correct | Finding 19 |
| AR LOW 6: migration broke `color-theme.spec.ts` | Defer repair (test not gated; per HIGH 3 decision) | Known Issues section above |
| AR NOTE 8: catalog tiny vs v18 | Accept as standing gate | Catalog expansion is a prerequisite for each future consumer migration |

## Open Gates

- ~~Adversarial review of `specs/design-system/components/cn-icon/spec.md` per the spec skill's review gate.~~ Completed 2026-07-20; findings resolved in the spec, decisions in Finding 10.
- ~~Human approval of `specs/design-system/components/cn-icon/spec.md`.~~ Approved 2026-07-20.
- ~~Human approval of `plans/cn-icon.md`, including selected consumers, after its accessibility notes are reconciled with the retained v18 noun announcement.~~ Approved 2026-07-20 with the reconciled accessibility notes and the beta.3 iconography follow-on logged.
- ~~Approval to advance the `@myrrys/proprietary` submodule pointer.~~ Superseded
  2026-07-21: the submodule was relocated to `packages/myrrys-proprietary`
  pinned at `e9d8217` (finding 15); the legacy public pointer was dropped.
- ~~Decision on `pbta-logo`.~~ Resolved 2026-07-21: the exact v18 `pbta-logo`
  artwork was added to the `@myrrys/proprietary` repo (`e9d8217`) and resolves
  through the managed tier, preserving the live appearance.
- ~~Implementation and deterministic checks.~~ Complete 2026-07-21; see Current
  Context for the check results.
- ~~Adversarial review (`plans/cn-icon-review-notes.md`).~~ Completed 2026-07-21;
  BLOCKER 1 + MEDIUM 4 + NOTE 7 fixed (findings 17–19); HIGH 2 accepted with RC
  note; HIGH 3 declined; LOW 6 documented as a known issue.
- ~~Human visual acceptance in Light and Dark of the app-bar search action,
  the four featured tags, the footer fox, and every book example.~~ Passed
  2026-07-21; two regressions found and fixed (finding 20).
- ~~Approval of source provenance for the selected community assets
  (`fox`, `search`) recorded in the design-system community `PROVENANCE.md`.~~
  Signed off 2026-07-21.
- ~~Release decision (next beta) after acceptance.~~ Approved and released as
  `v21.0.0-beta.2` on 2026-07-21.

## Cycle Close

- **Production outcome — shipped.** The app bar, footer, and front-page featured
  tags render through the local server-rendered `Icon`, contextual color
  inheritance is restored, and the icon capability is published in the
  design-system book. Released as `v21.0.0-beta.2` (merge `5cf6b0c`, annotated
  tag `v21.0.0-beta.2`); `pelilauta.social` returns HTTP 200 and the PR #30
  Netlify deploy-preview gate passed before merge.
- **Evidence.** `astro check` 0 errors; both app builds complete; design-system
  8/8 unit; pelilauta 463/463 unit; icon-book e2e passes; absent-submodule build
  verified in both apps; human visual acceptance in Light and Dark.
- **What worked.** Generation-time normalization deleted an entire render-time
  failure class; the optional-tier resolver made a non-licensed dependency safe
  without a committed stub; per-consumer visual acceptance caught what every
  automated gate missed.
- **Root cause carried forward.** The local component renders
  `<span class="cn-icon">`, so every cyan-css rule written for the `<cn-icon>`
  tag (size, margin, layout) silently stops applying at migrated sites. This is
  the dominant migration risk for the remaining consumers.
- **Accepted, carried into future plans.** (1) Each consumer migration includes
  a rendered-in-context pass over cyan-css tag selectors for that context.
  (2) Catalog expansion precedes each migration (NOTE 8). (3) Repair the ungated
  `apps/pelilauta/e2e/color-theme.spec.ts` footer selector (LOW 6) before that
  e2e is trusted or gated — explicitly deferred this cycle.
- **Rejected this cycle.** New icon test coverage / real-component unit test
  (HIGH 3): DS test system too immature; revisit with concrete evidence.
- **Remaining assumption.** Build-time survival of an absent submodule was
  verified locally; production always builds with the submodule present.
- **Next production problem.** The iconography-principles epic (own spec, book
  page, catalog governance) and the next bounded Lit-to-Svelte consumer
  migration. (Reconciled: `v21.0.0-beta.3` shipped the contextual-icon-sizing
  slice on branch `feat/icon-context-sizing`, not iconography-principles, which
  is now unversioned remaining epic work — see top Status.)

## Post-Close Factory Writeback — 2026-07-21

Human clarification after reviewing this cycle: a feature branch is a
continuous delivery context and may merge several production slices to `main`
before branch close. The merge, not the lifetime branch diff, is the deployable
and coherently reversible unit. Factory, harness, and architecture work is
expected inside the slice that first establishes and verifies its concrete
need; classifying that work as exceptional "chores" was the wrong lesson.

Accepted writeback: move operational integration procedure out of `AGENTS.md`
into `delivery-slice`, add a risk-scaled `delivery-review` skill for exact merge
deltas, narrow `release` to named release identity and publication, and keep
branch lessons active across multiple delivered slices. Claude skill links
mirror the canonical `.agents/skills` definitions.

Independent review of the writeback caught two workflow ambiguities before it
was relied on: a merge cannot record its own resulting SHA inside itself, and a
release's approved content baseline is not the same commit as the final merge
that adds version metadata. The skills now record pre-merge integration
identity without requiring a bookkeeping-only merge, and tag the final
versioned release commit after verifying it contains the approved baseline.
