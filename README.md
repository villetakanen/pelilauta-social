# pelilauta.social v21

This pnpm workspace contains the Firebase-compatible v21 successor to the live
Pelilauta community and its local design system.

v21 is v20's design on v18's business logic. v19 and v20 were upgrades too large
to finish, so v21 ports the v20 look onto the shipped v18 application instead.
Behavior, data shapes, routes and Firebase integration stay compatible with live
v18; appearance is expected to change.

## Project Status

**Current release:** `v21.0.0-beta.9`

v21 has a verified import of the live v18 application, the approved v20-derived
Light and Dark color themes, and its first Lit-to-Svelte component migration: a
tiered, server-rendered `Icon` that replaces the Cyan 4 `cn-icon` in the app
bar, footer, and front-page featured tags. Icons inside buttons and fabs now
standardize their size through the design system rather than per-consumer
overrides, so migrated controls match legacy sizing without hardcoding.
Existing Cyan 4 consumers continue to work through a local compatibility layer,
and both the color contract and the icon capability are published in the
design-system book.

The betas prove that bounded design-system changes can ship through the v21
workspace while preserving public routes, Firebase schemas, authentication
boundaries, persisted data shapes, and OS-driven theme selection. The direct
Svelte Icon consumer migration is complete; retained Cyan components continue
to own their internal custom-element usage until those components are migrated.

## Workspace

- `apps/pelilauta` owns the imported application and subsequent v21 product
  changes for `pelilauta.social`.
- `apps/design` hosts the design-system book for `design.pelilauta.social`.
- `packages/design-system` owns shared design-system implementation and book
  pages.
- `specs` records approved product and design intent.
- `plans` holds epic-level PBIs.
- `docs/lessons` is a decision inbox holding one file per candidate finding;
  assessed findings may improve the project, remain deferred with a concrete
  trigger, or be discarded, and the directory is emptied as they resolve.
- `docs/adrs` records irreversible architectural decisions.

## Delivery History

| Delivery | State | Evidence |
| --- | --- | --- |
| v18 import baseline | Complete and deployed | `pelilauta-17@bac42a7`, imported at `18.13.3` |
| Color-theme compatibility | Complete and approved | `packages/design-system/styles/color-theme.css` |
| Local Icon (app bar, footer, featured tags) | Complete and approved | `specs/design-system/components/cn-icon/spec.md`, PR #30, `v21.0.0-beta.2` |
| Lit-to-Svelte components | In progress | Each component is a separate intent-specified compatibility slice |

## Release Boundaries

The root workspace version identifies v21 releases. The version in
`apps/pelilauta/package.json` remains the imported application's baseline
version until a separate product decision requires changing it.

`v21.0.0-beta.9` builds on `v21.0.0-beta.8` with the Spatial System principles
book: the 8px baseline, spacing roles, prose rhythm, grid-derived radii, and the
reader-owned root scale. It also makes dark the no-preference color-scheme
default consistently in both applications and corrects the book, spec, lesson,
and delivery harness discovered while establishing those foundations.

This beta does not claim the overall Cyan migration or authenticated write
journeys are complete v18 replacements. Deferred end-to-end selector debt,
retained Cyan components, and the RC.1 toolchain upgrades remain later maturity
gates. Earlier betas completed the remaining direct Icon consumers and delivery
tooling (`beta.8`), the thread, discussion, inbox, and site Icon surfaces
(`beta.7`), server icon surface and lessons harness (`beta.6`), catalog provenance
sort (`beta.5`), delivery governance and iconography book (`beta.4`), contextual
icon sizing (`beta.3`), and the initial local Icon capability (`beta.2`).

## Commands

- `pnpm dev` starts available workspace applications.
- `pnpm build` builds the default Pelilauta deployment.
- `pnpm --filter pelilauta test` runs the application unit tests.
- `pnpm lint` runs the workspace Biome checks.
- `pnpm verify` runs the pull-request verification gate.
- `pnpm --filter design build` verifies the design-system application build.
- `pnpm --filter design test:e2e` runs the design-system browser checks.
