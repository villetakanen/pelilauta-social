# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library. v21 is a Firebase-compatible successor to the live v17/v18 application.
> **Core constraint:** Every v21 release is a drop-in replacement for live v18. Deliver small, independently verifiable slices while replacing the legacy Lit.js design system with local Svelte design-system components.

## The `pnpm` Workspace

```yaml
- apps
  - pelilauta      # the ported v18 app, with minor migratory fixes
  - design         # design system app (design.pelilauta.social)
- packages
  - design-system  # design system package
- specs            # spec files describing the expected behaviour of the apps
- plans            # epic level PBIs
- docs
  - lessons        # unhandled compound loop findings
  - adrs           # ADR records
```

## Delivery Contract

- Treat v17/v18 behavior, Firebase integration, public routes, data shapes, and user-visible interactions as compatibility contracts unless an approved spec says otherwise.
- **DEPENDENCY VERSIONS ARE NOT THEMSELVES COMPATIBILITY CONTRACTS.** Libraries may — and should — be updated, **including across breaking majors**, whenever the update preserves the compatibility contracts above. Staying on a legacy version is not a compatibility requirement and is not a way to reduce delivery risk; it accumulates it. When a problem is caused by an outdated dependency, **check whether the dependency can simply be updated before designing any workaround.** Updates remain an ASK for approval, but the default answer sought is "update it," not "work around it."
- A feature branch is a continuous context and may deliver multiple slices before it closes. Treat each merge, not the lifetime branch diff, as the deployable and coherently reversible delivery unit.
- Never commit or push to `main` directly; integrate through a pull request. A long-living feature branch delivers each slice as its own pull request.
- Evolve factory, harness, and architecture inside the production slice that first establishes and verifies their concrete need. Keep required supporting work visible in slice scope and review; defer unrelated cleanup, unsupported generalization, and additional migration steps.
- Migrate one bounded surface at a time: preserve its behavior first, then replace its Lit.js dependency with the equivalent local Svelte component.
- Start each delivery loop with one observable production outcome in a named target application. Consumer-free foundation work requires explicit human approval and a timebox.
- For a production delivery loop, treat one working day without a production-integrated slice as a mandatory re-scope gate; do not expand prerequisite PBIs or abstractions.
- A design-system functionality is complete only when the same delivery slice includes its intent spec, contract implementation, and package-owned DS book integrated into `apps/design`.
- Record approved behavior and architecture as intent specs under `specs/` (anatomy: `specs/TEMPLATE.md`), and irreversible decisions as ADRs in `docs/adrs/`. A PBI describes one change; its linked spec remains the source of truth.
- Specs carry `provenance:` frontmatter naming the v18 sources, immutable upstream commits, or human decisions their claims rest on, and pass the adversarial review gate in the spec skill before a human approves them.
- Agents prepare reviewable pull requests and stop. The human owner reads the PR, performs any visual acceptance, and decides whether and when to merge or release; none of those actions is implied by passing checks or a ready preview.
- Use targeted deterministic checks while implementing. The root `pnpm verify` command, invoked by the pull-request workflow, owns broad repository verification; do not manually repeat it after unrelated or documentation-only edits.

## Workspace Contract

- This is a pnpm workspace. Both applications use the latest approved Astro version with TypeScript; repository tooling includes Biome, Lefthook, Conventional Commits, and Playwright.
- `apps/pelilauta` owns the v21 source for `pelilauta.social`. Its initial baseline is an exact import of the current v17/v18 `main`, after which v21 owns and evolves the code.
- `apps/design` owns the design-system site at `design.pelilauta.social`. Keep its Astro route files thin and import page implementations from `packages/design-system/pages` through Vite aliases. It also owns the site's shell, navigation and content collections, because those encode the documentation site's information architecture rather than a design-system capability.
- A book is an entry in an `apps/design` content collection whose body renders one package-owned component from `packages/design-system/books`. The collection id is the book's URL group. Adding a book is one entry plus one component; route files and navigation are not edited.
- The book taxonomy — which groups exist, their labels, their order — is a design-system decision declared in `packages/design-system/books/groups.json`. The site reads it; it does not define it.
- `packages/design-system` owns local Svelte components, styles, book and page implementations, and design specifications.
- Use Vite aliases for source-level links between workspace projects, mirrored by TypeScript path aliases. Do not introduce monorepo package-linking or build-orchestration tooling for these links.
- Netlify deploys two distinct sites from this repository. `pelilauta.social` builds and publishes `apps/pelilauta`; `design.pelilauta.social` builds and publishes `apps/design`. Both install from the workspace root so shared source is available.

## Judgment Boundaries

**NEVER**
- Break v18 drop-in compatibility without an explicit, approved specification.
- Add a dependency, alter Firebase schemas/security rules, or make a destructive data migration without approval.
- Bundle broad refactors with a compatibility migration.

**ASK**
- Before integrating a dependency update. Agents may test an update in a disposable local investigation before approval, but must not commit, push, or include it in a delivery slice until approved. Bring the evidence from that check; do not propose a workaround for an outdated-dependency problem without reporting whether updating it works.
- When the v18 behavior or Firebase contract cannot be established from source, deployed behavior, or existing specifications.
- Before changing public URLs, authentication/authorization behavior, persisted data, release/versioning behavior, or deployment configuration.

**ALWAYS**
- Inspect the relevant v18 implementation and write or update the compatibility spec before changing a migrated surface.
- When planning or implementing migration of an existing v18/Cyan consumer,
  read `docs/MIGRATION.md`. It owns shared migration mechanics, inherited E2E
  debt, and the terminal Cyan sweep; it is not general design-system context.
- Use the `delivery-slice` skill to prepare each proposed merge. Use `delivery-review` only when the human owner explicitly requests an implementation review; the separate adversarial review required for intent specs remains mandatory.

## Working Model

Human approval governs product scope, compatibility exceptions, dependencies, data changes, merges, and releases. Agents may investigate, implement a specified bounded change, evolve the supporting factory within that slice, run proportionate deterministic checks, and prepare a reviewable pull request. Treat a failing check or an unverified compatibility assumption as a gate, not a reason to continue to the next migration step. Do not administer human review or acceptance unless asked.

## Workflow Guides

Spec, lessons, and review conventions follow the practices published at [ASDLC.io](https://asdlc.io), adapted to this repository.

- Lessons: `docs/practices/lessons.md`. `docs/lessons/` is a decision inbox — one file per finding whose fix would need the owner. Findings may be applied, deferred with a concrete trigger, or discarded; deletion is the normal end state and the commit message is the record. Agents must never rely on lesson files for required context.
- v18/Cyan migration: `docs/MIGRATION.md`
- Intent specs: `.agents/skills/spec/SKILL.md`, template at `specs/TEMPLATE.md`
- Delivery slices: `.agents/skills/delivery-slice/SKILL.md`
- Risk-scaled implementation review: `.agents/skills/delivery-review/SKILL.md`
- Writing a lesson finding: `.agents/skills/lesson/SKILL.md`
- Retro and compound mining: `.agents/skills/retro/SKILL.md`
- Root releases: `.agents/skills/release/SKILL.md` and `docs/runbooks/releases.md`
