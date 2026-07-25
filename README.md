# pelilauta.social v21

This pnpm workspace contains the Firebase-compatible v21 successor to the live
Pelilauta community and its local design system.

## Project Status

**Current release:** `v21.0.0-beta.5`

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
- `docs/lessons` holds optional, non-durable candidate queues and compact
  lessons-learned logs; accepted knowledge moves to its owning spec, practice,
  test, skill, or runbook.

## Delivery History

| Delivery | State | Evidence |
| --- | --- | --- |
| v18 import baseline | Complete and deployed | `plans/v18-import.md` |
| Color-theme compatibility | Complete and approved | `plans/color-theme-compatibility.md` |
| Local Icon (app bar, footer, featured tags) | Complete and approved | `specs/design-system/components/cn-icon/spec.md`, PR #30, `v21.0.0-beta.2` |
| Lit-to-Svelte components | In progress | Each component is a separate intent-specified compatibility slice |

## Release Boundaries

The root workspace version identifies v21 releases. The version in
`apps/pelilauta/package.json` remains the imported application's baseline
version until a separate product decision requires changing it.

`v21.0.0-beta.6` builds on `v21.0.0-beta.5` with the completed server-rendered
icon surface and the lessons-compounding harness (#41). All direct `.astro`
`<cn-icon>` consumers now use the local `Icon`; dynamic nouns resolve through
the reviewed catalog, and legacy Cyan tag-scoped layout behavior is re-expressed
for the local markup. Lessons files are now optional, non-durable candidate
queues and compact lessons-learned logs; durable project behavior remains in
specs, practices, plans, tests, skills, PRs, and runbooks.

This beta does not claim that every Svelte icon consumer or authenticated write
journey has been accepted as a complete v18 replacement; those remain gates
before a v21 release candidate. Earlier betas delivered the catalog provenance
sort (`beta.5`), delivery governance and iconography book (`beta.4`), contextual
icon sizing (`beta.3`), and the initial local Icon capability (`beta.2`).

## Commands

- `pnpm dev` starts available workspace applications.
- `pnpm build` builds the default Pelilauta deployment.
- `pnpm --filter pelilauta test` runs the application unit tests.
- `pnpm --filter pelilauta check` runs the imported application check command.
- `pnpm --filter design build` verifies the design-system application build.
- `pnpm --filter design test:e2e` runs the design-system browser checks.
