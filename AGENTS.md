# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library. It serves Finnish, Swedish and English; every character the three need is in Unicode `latin` and `latin-ext`.
> **Goal:** v21 is v20's design on v18's business logic. v19 and v20 were upgrades too large to finish, so v21 ports the v20 look onto the shipped v18 application instead, one verifiable step at a time — replacing the legacy Lit.js design system with local Svelte components as it goes.
> **Design sources:** v20 is at `../pelilauta-20`; Cyan 4 is at `../cyan-design-system-4`.
> **Core constraint:** v21 will run on its own host, sharing Firestore, Storage and Auth with live v18.
> **Scope deviation:** v21 deprecates, and removes, the characters sub-app of v18 (`docs/adrs/0003-discontinue-characters.md`).

## Project Map

- `apps/pelilauta` is the v21 application; `apps/design` publishes the design system.
- `packages/design-system` contains the components, styles, specs and books both use.
- `specs` contains the system's behaviour, one capability per directory. A spec's
  `status` is `proposed`, `live` or `deprecated`: implementation follows `live`
  specs; building on a `proposed` spec requires an explicit ask, and waiting.
  Any spec may be edited at any time — an agent edit to a `live` spec sets it
  `proposed`, and an operator makes it `live` by reading it. The status is a
  process gate, never a ceremony: do not request, await or announce approval.
- `plans` contains transient epic scope; a plan carries behaviour only until a spec
  takes it. `plans/debt` contains known unplanned gaps.
- `docs/DESIGN.md` holds the design intent; `docs/WRITING.md` holds the writing rules;
  `docs/ARCHITECTURE.md` holds the naming and what each artifact carries.

## ALWAYS

- Base prose on `docs/WRITING.md` and `docs/ARCHITECTURE.md` when writing a document, a
  book, a spec or a comment. A skill references those files rather than restating them.
- Bump the root beta version with `pnpm version prerelease --preid=beta
  --no-git-tag-version` once per release: on the first commit after a merge to main.
  Later commits on the same branch do not bump, because the version is already ahead
  of main. CI tags the merge commit.
- Stay on the current long-lived `feat/**` branch.

## NEVER

- Create, switch or delete a branch without an explicit order. Asking is not the order;
  wait for the answer.
- Run `apps/pelilauta`'s e2e suite. `test:e2e` seeds Firestore before it starts, and a
  full run takes tens of minutes. It is not acceptance either — `docs/MIGRATION.md` says
  why. Read a spec where the change relies on it, and run `apps/design`'s suite instead.
- Run `pnpm test:uat` to check work in progress. It is release acceptance, and it
  resets Firestore and takes ten minutes. Run it at delivery review. In flight,
  `astro check`, `pnpm test` and `apps/design`'s suite are the checks.
- Write any detail of the Firestore security rules into the repository. The repository is
  public and the rules guard the live service, so what they permit, forbid or fail to
  cover stays out of every file here, code and prose alike. Reason about them where you
  are given them, and state a conclusion without the rule behind it.

## Delivery Contract

- Dependency additions and updates, including majors, may be tried locally. Merging them
  requires explicit approval.
- During beta, a release is the merge of the active `feat/**` pull request to **main**;
  that merge is its approval.
- Fix what the work touches, and any defect it uncovers in the same epic.
- Replace Cyan one surface at a time. Most of Cyan is CSS: resets, element styles,
  utilities and their tokens; the rest is Lit components. Check v20 before writing
  anything, and follow `docs/MIGRATION.md` for migration mechanics.

## Workspace Contract

- Link workspace projects with Vite aliases, mirrored in TypeScript paths. No package-linking or build-orchestration tooling.

## Judgment Boundaries

Ask first, and wait, before:

- changing anything v21 shares with live v18 — Firestore schemas or security rules, persisted data, authentication behaviour, public URLs — or departing from v18's behaviour on a shared surface;
- migrating data destructively;
- changing deployment configuration, or how releases and versioning work.

Ask when v18's behaviour or the Firebase contract cannot be established from source, from the deployed application, or from an existing spec.

Before changing a migrated surface, inspect the v18 implementation. A design-system
capability requires a spec. An obvious `apps/pelilauta` feature does not require one
when the migration preserves its established purpose and behaviour; write or update
its spec when the work defines or changes either.
