# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library.
> **Goal:** v21 is v20's design on v18's business logic. v19 and v20 were upgrades too large to finish, so v21 ports the v20 look onto the shipped v18 application instead, one verifiable step at a time — replacing the legacy Lit.js design system with local Svelte components as it goes.
> **Core constraint:** v21 will run on its own host, sharing Firestore, Storage and Auth with live v18. What they share is a contract.

## The `pnpm` Workspace

```yaml
- apps
  - pelilauta      # the v21 application  → pelilauta.social         · dev :4321
  - design         # the design-system site, its navigation and IA
                   #                      → design.pelilauta.social  · dev :4322
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
- Replace Cyan one surface at a time. Most of it is CSS — resets, element styles, utilities, and the tokens those read — and the rest is Lit components. Check what v20 already built before writing anything; `docs/MIGRATION.md` owns the mechanics.

## Workspace Contract

- Link workspace projects with Vite aliases, mirrored in TypeScript paths. No package-linking or build-orchestration tooling.
- Netlify publishes each app as its own site, each installing from the workspace root.

## Judgment Boundaries

Never create, switch, or delete a branch. Until the beta line ends, this repository has exactly two branches: `main`, and the one long-living `feat/**` branch that all work happens on. Every pull request comes from that branch, whatever its topic. Only an explicit written instruction changes which branch that is: do not branch, and do not ask whether to branch.

Ask first, and wait, before:

- changing anything v21 shares with live v18 — Firestore schemas or security rules, persisted data, authentication behaviour, public URLs — or departing from v18's behaviour on a shared surface;
- migrating data destructively;
- changing deployment configuration, or how releases and versioning work.

Ask, rather than assume, when v18's behaviour or the Firebase contract cannot be established from source, from the deployed application, or from an existing spec.

Before changing a migrated surface, inspect the v18 implementation and write or update its spec.

Spec, lessons, and review conventions follow the practices published at [ASDLC.io](https://asdlc.io), adapted to this repository.
