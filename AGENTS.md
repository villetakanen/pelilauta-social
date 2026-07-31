# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library.
> **Goal:** v21 is v20's design on v18's business logic. v19 and v20 were upgrades too large to finish, so v21 ports the v20 look onto the shipped v18 application instead, one verifiable step at a time — replacing the legacy Lit.js design system with local Svelte components as it goes.
> **Core constraint:** v21 will run on its own host, sharing Firestore, Storage and Auth with live v18. What they share is a contract.

## The `pnpm` Workspace

```yaml
- apps
  - pelilauta      # the v21 application, pelilauta.social
  - design         # the design-system site — its shell, navigation and information architecture
- packages
  - design-system  # components, styles, specs, and the books that publish them
- specs            # approved behaviour, one per capability
- plans            # epic scope
  - debt           # known gaps that are nobody's story
- docs
  - adrs           # irreversible decisions
  - lessons        # notes we might act on later; disposable
```

## Delivery Contract

- Dependencies may be updated or added, majors included — try the update locally first, and ask before merging one. The versions inherited from v18 are dated, so treat a build or CI failure as a stale dependency until proven otherwise, rather than hacking around it.
- A merge to `main` during the beta cycle is a release: it deploys and CI tags it. Only on the owner's request or approval.
- Every pull request bumps the root beta version — `pnpm version prerelease --preid=beta`. The root `package.json` carries the release version; nested app versions keep their own meaning. No approval needed.
- Fix what the work touches, and defects it uncovers inside the same epic. Unrelated cleanup and speculative generalization stay out. Refusing a fix is a decision, not a default.
- Replace Cyan one surface at a time. Most of it is CSS — tokens, resets, element styles, utilities — and the rest is Lit components. Check what v20 already built before writing anything; `docs/MIGRATION.md` owns the mechanics.

## Workspace Contract

- This is a pnpm workspace. Both applications use the latest approved Astro version with TypeScript; repository tooling includes Biome, Lefthook, Conventional Commits, and Playwright.
- Use Vite aliases for source-level links between workspace projects, mirrored by TypeScript path aliases. Do not introduce monorepo package-linking or build-orchestration tooling for these links.
- Netlify deploys two distinct sites from this repository. `pelilauta.social` builds and publishes `apps/pelilauta`; `design.pelilauta.social` builds and publishes `apps/design`. Both install from the workspace root so shared source is available.

## Judgment Boundaries

**NEVER**
- Create, switch, or delete a branch. Until the beta line ends, this repository has exactly two branches: `main`, and the one long-living `feat/**` branch that all work happens on. Every pull request comes from that branch, whatever its topic. Only an explicit written instruction changes which branch that is: do not branch, and do not ask whether to branch.
- Break v18 drop-in compatibility without an explicit, approved specification.
- Alter Firebase schemas or security rules, or make a destructive data migration, without approval.
- Bundle broad refactors with a compatibility migration.

**ASK**
- When the v18 behavior or Firebase contract cannot be established from source, deployed behavior, or existing specifications.
- Before changing public URLs, authentication/authorization behavior, persisted data, deployment configuration, or how releases and versioning work.

**ALWAYS**
- Inspect the relevant v18 implementation and write or update the compatibility spec before changing a migrated surface.
- Use `delivery-review` only when the human owner explicitly requests an implementation review; the separate adversarial review required for specs remains mandatory.

## Working Model

Human approval governs product scope, compatibility exceptions, dependencies, data changes and merges. Agents may investigate, implement a bounded change, run proportionate deterministic checks, and prepare a reviewable pull request. Treat a failing check or an unverified compatibility assumption as a gate, not a reason to continue to the next migration step. Do not administer human review or acceptance unless asked.

Spec, lessons, and review conventions follow the practices published at [ASDLC.io](https://asdlc.io), adapted to this repository.
