# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library. It serves Finnish, Swedish, and English; Unicode `latin` and `latin-ext` contain every required character.
> **Goal:** v21 ports the v20 visual presentation onto the shipped v18 application logic in verifiable increments, replacing the legacy Lit.js design system with Svelte components.
> **Design sources:** `../pelilauta-20` for v20, and `../cyan-design-system-4` for Cyan 4.
> **Core constraint:** v21 runs on a dedicated host, sharing Firestore, Storage, and Auth with live v18.
> **Scope deviation:** v21 deprecates and removes the characters feature from v18 (`docs/adrs/0003-discontinue-characters.md`).

## Project Map

- `apps/pelilauta` contains the v21 application; `apps/design` publishes the design system.
- `packages/design-system` contains the shared components, styles, specs, and specimen books.
- `specs` contains system behavior specifications, organized with one capability per directory. Spec status is `proposed`, `live`, or `deprecated`; implementation follows `live` specs. For a minor, settled amendment, present the unapplied diff and rationale in chat. Apply the accepted amendment while retaining `live` status after operator approval. For a new, material, or unsettled amendment, set the spec status to `proposed` and stop before implementation. An operator marks a proposed spec `live` after reviewing it. Spec status serves as a process gate.
- An epic is a GitHub issue labeled `epic`, carrying transient scope and defining behavior until a spec governs it. A known unplanned gap is an issue labeled `task` and `debt`. `docs/EPIC_TEMPLATE.md` defines epic structure.
- `docs/DESIGN.md` defines design intent, `docs/WRITING.md` defines writing rules, and `docs/ARCHITECTURE.md` defines naming conventions and artifact responsibilities.

## ALWAYS

- Conform prose to `docs/WRITING.md` and `docs/ARCHITECTURE.md` when writing documents, books, specs, or comments. Reference those files directly instead of restating their contents.
- Increment the root beta version with `pnpm version prerelease --preid=beta --no-git-tag-version` once per release on the first commit after merging to `main`. Subsequent commits on the branch skip version bumps because the version already leads `main`. CI tags the merge commit.
- Remain on the active long-lived `feat/**` branch.
- Execute the verification gate corresponding to the active question; `delivery.yaml` defines gate commands, cadences, and coverage.

## NEVER

- Create, switch, or delete a branch without an explicit instruction. Requesting permission is not an instruction; wait for explicit approval.
- Run the `apps/pelilauta` end-to-end suite. `test:e2e` seeds Firestore at startup and requires tens of minutes. The suite does not provide acceptance testing, as explained in `docs/MIGRATION.md`. Read the governing spec and run the `apps/design` test suite instead.
- Run `pnpm test:uat` to check work in progress. It performs release acceptance, resets Firestore, and requires ten minutes. Run UAT during delivery review. Verify work in progress using `astro check`, `pnpm test`, and the `apps/design` suite.
- Write Firestore security rules into repository files. The repository is public while security rules protect the live service. Reason about security rules when provided, and state conclusions without exposing rule details in prose or code.

## Delivery Contract

- Test dependency additions and updates locally. Merging dependency changes requires explicit approval.
- During beta, merging an active `feat/**` pull request to `main` constitutes a release and its approval.
- Fix defects within touched scope and resolve defects discovered in the active epic.
- Replace Cyan one surface at a time. Cyan comprises CSS resets, element styles, utilities, tokens, and Lit components. Verify v20 before writing code, and follow `docs/MIGRATION.md` for migration procedures.

## Workspace Contract

- Link workspace packages using Vite aliases mirrored in TypeScript path mappings. Do not introduce package-linking or build-orchestration tooling.

## Judgment Boundaries

Request and await explicit confirmation before:

- altering assets shared with live v18, including Firestore schemas, security rules, persisted data, authentication behavior, and public URLs, or departing from v18 behavior on shared surfaces;
- migrating data destructively;
- modifying deployment configuration, release processes, or versioning workflows.

Request clarification when v18 behavior or the Firebase contract cannot be derived from source code, the deployed application, or an existing spec.

Inspect the v18 implementation before altering a migrated surface. A design-system capability requires a governing spec. An `apps/pelilauta` feature requires no new spec when migration preserves established behavior; create or update its spec when work introduces or alters behavior.

Every design-system change requires a named open epic and a governing live spec. Do not alter design-system code, tests, or specimen books until establishing both. Minor spec amendments follow the inline workflow; staged proposed amendments halt delivery before modifying implementation artifacts.
