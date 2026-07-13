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
| In progress | Add and maintain this recovery plan. | Statuses, results, and lessons reflect the current session. |
| Pending | Import the source commit into `apps/pelilauta` without changing its files. | Imported tree matches the source tree and source SHA is recorded. |
| Pending | Initialize the imported `public/myrrys-proprietary` submodule content for local use. | Required assets are available at the imported path without committing credentials. |
| Pending | Install dependencies using the imported pnpm lockfile. | `pnpm install --frozen-lockfile` succeeds. |
| Pending | Copy the existing development environment into the ignored environment file expected by the imported app. | Destination is ignored and exposes no values in logs or commits. |
| Pending | Run deterministic baseline checks. | Unit tests and production build pass, or failures are recorded exactly as baseline findings. |
| Pending | Start the development server and smoke-test it against remote Firebase. | The home page responds and remote-backed content renders without a server error; human acceptance remains explicit. |
| Pending | Review the final diff and commit each completed, independently reversible step. | No secrets, generated output, or unrelated changes are tracked. |

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

## Lessons

- Vite aliases resolve imported modules but do not make external files into Astro routes. `apps/design/src/pages` will retain thin route entrypoints that import page implementations from `packages/design-system/pages`.
- The legacy repository contains the `public/myrrys-proprietary` Git submodule. Moving the parent tree under `apps/pelilauta` requires its path and initialization behavior to be handled deliberately after the exact import.
