# AGENTS.md

> **Project:** pelilauta.social is a Finnish online community for tabletop role-playing games, with discussion channels and a shared library. It serves Finnish, Swedish, and English. Unicode `latin` and `latin-ext` contain every required character.
> **State:** v21 is the application, at release candidate. The repository carries no code from earlier versions; specs and code record system behavior.
> **Design source:** Read `../pelilauta-20` for v20 design where a spec has not settled a treatment.
> **Core constraint:** v21 runs on a dedicated host, sharing Firestore, Storage, and Auth with v18, which is live at pelilauta.social until v21 replaces it.

## Project Map

- `apps/pelilauta` contains the v21 application; `apps/design` publishes the design system.
- `packages/design-system` contains shared components, styles, specs, and specimen books.
- `specs` contains system behavior specifications, organized with one capability per directory. Spec status is `proposed`, `live`, or `deprecated`. A task starts from live governing specs unless the operator explicitly asks it to start from a proposed spec. For a minor, settled amendment, present the unapplied diff and rationale in chat. Apply the accepted amendment while retaining `live` status after operator approval. For a new, material, or unsettled amendment discovered during implementation, set the spec status to `proposed`, continue the task, and flag the change in the delivery report. An operator clears a proposed spec to `live`, or turns it back, at review.
- An epic is a GitHub issue labeled `epic`, carrying transient scope and defining behavior until a spec governs it. A known unplanned gap is an issue labeled `task` and `debt`. `docs/EPIC_TEMPLATE.md` defines epic structure.
- `docs/DESIGN.md` defines design intent, `docs/WRITING.md` defines writing rules, and `docs/ARCHITECTURE.md` defines naming conventions and artifact responsibilities.

## ALWAYS

- Conform prose to `docs/WRITING.md` and `docs/ARCHITECTURE.md` when writing documents, books, specs, or comments. Reference those files directly instead of restating their contents.
- Increment the root beta version with `pnpm version prerelease --preid=beta --no-git-tag-version` once per release on the first commit after merging to `main`. Subsequent commits on the branch skip version bumps because the version already leads `main`. CI tags the merge commit.
- Remain on the active long-lived release branch, named `feat/<major>-<minor>`.
- Execute the verification gate corresponding to the active question; `delivery.yaml` defines gate commands, cadences, and coverage.

## NEVER

- Create, switch, or delete a branch without an explicit instruction. Requesting permission is not an instruction; wait for explicit approval.
- Run the `apps/pelilauta` end-to-end suite. `test:e2e` seeds Firestore at startup and requires tens of minutes, and the suite is not evidence (#120). Read the governing spec and run the `apps/design` test suite instead.
- Run `pnpm test:uat` to check work in progress. It performs release acceptance, resets Firestore, and requires ten minutes. Run UAT during delivery review. Verify work in progress using `astro check`, `pnpm test`, and the `apps/design` suite.
- Write Firestore security rules into repository files. The repository is public while security rules protect the live service. Reason about security rules when provided, and state conclusions without exposing rule details in prose or code.

## Delivery Contract

- Test dependency additions and updates locally. Merging dependency changes requires explicit approval.
- During beta, merging the active release branch to `main` constitutes a release and its approval.
- Fix defects within touched scope and resolve defects discovered in the active work scope.

## Workspace Contract

- Link workspace packages using Vite aliases mirrored in TypeScript path mappings. Do not introduce package-linking or build-orchestration tooling.

## Judgment Boundaries

Request and await explicit confirmation before:

- altering assets shared with live v18, including Firestore schemas, security rules, persisted data, authentication behavior, and public URLs, or departing from established behavior on them;
- migrating data destructively;
- modifying deployment configuration, release processes, or versioning workflows.

Request clarification when established behavior or the Firebase contract cannot be derived from source code, the deployed application, or an existing spec.

A design-system capability requires a governing spec. An `apps/pelilauta` feature requires no new spec when work preserves established behavior; create or update its spec when work introduces or alters behavior.

Every design-system change is governed by a spec. Create or amend that spec as part of the change, not as a gate before it: a proposed amendment does not halt the work, and the operator clears it to `live`, or turns it back, at delivery review. Minor spec amendments follow the inline workflow.
