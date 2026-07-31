# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library.
> **Goal:** v21 is v20's design on v18's business logic. v19 and v20 were upgrades too large to finish, so v21 ports the v20 look onto the shipped v18 application instead, one verifiable step at a time — replacing the legacy Lit.js design system with local Svelte components as it goes.
> **Core constraint:** Every v21 release is a drop-in replacement for live v18. Behavior, data shapes, routes and Firebase integration are compatibility contracts. Appearance is not — it is expected to change, and v18 is not its reference.

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
  - lessons        # notes for the next harness change
  - adrs           # ADR records
```

## Delivery Contract

- Treat v17/v18 behavior, Firebase integration, public routes, data shapes, and how user-visible interactions work as compatibility contracts unless an approved spec says otherwise. How they look is not: appearance follows v20, governed by the design-system specs.
- **DEPENDENCY VERSIONS ARE NOT THEMSELVES COMPATIBILITY CONTRACTS.** Libraries may — and should — be updated, **including across breaking majors**, whenever the update preserves the compatibility contracts above. Staying on a legacy version is not a compatibility requirement and is not a way to reduce delivery risk; it accumulates it. When a problem is caused by an outdated dependency, **check whether the dependency can simply be updated before designing any workaround.** Updates remain an ASK for approval, but the default answer sought is "update it," not "work around it."
- Work is delivered in small pull requests, one topic each. A feature branch may open several before it closes; each merge is the deployable and reversible unit, not the branch.
- Never commit or push to `main` directly; integrate through a pull request. Merging is the owner's, and merging deploys.
- Every pull request bumps the root beta version — `pnpm version prerelease --preid=beta` — because every merge to `main` deploys and is a release. This is an increment, not a decision.
- A pull request delivers something tangible to `apps/pelilauta` or `apps/design`. A design-system book, a documented rule or a user-visible change all count; work with no reader does not.
- Supporting changes ride along with the work that first needs them. Keep unrelated cleanup, speculative generalization and extra migration steps out.
- Migrate one bounded surface at a time: preserve its behavior first, then replace its Lit.js dependency with the equivalent local Svelte component.
- Record approved behavior as specs under `specs/`, and irreversible decisions as ADRs in `docs/adrs/`. A PBI describes one change; its linked spec remains the source of truth.
- Agents prepare reviewable pull requests and stop. The human owner reads the PR, performs any visual acceptance, and merges. Passing checks or a ready preview never authorizes the merge.
- Use targeted deterministic checks while implementing. The root `pnpm verify` command, invoked by the pull-request workflow, owns broad repository verification; do not manually repeat it after unrelated or documentation-only edits.

## Workspace Contract

- This is a pnpm workspace. Both applications use the latest approved Astro version with TypeScript; repository tooling includes Biome, Lefthook, Conventional Commits, and Playwright.
- `apps/pelilauta` owns the v21 source for `pelilauta.social`. Its initial baseline is an exact import of the current v17/v18 `main`, after which v21 owns and evolves the code.
- `apps/design` owns the design-system site at `design.pelilauta.social`, including its shell, navigation, content collections and information architecture.
- `packages/design-system` owns local Svelte components, styles, and design specifications.
- Use Vite aliases for source-level links between workspace projects, mirrored by TypeScript path aliases. Do not introduce monorepo package-linking or build-orchestration tooling for these links.
- Netlify deploys two distinct sites from this repository. `pelilauta.social` builds and publishes `apps/pelilauta`; `design.pelilauta.social` builds and publishes `apps/design`. Both install from the workspace root so shared source is available.

## Judgment Boundaries

**NEVER**
- Break v18 drop-in compatibility without an explicit, approved specification.
- Add a dependency, alter Firebase schemas/security rules, or make a destructive data migration without approval.
- Bundle broad refactors with a compatibility migration.

**ASK**
- Before integrating a dependency update. Agents may test an update in a disposable local investigation before approval, but must not commit, push, or include it in a pull request until approved. Bring the evidence from that check; do not propose a workaround for an outdated-dependency problem without reporting whether updating it works.
- When the v18 behavior or Firebase contract cannot be established from source, deployed behavior, or existing specifications.
- Before changing public URLs, authentication/authorization behavior, persisted data, deployment configuration, or how releases and versioning work. Performing the routine beta bump is not one of these.

**ALWAYS**
- Inspect the relevant v18 implementation and write or update the compatibility spec before changing a migrated surface.
- When planning or implementing migration of an existing v18/Cyan consumer,
  read `docs/MIGRATION.md`. It owns shared migration mechanics, inherited E2E
  debt, and the terminal Cyan sweep; it is not general design-system context.
- Use `delivery-review` only when the human owner explicitly requests an implementation review; the separate adversarial review required for specs remains mandatory.

## Working Model

Human approval governs product scope, compatibility exceptions, dependencies, data changes and merges. Agents may investigate, implement a bounded change, run proportionate deterministic checks, and prepare a reviewable pull request. Treat a failing check or an unverified compatibility assumption as a gate, not a reason to continue to the next migration step. Do not administer human review or acceptance unless asked.

Spec, lessons, and review conventions follow the practices published at [ASDLC.io](https://asdlc.io), adapted to this repository.
