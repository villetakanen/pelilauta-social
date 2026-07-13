# v18 Import Plan

## Goal

Establish v21 from an exact, runnable import of the current `pelilauta-17/main` in `apps/pelilauta`, connected locally to the existing remote Firebase development project. Do not refactor or upgrade the imported application in this change.

## Baseline

- Source: `https://github.com/villetakanen/pelilauta-17`
- Branch: `main`
- Source commit: `bac42a7ae56526b8f9cb1c1cc10d3e30ea468239`
- Imported version: `18.13.3`
- Destination: `apps/pelilauta`
- Working branch: `feat/v18-import`
- Environment source: `../pelilauta-20/.env.development`
- Environment files and credentials must remain untracked.

## Tasks

| Status | Task | Gate |
| --- | --- | --- |
| Complete | Add the stable workspace and deployment contract to root `AGENTS.md`; commit and push it to `main`. | Commit `e2af6cd` is present on `origin/main`. |
| Complete | Create `feat/v18-import` from the updated `main`. | Current branch is `feat/v18-import`. |
| Complete | Add and maintain this recovery plan. | Statuses, results, and lessons reflect the current session. |
| Complete | Import the source commit into `apps/pelilauta` without changing its files. | Source and imported trees both resolve to `e77039b78745f557b6f5e3a5f88e32491555c8d2`. |
| Complete | Initialize the imported `public/myrrys-proprietary` submodule content for local use. | Local checkout is pinned to gitlink commit `b34789ab5beaf5d91c29870d51e6ff692a8b0675`. |
| Complete | Install dependencies using the imported pnpm lockfile. | `pnpm install --frozen-lockfile` succeeded with pnpm 10.21.0. |
| Complete | Copy the existing development environment into the ignored environment file expected by the imported app. | `apps/pelilauta/.env` is ignored by `apps/pelilauta/.gitignore`; no values were logged. |
| Complete | Run deterministic baseline checks. | All 456 unit tests and the production build pass. |
| Complete | Start the development server and smoke-test it against remote Firebase. | `/` and remote-backed account, channel, site, and thread endpoints returned `200`; rendered HTML contains remote data. |
| Complete | Review the final diff and commit each completed, independently reversible step. | No secrets, generated output, or unrelated changes are tracked. |

## Recovery

1. Read this file and root `AGENTS.md`.
2. Confirm `git status --short --branch` before changing anything.
3. Confirm the source baseline with `git ls-remote https://github.com/villetakanen/pelilauta-17.git refs/heads/main`.
4. Resume the first task still marked `In progress` or `Pending`.
5. Never print or commit environment values. Verify ignored files with `git check-ignore`.
6. Update this file after every gate, including failures and decisions.

## Results

- Constitution commit `e2af6cd` was pushed to `origin/main` before branching.
- The environment source requested as `../pelilauta-20/.env` exists locally as `../pelilauta-20/.env.development`.
- Subtree commit `14fe061` imports source commit `bac42a7ae56526b8f9cb1c1cc10d3e30ea468239` into `apps/pelilauta`.
- The source and imported Git trees both resolve to `e77039b78745f557b6f5e3a5f88e32491555c8d2`, proving the baseline import is exact.
- Proprietary assets are available locally at the source-pinned gitlink commit `b34789ab5beaf5d91c29870d51e6ff692a8b0675`.
- Development environment data was copied to ignored `apps/pelilauta/.env`; no secret values were printed or tracked.
- `pnpm install --frozen-lockfile` succeeded with the imported lockfile using the pinned pnpm 10.21.0.
- `pnpm run test` passed all 456 tests across 35 files.
- `pnpm run build` completed successfully. Existing diagnostics include one Zod deprecation hint, mixed static/dynamic import warnings, and chunk-size warnings.
- `pnpm run dev --host 127.0.0.1` started Astro 5.15.4 successfully. `/` returned `200` with 176,637 bytes of rendered HTML.
- Remote-backed `/api/accounts/active.json`, `/api/meta/channels.json`, `/api/sites`, and `/api/threads.json` requests returned `200`, and the rendered page included site and thread data.
- Automated checks establish process startup, SSR, and read access. Interactive browser behavior and authenticated writes remain human acceptance gates.

## Lessons

- Vite aliases resolve imported modules but do not make external files into Astro routes. `apps/design/src/pages` will retain thin route entrypoints that import page implementations from `packages/design-system/pages`.
- The legacy repository contains the `public/myrrys-proprietary` Git submodule. Moving the parent tree under `apps/pelilauta` requires its path and initialization behavior to be handled deliberately after the exact import.
- The imported `.gitmodules` is nested under `apps/pelilauta`, so root Git does not discover its mapping automatically. Local setup must populate the gitlink at its pinned commit until workspace-level submodule configuration is specified separately.
- Running the imported `postinstall` from a nested app made Lefthook search the repository root and generate an example root config. The generated file was removed; workspace-level hook configuration requires a separate decision.
- `pnpm run dev -- --host 127.0.0.1` forwards a literal separator to Astro and leaves it bound to `localhost`; use `pnpm run dev --host 127.0.0.1` for an address-specific smoke probe.
- The exact import includes a nested legacy `apps/pelilauta/AGENTS.md`. It documents the baseline application but may need replacement with scoped v21 guidance in a separate, explicit change so it does not compete with the root constitution.
