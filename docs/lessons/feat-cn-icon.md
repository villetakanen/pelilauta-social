# feat/cn-icon Lessons

Status: Active

## Update Rule

Read this file before doing work on `feat/cn-icon`. Update it as soon as work
produces a meaningful observation, correction, failed assumption, decision, or
reusable technique. Do not wait for cycle close or a separate prompt.

Keep facts, interpretations, and decisions distinguishable. This file is
working memory, not proof that the planned outcome has shipped.

## Current Context

The bounded slice is implemented and all deterministic checks pass; human
visual acceptance and the release decision remain. Shipped on `feat/cn-icon`:
the legacy `--color-on` inheritance fix, the five icon sizing tokens, the
two-tier source model (community catalog in the public design-system package;
proprietary artwork consumed from the relocated `@myrrys/proprietary`
submodule), the server-rendered `Icon` component, the three migrated consumers
(app bar, footer, featured tags), the `/components/icon` book, focused package
and design-book tests, and a root test dispatcher with a pre-push hook.

Checks: `astro check` 0 errors; pelilauta build and design build complete;
design-system 8/8 unit tests; pelilauta 463/463 unit tests; the icon-book
Playwright spec passes.

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
| v21 submodule pins a pre-registry commit | Relocated to `packages/myrrys-proprietary`, always tracking latest proprietary `main` (now `e9d8217`) | Adds icon tier, preserves served webp assets |
| `pbta-logo` differs from submodule `pbta`; mapping would change the rendered logo | Resolved 2026-07-21: add exact v18 `pbta-logo` artwork to the proprietary repo (`e9d8217`), resolved via the managed tier | Preserves the live front-page logo appearance |

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
- Human visual acceptance in Light and Dark of the app-bar search action,
  the four featured tags, the footer fox, and every book example.
- Approval of source provenance for the selected community assets
  (`fox`, `search`) recorded in the design-system community `PROVENANCE.md`.
- Release decision (next beta) after acceptance.
