# Core Design Tokens Epic Plan

Status: Direction approved; implementation approvals remain
Branch: `feat/core-design-tokens`
Iteration outcome: establish the v21 design-system foundation without changing the imported v18 application

## Epic Intent

This iteration creates a small, independently deployable design-system workspace and its first stable foundation: the lowest-level visual tokens derived from v20. The tokens are specified, implemented, and demonstrated in living design-system books. A separate Cyan 4 compatibility stylesheet maps legacy custom-property names to the canonical v21 names so later component migrations can preserve old consumers deliberately.

The iteration also creates three project-local OpenCode skills that keep future design-system work inside the correct spec, package, documentation, and app boundaries.

The epic does not migrate a Pelilauta component or load the new design system into `apps/pelilauta`.

## Goals

1. Deploy `apps/design` as the live design-system site at `design.pelilauta.social`.
2. Establish `packages/design-system` as the owner of v21 tokens, styles, and documentation page implementations.
3. Port the approved lowest-level token values from v20 into stable DTCG 2025.10 token files with a coherent naming system.
4. Keep specs, canonical token data, generated CSS, deterministic checks, and living documentation pages aligned for every token family.
5. Provide an explicit Cyan 4 compatibility stylesheet whose legacy properties resolve only through canonical v21 tokens.
6. Add project-local `ds-doc-page-writer`, `ds-spec-writer`, and `ds-developer` skills.
7. Improve the minimum repository harness needed to make these changes repeatable and reviewable.

## Approved Direction

Confirmed on 2026-07-15:

- The epic includes reference tokens only: color scales, spatial references, radii, and typography references.
- Canonical token paths use a category-first DTCG grammar; generated web properties use the corresponding `--cn-*` grammar.
- Stable DTCG 2025.10 token files are canonical implementation data, and CSS is a deterministic web projection.
- The Cyan 4 adapter preserves legacy property names while intentionally substituting v21 values; it does not guarantee Cyan 4 visual parity.
- Root test, non-mutating check, and CI improvements gate design-system scaffolding and token implementation.

## Success Evidence

| Outcome | Acceptance evidence |
| --- | --- |
| Design site is independent | `apps/design` builds and deploys without Firebase credentials or a Pelilauta build |
| Routes remain thin | Astro route files in `apps/design/src/pages` only adapt requests and import page implementations from `packages/design-system/pages` |
| Package owns the design system | Tokens, package styles, book/page implementations, and reusable demos live under `packages/design-system` |
| Canonical names are uniform | A deterministic check accepts every DTCG token path and generated web property and rejects duplicates, collisions, and invalid references |
| Token data is interoperable | Canonical `.tokens.json` files conform to the stable DTCG 2025.10 format and color modules |
| v20 provenance is explicit | Specs record an immutable repository URL, commit, repository-relative source path, and selection intent; DTCG code contains the reviewed values |
| Books reflect implementation | Published token tables and examples derive from the canonical DTCG token data |
| Cyan 4 compatibility is bounded | `cyan-4.css` contains aliases to canonical tokens, has no independent visual literals, and is not loaded by `apps/pelilauta` |
| Skills enforce ownership | Each skill has narrow write boundaries and can be discovered after OpenCode restarts |
| Deployment is observable | A Git-triggered production deploy and read-only HTTP smoke check pass at the canonical design-site URL |

## Artifact Roles

This epic follows the spec-anchored model described by [The Spec](https://asdlc.io/patterns/the-spec/):

1. This plan and its PBIs describe the approved scope and delivery delta.
2. Specs under `specs/design-system/` preserve durable intent, design constraints, quality criteria, and discoveries from implementation. They are living hypotheses, not executable source.
3. Deterministic DTCG token files under `packages/design-system/` are authoritative for canonical token paths, types, and values.
4. Generated CSS is the deterministic web representation of that token code and is never edited independently.
5. Automated checks provide executable evidence that code and generated output continue to satisfy the intended invariants.
6. Living books explain and demonstrate the implemented behavior; they do not define values independently.
7. The reviewed [`pelilauta-20` token sources at commit `02880fb`](https://github.com/villetakanen/pelilauta-20/tree/02880fbc995b45d459ce4f264b29d5283b1d8ced/packages/cyan/src/tokens) provide design provenance.
8. The exact `@11thdeg/cyan-css@4.0.0-beta.39` artifact used by v18 provides compatibility names.
9. The beta.38 Cyan 4 snapshot in the v20 repository is supporting history only; it is not exact v18 evidence.

v20 files are evidence, not files to copy wholesale. They contain duplicate namespaces, stale docs, undefined examples, and mixed primitive, semantic, and component responsibilities.

Durable provenance uses repository-relative paths for this repository and a repository URL plus immutable commit and repository-relative path for external source. Committed plans, specs, docs, code comments, and skills never contain developer-home or sibling-checkout paths.

## Recommended Scope Of "Lowest Level"

This epic should port only context-free reference values that can exist before components:

- Color reference scales: primary, surface, error, warning, info, and love.
- Spatial references: base grid, gap, and line.
- Radius references: the reviewed small through full scale.
- Typography references: font families, font-size scale, line-height scale, letter-spacing scale, and numeric weights.

The following v20 values should wait for later semantic or component PBIs:

- Surface, text, link, border, status, input, elevation, and interaction roles.
- Button, FAB, icon, rail, tray, app-bar, loader, editor, and other component dimensions.
- Component-specific color properties.
- Layout ratios and breakpoints.
- Z-index roles.
- Global element styling and typography utility classes.
- Fonts as shipped assets, unless the typography spec records the intent and implementation verifies their licensing and loading.

This boundary prevents the first token change from silently becoming a component or visual-theme migration.

## Token Standard

This epic adopts the stable Design Tokens Community Group 2025.10 reports:

- [Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [Color Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/)
- [Resolver Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/)

The moving preview documents under `/tr/drafts/` are not implementation authority.

Implementation model:

- Canonical token code uses `.tokens.json` files with DTCG `$type`, `$value`, groups, and aliases.
- Token paths are platform-neutral identities such as `color.primary.70` and `space.grid`.
- A deterministic transformer projects token paths to web custom properties such as `--cn-color-primary-70` and `--cn-space-grid`.
- Generated CSS is committed for direct source consumption and checked for freshness; it is not hand-edited.
- Living books consume the canonical token data rather than maintaining a second value table.
- The Cyan 4 compatibility file remains hand-authored CSS because legacy custom-property names are web-platform integration details, not canonical token identities.
- Adoption of a translation or validation dependency requires the normal dependency approval gate. If a small local transformer is sufficient, it must implement only the DTCG subset used by this epic and validate unsupported input explicitly.

## Naming Decision

### Recommendation

Use category-first DTCG token paths and one corresponding public web namespace:

```text
color.{palette}.{step}       -> --cn-color-{palette}-{step}
space.{role}                 -> --cn-space-{role}
radius.{size}                -> --cn-radius-{size}
font.family.{role}           -> --cn-font-family-{role}
font.size.{role}             -> --cn-font-size-{role}
font.weight.{role}           -> --cn-font-weight-{role}
line-height.{role}           -> --cn-line-height-{role}
letter-spacing.{role}        -> --cn-letter-spacing-{role}
```

Examples:

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "70": {
        "$value": {
          "colorSpace": "oklch",
          "components": [0.7, 0.27, 135]
        }
      }
    }
  }
}
```

```css
--cn-color-primary-70: oklch(...);
--cn-space-grid: 0.5rem;
--cn-radius-md: var(--cn-space-grid);
--cn-font-family-body: Lato, system-ui, sans-serif;
--cn-font-size-body: 1.0625rem;
```

Rules:

- DTCG token paths are the canonical platform-neutral identities.
- `--cn-*` is the only generated public web namespace.
- Paths and generated names identify category, role, and optional scale in that order.
- Public size suffixes use one vocabulary: `xs`, `sm`, `md`, `lg`, `xl`.
- Numeric color steps remain numeric because they identify tonal references, not semantic roles.
- DTCG types are explicit and never inferred from names.
- Canonical token files never refer to Cyan 4 aliases.
- Semantic and component token grammars are specified later; this epic reserves rather than invents them.
- Transformer-only implementation details are not emitted into the public token or CSS APIs.

### Alternatives Considered

| Approach | Assessment |
| --- | --- |
| Copy v20 names exactly | Fast, but retains mixed `--chroma-*`, `--cn-*`, long radius names, and component values in primitive files |
| Preserve Cyan 4 names as canonical | Reduces immediate aliases but makes migration debt the permanent v21 API |
| Normalize DTCG paths and generated `--cn-*` names | Recommended; adds a deliberate alias map while making the long-term API coherent and portable |

The naming grammar is an API decision. It requires human approval before token implementation begins and should be recorded in an ADR because later renames would affect every consumer.

## Compatibility Layer

`packages/design-system/styles/compat/cyan-4.css` is a transitional consumer adapter, not a second theme implementation.

Alias direction:

```css
:root {
  --chroma-primary-70: var(--cn-color-primary-70);
  --cn-grid: var(--cn-space-grid);
  --cn-border-radius-medium: var(--cn-radius-md);
}
```

Behavior:

- Legacy Cyan 4 names point to canonical v21 names.
- The file contains no color, spacing, radius, or typography literals.
- Every alias target exists in the canonical manifest.
- Canonical files do not refer back to compatibility names.
- Only exact Cyan 4 beta.39 names needed by the bounded primitive scope are included initially.
- Semantic and component aliases are added with the later surface that needs them, not preemptively.
- The compatibility entry is independently importable and is not included in the canonical package stylesheet by default.
- Loading it into `apps/pelilauta` requires a later compatibility spec and human acceptance.

The compatibility file substitutes v20-derived v21 values for Cyan 4 names. It therefore does not preserve Cyan 4's visual values. That distinction must be visible in its spec and documentation.

## Workspace Architecture

```text
apps/design/
  astro.config.mjs
  netlify.toml
  package.json
  src/pages/                 # thin route adapters only

packages/design-system/
  pages/                     # Astro page implementations and living books
  tokens/                    # canonical DTCG .tokens.json files
  scripts/                   # deterministic DTCG-to-CSS projection
  styles/tokens.css          # generated, committed web representation
  styles/compat/cyan-4.css   # opt-in legacy aliases
  tests/                     # DTCG, generation, and alias invariant checks

specs/design-system/
  spec.md
  tokens/
  living-books/

.opencode/skills/
  ds-doc-page-writer/SKILL.md
  ds-spec-writer/SKILL.md
  ds-developer/SKILL.md
```

Source-level links use one Vite alias mirrored by TypeScript paths. No workspace package linking or build orchestrator is introduced for design-system source.

## Skill Responsibilities

### `ds-spec-writer`

- Triggers for creating, updating, or reverse-engineering design-system specs.
- Writes only under `specs/design-system/**`.
- Reads v18 for compatibility work, v20 for provenance, and current v21 code/tests for actual state.
- Records external provenance as repository URL, immutable commit, and repository-relative path rather than a local checkout path.
- Separates normative behavior from anomalies and migration debt.
- Records package ownership, docs target, accessibility, SSR, and compatibility assumptions.
- Treats the spec as a living intent hypothesis and incorporates discoveries from implementation.
- Keeps intent and quality criteria concise and observable; it does not implement, test, or commit.

### `ds-developer`

- Triggers for implementing work anchored in the current design-system specs.
- Treats `packages/design-system` as the implementation owner.
- Treats `apps/design` as a deployment and thin-route host.
- Treats DTCG token files as canonical token code and generated CSS as checked web output.
- Uses Astro for structural pages and Svelte for reusable interactive components when needed.
- Does not patch package gaps with app-local CSS.
- Treats disagreement between spec and code as a reconciliation gate, not as automatic precedence for either artifact.
- Runs package-local checks first, then the narrow design-app integration checks.
- Reports package files, app files, assumptions, checks, and remaining human gates.

### `ds-doc-page-writer`

- Triggers for living-book pages and design-system documentation.
- Reads the current spec for intent and the actual implementation for behavior before writing prose or demos.
- Reads canonical DTCG token data for tables and examples rather than duplicating values in page source.
- Writes page implementations and docs-only demos under `packages/design-system/pages/**`.
- Touches `apps/design/src/pages/**` only to add a missing thin route adapter.
- Uses static Astro examples by default and hydrates Svelte only for genuine interaction.
- Does not invent behavior or production APIs; missing capability is reported as a package gap.
- Runs the narrow design-site build and route checks.

Each skill is created as a separate reversible PBI under `.opencode/skills/<name>/SKILL.md`. OpenCode must be restarted before discovery is accepted.

## Delivery Sequence

Each numbered item is one candidate PBI unless implementation proves it must be split further. Every PBI ends with deterministic checks and a reviewable commit before the next begins.

### Expected Delivery Order

Delivery is intentionally serial for delegated implementation and review. Task `N+1` starts only after task `N` is implemented, its checks pass, the result is reviewed, and its commit is present on `feat/core-design-tokens`. A blocked or rejected task keeps the sequence at that task; later tasks do not work around it.

| Order | PBI | Starts after |
| --- | --- | --- |
| 1 | Add root test dispatch | Epic plan approved |
| 2 | Add a non-mutating root check | 1 accepted |
| 3 | Add minimal CI | 2 accepted |
| 4 | Add `ds-spec-writer` | 3 accepted |
| 5 | Add `ds-developer` | 4 accepted |
| 6 | Approve design-system architecture and naming intent | 5 accepted |
| 7 | Scaffold `packages/design-system` | 6 accepted |
| 8 | Add deterministic DTCG-to-CSS projection | 7 accepted |
| 9 | Scaffold `apps/design` | 8 accepted |
| 10 | Integrate root commands and CI | 9 accepted |
| 11 | Add `ds-doc-page-writer` | 10 accepted |
| 12 | Deploy the design-site skeleton | 11 accepted and deployment approved |
| 13 | Port color reference tokens | 12 accepted |
| 14 | Port spatial and radius reference tokens | 13 accepted |
| 15 | Port typography reference tokens | 14 accepted |
| 16 | Capture exact Cyan 4 primitive inventory | 15 accepted |
| 17 | Implement Cyan 4 compatibility stylesheet | 16 accepted |
| 18 | Document Cyan 4 compatibility behavior | 17 accepted |
| 19 | Run clean-workspace acceptance | 18 accepted |
| 20 | Run human visual and architecture acceptance | 19 accepted |
| 21 | Verify live site and close the loop | 20 accepted |

Every delegated task receives only its issue, the linked plan sections, relevant current specs, and exact allowed paths. Review evaluates the actual diff and check output before advancing the sequence.

### Phase 0: Harness Preconditions

1. Add root test dispatch.

   Add a read-only `pnpm test` that can include the design package and app as they appear. Preserve imported Pelilauta test behavior.

2. Add a non-mutating root check.

   Separate verification from formatting. The command must be safe for local review and CI.

3. Add minimal CI.

   Verify recursive checkout, frozen install, tests, non-mutating checks, and root build. Keep deployment outside PR CI.

These are direct writebacks from the v18 import retrospective and gate implementation work in the new workspace surfaces.

### Phase 1: Skills And Intent

4. Add `ds-spec-writer`.

   Distill the useful v20 spec and reverse-spec behavior into one v21 skill. Verify its frontmatter, path, boundaries, and discovery after restart.

5. Add `ds-developer`.

   Encode the package/app boundary and focused verification workflow. Verify discovery after restart.

6. Approve the design-system architecture and naming intent.

   Add the parent design-system spec, token parent spec, and a naming ADR. Confirm the primitive scope, DTCG path grammar, and web projection before token code exists.

### Phase 2: Deployable Skeleton

7. Scaffold `packages/design-system`.

   Add only the DTCG source structure and package-local conformance test harness needed by this epic. Add dependencies only after human approval.

8. Add the deterministic web projection.

   Transform a minimal DTCG fixture into committed `--cn-*` CSS, reject unsupported types and naming collisions, and fail when generated output is stale. Keep this PBI independent of the visual token values.

9. Scaffold `apps/design`.

   Add the latest approved Astro and Svelte integration, mirrored Vite/TypeScript source alias, one thin home route, and one package-owned home-page implementation.

10. Integrate root commands and CI.

   Add explicit design and all-workspace commands without changing the existing root `build` command used by the Pelilauta Netlify site. Both applications must be independently filterable, and CI must call the all-workspace verification path explicitly.

11. Add `ds-doc-page-writer`.

    Base the skill on the actual v21 route and page structure rather than anticipated v20 paths. Verify discovery after restart.

12. Deploy the design-site skeleton.

    Add app-local Netlify configuration, provision/link the separate site, configure the canonical domain, and verify a Git-triggered deployment. Document configuration and rollback without environment values. Deployment configuration and domain activation require a human gate.

### Phase 3: Primitive Token Vertical Slices

13. Port color reference tokens.

    Review the pinned v20 `packages/cyan/src/tokens/chroma.css`, approve the values, write the color-reference spec, implement typed DTCG `color.*` tokens, generate `--cn-color-*` properties, add conformance and generation checks, and publish a light/dark-neutral living-book page derived from the token data.

14. Port spatial and radius reference tokens.

    Reconcile the pinned v20 `units.css` with its duplicate `radii.css`, approve one scale, implement typed DTCG `space.*` and `radius.*` tokens, generate their `--cn-*` properties, test alias resolution, and publish the corresponding living book from token data. Component dimensions remain excluded.

15. Port typography reference tokens.

    Reconcile the pinned v20 source values with its stale specs and docs, approve exact precision and role names, implement typed DTCG typography references without global element styling, generate their `--cn-*` properties, test the projection, and publish a typography living book from token data. Font asset loading is a separate decision if required.

Each vertical slice updates its spec, code, checks, and book together. A slice is not complete when any one of those surfaces disagrees.

### Phase 4: Cyan 4 Adapter

16. Capture the exact Cyan 4 primitive inventory.

    Extract custom-property names from `@11thdeg/cyan-css@4.0.0-beta.39`, record package integrity/provenance, and classify only aliases covered by this epic. Do not infer beta.39 from the beta.38 v20 snapshot.

17. Implement the Cyan 4 compatibility stylesheet.

    Add an explicit alias map to canonical tokens, a package export/entry point, and deterministic checks for completeness, target existence, cycle absence, and literal absence.

18. Document compatibility behavior.

    Add the compatibility spec and living-book reference table. Clearly state that aliases preserve property names while substituting v21 values; they do not claim Cyan 4 visual parity.

### Phase 5: Acceptance And Compound

19. Run clean-workspace acceptance.

    Verify frozen installation, root tests/check/build, independent design build, package token tests, route smoke tests, and a clean recursive checkout where practical.

20. Run human visual and architecture acceptance.

    Review token scales, typography, both browser color schemes, responsive documentation, naming clarity, and the package/app boundary. Confirm that `apps/pelilauta` is unchanged and does not import the new package or compatibility file.

21. Verify the live site and close the loop.

    Merge through a gated PR, verify the Git-triggered deployment and canonical domain, then write the iteration retrospective. Candidate lessons go to focused specs, skills, checks, or runbooks rather than expanding root `AGENTS.md` automatically.

## Verification Strategy

### Deterministic

- Frozen workspace installation succeeds.
- Root test, non-mutating check, and build commands pass.
- `apps/design` builds independently.
- Every canonical token conforms to the adopted DTCG 2025.10 subset and approved path grammar.
- DTCG token paths and generated CSS names are unique, map one-to-one, and references resolve without cycles.
- Regenerating CSS produces no diff from the committed web representation.
- The compatibility map contains aliases only and every target exists.
- Living-book routes build and return successful responses.
- Thin-route checks prevent implementation from accumulating in `apps/design/src/pages`.
- Repository searches show no new design-system imports in `apps/pelilauta`.

### Probabilistic Review

- Review each implementation against its linked spec and v20 provenance.
- Review whether token families remain primitive rather than absorbing semantic or component roles.
- Review docs for stale names, fallback values that hide failures, and claims not supported by implementation.
- Review skills for narrow triggers, non-overlapping ownership, and current paths.

### Human

- Approve the definition of the lowest-level token scope.
- Approve the canonical DTCG path grammar, generated CSS grammar, and ADR.
- Approve v20 values as the intended v21 visual foundation despite v18 differences.
- Approve new dependencies and deployment configuration.
- Accept visual rendering in both browser color schemes and responsive layouts.
- Approve the Netlify project and `design.pelilauta.social` domain activation.

## Non-Goals

- No Lit.js component replacement.
- No `apps/pelilauta` stylesheet, layout, route, Firebase, auth, or data change.
- No claim of v18 visual parity for v20-derived values.
- No semantic color theme beyond the primitive references needed by the living books.
- No component tokens or component library beyond minimal documentation structure.
- No package publishing or workspace package-linking architecture.
- No bulk copy of v20 specs, MDX pages, skills, tests, or generated files.
- No broad cleanup of imported v18 tooling in the same PBIs.

## Risks And Controls

| Risk | Control |
| --- | --- |
| v20 values unintentionally change v18 UI | Keep the package and compatibility entry disconnected from `apps/pelilauta` |
| Naming is frozen before it is understandable | Human-gated ADR plus concrete examples and one-family review before expansion |
| v20 stale docs become v21 truth | Treat implementation values as provenance and rewrite concise v21 specs/books |
| Cyan 4 beta.38 is mistaken for live beta.39 | Inventory the exact dependency artifact and record integrity |
| DTCG adoption adds unnecessary tool complexity | Implement the smallest approved 2025.10 subset and gate any translation dependency separately |
| Generated CSS drifts from token data | Commit deterministic output and fail checks when regeneration produces a diff |
| Compatibility aliases become permanent ambiguity | Isolate them in one opt-in file with legacy-to-canonical direction only |
| DS app grows implementation | Thin-route checks and package-owned page implementations |
| Site deploy repeats Netlify workspace failures | Reuse the v18 import lessons: explicit base, filtered build, publish path, and Git deploy smoke |
| Skills create excess context or overlap | Three narrow project-local skills, one canonical copy each, tested individually |
| Docs and CSS drift | Token manifest checks and one vertical slice containing spec, code, checks, and book |

## Rollback Boundaries

- Each skill can be removed independently.
- `apps/design` can be undeployed without affecting `apps/pelilauta`.
- Each token-family slice can be reverted before any product consumer exists.
- The Cyan 4 adapter is an opt-in entry and can be removed without changing canonical tokens.
- No Firebase or persisted-data rollback is required in this epic.

## Remaining Implementation Gates

1. Approve each dependency addition when the package and app manifests are proposed.
2. Approve the DTCG path and generated CSS naming ADR text before the first canonical token file lands.
3. Approve exact v20 values and precision one token family at a time.
4. Decide whether font assets belong in the typography slice after licensing and loading are established.
5. Approve the Netlify project configuration and `design.pelilauta.social` domain activation.
