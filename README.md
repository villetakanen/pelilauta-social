# pelilauta.social v21

This workspace carries the Firebase-compatible v21 successor to the live
Pelilauta community and its local design system.

v21 ports the v20 visual design onto the v18 application business logic.
Behavior, data shapes, routes, and Firebase integration remain compatible with
live v18.

## Project Status

The current release is `v21.0.0-rc.1`.

The v21 design migration has reached its planned release-candidate boundary.
Every supported public, signed-in, site-owner, and administrator surface
renders on the published design system. No application or design-system source
renders `@11thdeg/cyan-lit` custom elements, and no package depends on the Cyan
library.

The migration rebuilt the application and design system on published styles
across sequential surfaces: color themes, the tiered Icon, typography, cards,
buttons, links, the backdrop, content grids, the application bar and rail,
forms, feedback, thread presentation, reply authoring, the editor, site clocks,
dice, the sortable list, and the shared actions container. Public routes,
Firebase schemas, authentication boundaries, persisted data shapes, and
OS-driven theme selection remained compatible with live v18 throughout the
migration.

## Workspace

- `apps/pelilauta` carries the imported application and subsequent v21 product
  changes for `pelilauta.social`.
- `apps/design` carries the design-system book for `design.pelilauta.social`.
- `packages/design-system` carries the shared design-system implementation and
  book pages.
- `specs` governs approved product and design intent.
- `docs/lessons` carries decision-inbox files with one file per candidate
  finding. Assessed findings generate improvements, remain deferred with a
  concrete trigger, or face dismissal, removing files as findings resolve.
- `docs/adrs` carries irreversible architectural decisions.

## Delivery History

| Delivery | State | Evidence |
| --- | --- | --- |
| v18 import baseline | Complete and deployed | `pelilauta-17@bac42a7`, imported at `18.13.3` |
| Color-theme compatibility | Complete and approved | `packages/design-system/styles/color-theme.css` |
| Local Icon (app bar, footer, featured tags) | Complete and approved | `specs/design-system/components/cn-icon/spec.md`, PR #30, `v21.0.0-beta.2` |
| Cyan-to-Svelte design system | Complete | No `@11thdeg/cyan-lit` dependency and no `<cn-*>` custom elements in application or design-system source |
| Application surfaces on published styles | Complete | Rebuilt across the beta arc through PR #127 |

## Release Boundaries

The root workspace version identifies v21 releases. The version in
`apps/pelilauta/package.json` remains the baseline version of the imported
application until a separate product decision requires a change.

`v21.0.0-rc.1` presents all supported surfaces for release acceptance in light
and dark color schemes at narrow and wide viewport widths.

The `apps/pelilauta` application lacks a v21 end-to-end suite, visual drift
lacks an automated detector, and forced-colors support across the actions
family, an editor-view check, and a Biome version upgrade remain open. Issue
trackers record these items as `task` and `debt` issues outside the release
boundary.

## Commands

- `pnpm dev` starts available workspace applications.
- `pnpm build` builds the default Pelilauta deployment.
- `pnpm --filter pelilauta test` runs the application unit tests.
- `pnpm lint` runs the workspace Biome checks.
- `pnpm verify` runs the pull-request verification gate.
- `pnpm --filter design build` verifies the design-system application build.
- `pnpm --filter design test:e2e` runs the design-system browser checks.

## Persona QA

Three personas visit the development site through a headless Antigravity CLI
agent and record first-person reports in `docs/reports/`.
`agents/qa/AGENTS.md` carries the commands, prerequisites, and rules.
