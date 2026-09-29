# pelilauta.social v21

Pelilauta is a Finnish online community for tabletop role-playing games, with
discussion channels and a shared library. This workspace carries version 21 of
the application and the design system.

Version 21 runs on a dedicated host, sharing Firestore, Storage, and Auth with
version 18 while version 18 remains live at pelilauta.social.

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

## Provenance

The application was imported from `pelilauta-17@bac42a7` at version `18.13.3`.

## Releases

The root workspace version identifies a release.

## Commands

- `pnpm dev` starts available workspace applications.
- `pnpm build` builds the default Pelilauta deployment.
- `pnpm --filter pelilauta test` runs the application unit tests.
- `pnpm lint` runs the workspace Biome checks.
- `pnpm verify` runs the pull-request verification gate.
- `pnpm --filter design build` builds the design-system application.
- `pnpm --filter design test:e2e` runs the design-system browser checks.

## Persona QA

Three personas visit the development site through a headless Antigravity CLI
agent and record first-person reports in `docs/reports/`.
`agents/qa/AGENTS.md` carries the commands, prerequisites, and rules.
