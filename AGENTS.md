# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library. v21 is a Firebase-compatible successor to the live v17/v18 application.
> **Core constraint:** Every v21 release is a drop-in replacement for live v18. Deliver small, independently verifiable slices while replacing the legacy Lit.js design system with local Svelte design-system components.

## Delivery Contract

- Treat v17/v18 behavior, Firebase integration, public routes, data shapes, and user-visible interactions as compatibility contracts unless an approved spec says otherwise.
- A feature branch is a continuous context and may deliver multiple slices to `main` before it closes. Treat each merge, not the lifetime branch diff, as the deployable and coherently reversible delivery unit.
- Integrate to `main` only through a pull request from a `feat/*` feature branch or an emergency branch; never push to `main` directly. A long-living `feat/*` branch delivers each slice as its own pull request.
- Evolve factory, harness, and architecture inside the production slice that first establishes and verifies their concrete need. Keep required supporting work visible in slice scope and review; defer unrelated cleanup, unsupported generalization, and additional migration steps.
- Migrate one bounded surface at a time: preserve its behavior first, then replace its Lit.js dependency with the equivalent local Svelte component.
- Start each delivery loop with one observable production outcome in a named target application. Consumer-free foundation work requires explicit human approval and a timebox.
- For a production delivery loop, treat one working day without a production-integrated slice as a mandatory re-scope gate; do not expand prerequisite PBIs or abstractions.
- A design-system functionality is complete only when the same delivery slice includes its intent spec, contract implementation, and package-owned DS book integrated into `apps/design`.
- Record durable behavior and architecture as intent specs under `specs/` (anatomy: `specs/TEMPLATE.md`), and irreversible decisions in `docs/adrs/` once that directory is introduced. A PBI describes one change; its linked spec remains the source of truth.
- Specs carry `provenance:` frontmatter naming the v18 sources, immutable upstream commits, or human decisions their claims rest on, and pass the adversarial review gate in the spec skill before a human approves them.

## Workspace Contract

- This is a pnpm workspace. Both applications use the latest approved Astro version with TypeScript; repository tooling includes Biome, Lefthook, Conventional Commits, and Playwright.
- `apps/pelilauta` owns the v21 source for `pelilauta.social`. Its initial baseline is an exact import of the current v17/v18 `main`, after which v21 owns and evolves the code.
- `apps/design` owns the design-system site at `design.pelilauta.social`. Keep its Astro route files thin and import page implementations from `packages/design-system/pages` through Vite aliases.
- `packages/design-system` owns local Svelte components, styles, page implementations, and design specifications.
- Use Vite aliases for source-level links between workspace projects, mirrored by TypeScript path aliases. Do not introduce monorepo package-linking or build-orchestration tooling for these links.
- Netlify deploys two distinct sites from this repository. `pelilauta.social` builds and publishes `apps/pelilauta`; `design.pelilauta.social` builds and publishes `apps/design`. Both install from the workspace root so shared source is available.

## Judgment Boundaries

**NEVER**
- Break v18 drop-in compatibility without an explicit, approved specification.
- Add a dependency, alter Firebase schemas/security rules, or make a destructive data migration without approval.
- Bundle broad refactors with a compatibility migration.

**ASK**
- When the v18 behavior or Firebase contract cannot be established from source, deployed behavior, or existing specifications.
- Before changing public URLs, authentication/authorization behavior, persisted data, release/versioning behavior, or deployment configuration.

**ALWAYS**
- Inspect the relevant v18 implementation and write or update the compatibility spec before changing a migrated surface.
- Before migrating a Lit consumer to its local component, run the pre-flight in `docs/practices/consumer-migration.md`: enumerate the legacy Cyan CSS rules scoped to the component's element tag for that context, decide how each is re-expressed against the local component, and finish with a rendered-in-context visual acceptance.
- Use the `delivery-slice` skill to prepare and integrate each proposed merge. Use `delivery-review` for release-significant compatibility, factory, harness, architecture, deployment, licensing, or generated-source changes.

## Working Model

Human approval governs product scope, compatibility exceptions, dependencies, data changes, and releases. Agents may investigate, implement a specified bounded change, evolve the supporting factory within that slice, run deterministic checks, and prepare reviewable integration. Treat a failing check or an unverified compatibility assumption as a gate, not a reason to continue to the next migration step.

## Workflow Guides

Spec, lessons, and review conventions follow the practices published at [ASDLC.io](https://asdlc.io), adapted to this repository.

- Active lessons: `docs/practices/lessons.md`. Every delivery task reads and updates the current branch file under `docs/lessons/` as new evidence appears; do not wait for a close prompt.
- Consumer migration: `docs/practices/consumer-migration.md` carries the cross-cycle decisions and the required pre-flight for migrating a Lit consumer to its local component.
- Intent specs: `.agents/skills/spec/SKILL.md`, template at `specs/TEMPLATE.md`
- Delivery slices: `.agents/skills/delivery-slice/SKILL.md`
- Risk-scaled implementation review: `.agents/skills/delivery-review/SKILL.md`
- Lessons and compound decisions: `.agents/skills/lessons/SKILL.md`
- Root releases: `.agents/skills/release/SKILL.md` and `docs/runbooks/releases.md`
