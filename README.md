# pelilauta.social v21

This pnpm workspace contains the Firebase-compatible v21 successor to the live
Pelilauta community and its local design system.

## Project Status

**Current release:** `v21.0.0-beta.2`

v21 has a verified import of the live v18 application, the approved v20-derived
Light and Dark color themes, and now its first Lit-to-Svelte component
migration: a tiered, server-rendered `Icon` that replaces the Cyan 4 `cn-icon`
in the app bar, footer, and front-page featured tags. Existing Cyan 4 consumers
continue to work through a local compatibility layer, and both the color
contract and the icon capability are published in the design-system book.

The betas prove that bounded design-system changes can ship through the v21
workspace without changing routes, Firebase contracts, authentication,
persisted data, interactions, or OS-driven theme selection. Component migration
has now started and proceeds one bounded consumer surface at a time.

## Workspace

- `apps/pelilauta` owns the imported application and subsequent v21 product
  changes for `pelilauta.social`.
- `apps/design` hosts the design-system book for `design.pelilauta.social`.
- `packages/design-system` owns shared design-system implementation and book
  pages.
- `specs` records approved product and design intent.
- `plans` records bounded delivery scope, implementation decisions, and
  acceptance evidence.
- `docs/lessons` records active and completed delivery learning and compound
  decisions.

## Delivery History

| Delivery | State | Evidence |
| --- | --- | --- |
| v18 import baseline | Complete and deployed | `plans/v18-import.md`, `docs/lessons/feat-v18-import.md` |
| Color-theme compatibility | Complete and approved | `plans/color-theme-compatibility.md`, `docs/lessons/feat-color-theme-compatibility.md` |
| Local Icon (app bar, footer, featured tags) | Complete and approved | `specs/design-system/components/cn-icon/spec.md`, `plans/cn-icon.md`, `docs/lessons/feat-cn-icon.md` |
| Lit-to-Svelte components | In progress | Each component is a separate intent-specified compatibility slice |

## Release Boundaries

The root workspace version identifies v21 releases. The version in
`apps/pelilauta/package.json` remains the imported application's baseline
version until a separate product decision requires changing it.

`v21.0.0-beta.2` includes the deployable v18 baseline, the color-theme delivery,
and the local Icon migration of the app bar, footer, and featured tags. It does
not claim that every authenticated write journey has been accepted as a complete
v18 replacement; that remains a gate before a v21 release candidate.

## Commands

- `pnpm dev` starts available workspace applications.
- `pnpm build` builds the default Pelilauta deployment.
- `pnpm --filter pelilauta test` runs the application unit tests.
- `pnpm --filter pelilauta check` runs the imported application check command.
- `pnpm --filter design build` verifies the design-system application build.
- `pnpm --filter design test:e2e` runs the design-system browser checks.
