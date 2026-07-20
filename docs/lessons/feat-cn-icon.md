# feat/cn-icon Lessons

Status: Active

## Update Rule

Read this file before doing work on `feat/cn-icon`. Update it as soon as work
produces a meaningful observation, correction, failed assumption, decision, or
reusable technique. Do not wait for cycle close or a separate prompt.

Keep facts, interpretations, and decisions distinguishable. This file is
working memory, not proof that the planned outcome has shipped.

## Current Context

No `cn-icon` production change has shipped in this cycle yet. The intent spec
and delivery plan are drafted, v18 and immutable v20 implementations have been
studied, and accepted compound writebacks from the color-theme cycle have been
applied. Implementation and acceptance remain pending.

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

## Open Gates

- ~~Adversarial review of `specs/design-system/components/cn-icon/spec.md` per the spec skill's review gate.~~ Completed 2026-07-20; findings resolved in the spec, decisions in Finding 10.
- Human approval of `specs/design-system/components/cn-icon/spec.md`.
- Human approval of `plans/cn-icon.md`, including selected consumers, after its accessibility notes are reconciled with the retained v18 noun announcement.
- Approval of source provenance for the selected current-only assets.
- Implementation, deterministic checks, visual review, and release decision.
