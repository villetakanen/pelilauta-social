# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library. It serves Finnish, Swedish and English; every character the three need is in Unicode `latin` and `latin-ext`.
> **Goal:** v21 is v20's design on v18's business logic. v19 and v20 were upgrades too large to finish, so v21 ports the v20 look onto the shipped v18 application instead, one verifiable step at a time — replacing the legacy Lit.js design system with local Svelte components as it goes.
> **Design sources:** v20 is at `../pelilauta-20`; Cyan 4 is at `../cyan-design-system-4`.
> **Core constraint:** v21 will run on its own host, sharing Firestore, Storage and Auth with live v18.
> **Scope deviation:** v21 deprecates, and removes, the characters sub-app of v18 (`docs/adrs/0003-discontinue-characters.md`).

## The `pnpm` Workspace

```yaml
- apps
  - pelilauta       # the v21 application  → pelilauta.social         · dev :4321
  - design          # the design-system site, its navigation and IA
                    #                      → design.pelilauta.social  · dev :4322
- packages
  - design-system    # components, styles, specs, and the books that publish them
- specs              # approved behaviour, one per capability
- plans              # epic scope
  - debt             # known gaps that are nobody's story
- docs
  - adrs             # hard-to-reverse decisions log
  - lessons          # notes we might act on later
  - DESIGN.md        # Design vision and goals
  - ARCHITECTURE.md  # Project architecture vision, and rules
- .agents/skills     # portable skills
- .claude/skills     # symlinked from .agents/skills, to enable dual use with claude 
```

## Delivery Contract

- Dependencies may be updated or added, majors included. Try the update locally first, and ask before merging one. Treat a build or CI failure as a stale dependency until proven otherwise.
- During the beta phase, the active `feat/**` branch is released by a pull request and a merge to **main**. A human approves every release.
- Every pull request bumps the root beta version with `pnpm version prerelease --preid=beta`. No approval needed.
- Fix what the work touches, and any defect it uncovers in the same epic.
- Replace Cyan one surface at a time. Most of Cyan is CSS: resets, element styles, utilities, and the tokens those read. The rest is Lit components. Check what v20 already built before writing anything. `docs/MIGRATION.md` owns the mechanics.

## Workspace Contract

- Link workspace projects with Vite aliases, mirrored in TypeScript paths. No package-linking or build-orchestration tooling.
- Netlify publishes each app as its own site, each installing from the workspace root.

## Judgment Boundaries

Never create, switch, or delete a branch. All work happens on the one long-living `feat/**` branch, and only a written instruction from a human changes which branch that is.

Ask first, and wait, before:

- changing anything v21 shares with live v18 — Firestore schemas or security rules, persisted data, authentication behaviour, public URLs — or departing from v18's behaviour on a shared surface;
- migrating data destructively;
- changing deployment configuration, or how releases and versioning work.

Ask when v18's behaviour or the Firebase contract cannot be established from source, from the deployed application, or from an existing spec.

Before changing a migrated surface, inspect the v18 implementation. A design-system
capability requires a spec. An obvious `apps/pelilauta` feature does not require one
when the migration preserves its established purpose and behaviour; write or update
its spec when the work defines or changes either.

Spec, lessons, and review conventions follow the practices published at [ASDLC.io](https://asdlc.io), adapted to this repository.
