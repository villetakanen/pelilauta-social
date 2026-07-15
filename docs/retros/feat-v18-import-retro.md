# feat/v18-import Retrospective

## Loop Summary

The loop delivered its intended artifact: the current v18 application now has a verified v21 baseline under `apps/pelilauta`, runs from the pnpm workspace root, reads the remote Firebase development project, and deploys through Netlify at `https://pelilauta-social-dev.netlify.app`.

The import itself is exact. Source commit `bac42a7ae56526b8f9cb1c1cc10d3e30ea468239` and subtree commit `14fe061:apps/pelilauta` resolve to Git tree `e77039b78745f557b6f5e3a5f88e32491555c8d2`. Workspace and deployment adaptations were applied afterward as separate commits.

The loop was successful, but more expensive and less deterministic than it should have been. Most failures came from differences between a standalone repository and the same application nested in a workspace. The important compound-engineering outcome is therefore not only the running application; it is a concrete list of checks that should make the next delivery loop shorter and safer.

## Outcome Evidence

| Contract | Evidence | Result |
| --- | --- | --- |
| Preserve the imported v18 baseline | Source and imported Git trees match | Pass |
| Preserve dependency resolutions | Root lockfile derives from the imported lockfile with the importer relocated | Pass |
| Run from workspace root | `pnpm dev` dispatches `apps/pelilauta` | Pass |
| Deterministic application checks | 456 unit tests pass; production build passes | Pass |
| Connect to Firebase development data | Home page and account, channel, site, and thread endpoints return data | Pass |
| Preserve SSR deployment | Astro Netlify SSR function is generated and deployed | Pass |
| Deploy from `main` | Git-driven deploy completed after PR #3 | Pass |
| Human interaction compatibility | Authenticated writes and full browser behavior | Not yet accepted |

The loop proves a deployable read-compatible baseline. It does not yet prove complete drop-in compatibility for authentication, writes, or all user journeys.

## Plan, Work, Review, Compound

### Plan

The root constitution was established before implementation, and `plans/v18-import.md` recorded the source SHA, destination, environment source, gates, recovery instructions, results, and lessons. This materially improved recovery across a long-running session.

The plan was weaker around repository topology. It did not inventory gitlinks, nested agent instructions, tracked credential-like strings, package-manager root discovery, or Netlify package/base behavior before import. Those omissions caused most follow-up work.

### Work

Execution was kept mostly reversible:

- Root operating contract was committed independently.
- Recovery plan preceded the import.
- The exact subtree import had its own commit.
- Workspace setup, Netlify setup, submodule repair, debug-artifact removal, and Netlify base repair were separate changes.
- Lockfile drift was detected and corrected before acceptance.

The subtree import brought legacy ancestry into this repository through a second parent. This preserved provenance, but made the first PR appear to contain hundreds of historical commits. The tradeoff should have been decided explicitly before importing.

### Review

Review used deterministic checks where they existed: tree hashes, frozen installation, unit tests, Astro checks, production builds, clean recursive cloning, TOML parsing, HTTP status checks, and live Netlify deployment.

Review remained too manual. No repository CI workflow enforced these checks on the import PR. Deployment assumptions escaped review and required later fixes. The successful production smoke checks were stronger than the PR gates because the PRs had no durable required checks.

### Compound

The durable lessons should not all be added to `AGENTS.md`. ASDLC's compound loop calls for scoped storage and human-gated writeback. The root constitution already contains the stable compatibility and workspace contracts. Operational discoveries belong in a deployment runbook, bootstrap guide, deterministic scripts, and CI configuration.

This retrospective records candidate learnings. Each proposed writeback below should be accepted through its own bounded change rather than bundled into this document.

## What Worked

### Constitution First

The root `AGENTS.md` gave every session a stable definition of success: exact v18 behavior, reversible release candidates, Firebase compatibility, bounded migration surfaces, and explicit human gates. It prevented the baseline import from becoming another combined refactor.

### Provenance Over Assumption

The source branch name was not treated as sufficient evidence. Recording the source commit, imported version, gitlink commit, and tree identity made the baseline reproducible and falsifiable.

### Recovery Plan as Working Memory

`plans/v18-import.md` preserved task state and failures across session transitions. Recording corrected commands, failed assumptions, and exact outputs reduced rediscovery. This is the clearest successful compound-engineering practice in the loop.

### Micro-Commits

The imported artifact and workspace adaptations remained distinguishable. When Netlify and submodule assumptions failed, fixes could be reviewed and merged without touching application behavior.

### Failure as Feedback

Several incorrect assumptions were not hidden:

- Workspace lockfile regeneration changed versions and was replaced with importer-only relocation.
- The nested submodule mapping failed on Netlify and was moved to root.
- Netlify's persisted package base doubled the publish path and was overridden in code.
- A tracked historical debug script was identified and removed instead of globally disabling scanning.

Each failure produced a more precise contract.

### Real Deployment Verification

The loop did not stop at a local build. It verified the deployed SSR page and Firebase-backed endpoints, then verified a Git-triggered deploy after the manual bootstrap deploy.

## Errors and Root Causes

| Failure or near miss | Root cause | Corrective action | Harness lesson |
| --- | --- | --- | --- |
| Netlify could not check out the repository | Relocated gitlink had only a nested `.gitmodules` mapping | Added root `.gitmodules` and tested a fresh recursive clone | Inventory and verify gitlinks before import acceptance |
| Workspace install initially resolved newer dependencies | Semver ranges were used instead of the verified legacy lock | Derived root lock from imported lock and changed only importer paths | Preserve lock identity before running workspace installation |
| Lefthook generated an example root config | Nested `postinstall` discovered the workspace Git root | Removed generated config | Decide root tooling ownership before running package lifecycle scripts |
| First host-specific smoke probe timed out | Incorrect pnpm argument forwarding | Used `pnpm run dev --host 127.0.0.1` | Put smoke behavior in a script instead of shell memory |
| Development server process survived a probe | Cleanup killed the parent process but not the listener | Explicitly checked and stopped the listening process | Harness-owned server probes need reliable process cleanup |
| Netlify publish path was prefixed twice | UI package base and root-relative publish path were both applied | Set root `base = "."` | Deployment UI assumptions must be represented in versioned config |
| Astro Frameworks API output was app-local | Adapter writes `.netlify/v1` relative to Astro root | Added root staging script | Adapter output location is part of the deployment contract |
| Public Firebase key triggered secret scanning | Client-visible value matched a secret pattern | Added narrow key omission | Exempt only explicit public variables; keep scanning enabled |
| Additional key-like strings existed in tracked source | Exact import included an unused historical debug script | Removed the unused file | Scan tracked source before deployment, not after a platform failure |
| Environment import printed values to agent-visible output | Netlify CLI's import command renders imported values | No repository leak occurred, but output handling failed | Credential import must be human-operated or use a non-echoing procedure |
| Installing all vendor agent skills created excessive context | External guidance was installed without selecting a minimal subset | Installation was removed | Inspect and install only task-specific skills; more context is not automatically better |
| Homebrew CLI installation pulled a large dependency graph | Tool installation method was selected for convenience, not footprint | CLI now works globally | Prefer existing or ephemeral tooling unless durable local use justifies installation |
| Import PR displayed extensive historical commits | Subtree import retained source ancestry | Kept history as imported | Decide history topology before import; use first-parent review now |

## Harness Assessment

### Existing Strengths

- Minimal root constitution with explicit judgment boundaries.
- Pinned package manager and preserved baseline dependency graph.
- Root development and build entrypoints.
- Exact source and gitlink provenance.
- Ignored local environment and generated output.
- Live Firebase development target and Netlify development site.
- Imported Vitest and Playwright coverage.

### Current Gaps

- No root `test`, non-mutating `check`, or `smoke` commands.
- No repository CI workflow or required deterministic checks.
- No automated baseline-tree or approved-deviation verification.
- No automated submodule initialization/integrity gate.
- No repeatable hosted smoke test that reports only status, not response data.
- No accepted authenticated-write compatibility gate.
- No resolved root Lefthook ownership.
- Root and application Netlify policies are duplicated and can drift.
- Nested `apps/pelilauta/AGENTS.md` contains legacy guidance that may compete with the v21 constitution.
- Root README does not explain recursive cloning, environment setup, commands, or deployment.
- `plans/v18-import.md` mixes historical branch state with current operational truth.
- Imported package scripts still contain `npm` and `npx` calls despite the pnpm workspace contract.
- The application `check` command mutates files, so it is unsuitable as a CI gate.
- Cache warming is a non-failing network side effect during build rather than an observable post-deploy operation.

## Candidate Writebacks

These are proposed compound outputs, not automatically approved changes.

| Candidate learning | Durable destination | Gate before writeback |
| --- | --- | --- |
| Clone, gitlink, lockfile, and credential-pattern preflight | `docs/runbooks/legacy-import.md` plus scripts | Reuse on the next import or baseline refresh |
| Netlify base, package directory, Frameworks API staging, and smoke procedure | `docs/runbooks/netlify.md` | Confirm against both Pelilauta and future design-site deploys |
| Root install, development, test, and environment bootstrap | Root `README.md` | Commands pass from a clean clone |
| Exact baseline and intentional deviations | `specs/compatibility/v18-baseline.md` | Human confirms the three current application deviations |
| Stable compatibility and workspace constraints | Root `AGENTS.md` | Already present; no expansion needed now |
| Legacy component-specific behavior | Per-surface compatibility specs | Reverse from v18 before each migration |
| Tool-specific procedural knowledge | Small scripts or scoped runbooks | Prefer deterministic enforcement over prose |

## Atomic Next Steps

The next work should improve one gate at a time. Each item should be one independently reviewable commit or PBI unless implementation proves it must be split further.

1. Close the historical plan metadata.

Update `plans/v18-import.md` so branch references are explicitly historical and separate recorded checks from current repeatable checks.

2. Document clean bootstrap.

Expand the root README with recursive clone, submodule initialization, pinned pnpm installation, ignored environment location, root commands, and the two-site Netlify model. Do not include values.

3. Add a submodule verification command.

Create a read-only script that verifies the expected gitlink exists, is initialized, and is checked out at the pinned commit. Expose it as a root package script.

4. Add root test dispatch.

Add `pnpm test` at root using pnpm workspace filtering without changing the imported test implementation.

5. Separate check from formatting.

Introduce a non-mutating Biome/type/Astro check command. Keep write-mode formatting as a separate explicit command.

6. Add minimal CI.

Run recursive-submodule verification, frozen install, unit tests, non-mutating checks, and root build. Require this workflow before merge.

7. Add a deployment runbook.

Document Netlify project base, publish path, Frameworks API staging, environment ownership, public-key scanning exemption, manual bootstrap deploy, Git deployment, and rollback expectations. Explicitly prohibit agent-visible bulk environment import.

8. Add Netlify parity checks.

Verify root and app Netlify policy sections do not drift and that generated SSR output is staged where the selected deployment model expects it.

9. Add a read-only smoke command.

Probe the home page and account, channel, site, and thread endpoint classes. Report status and timing only; do not emit response bodies or environment values.

10. Resolve root Lefthook ownership.

Move hook execution to a root-owned configuration after root check commands exist. Remove package lifecycle ambiguity in a separate tooling-only change.

11. Narrow scoped agent guidance.

Replace or reduce `apps/pelilauta/AGENTS.md` so it documents only application-specific compatibility facts and cannot override v21 migration direction.

12. Write the v18 baseline compatibility spec.

Record routes, Firebase contracts, authentication boundaries, public read behavior, and the intentional post-import deviations. This becomes the state document future migration PBIs reference.

13. Verify authenticated compatibility.

Select the smallest Playwright scenarios for login, one authorized write, and one authorization rejection against the development project. Keep destructive fixture setup isolated and approved.

14. Scaffold the design-system projects.

Only after the baseline gates are repeatable, add `apps/design` and `packages/design-system` as a separate bounded delivery. Do not migrate a Pelilauta surface in the same change.

15. Choose the first Lit.js migration surface.

Reverse its v18 behavior into a compatibility spec, define one PBI, replace only that surface with a local Svelte component, and verify the same deterministic and human gates before the first `v21.0.0-rc.X` release.

## Review Gates for the Next Loop

### Deterministic

- Clean recursive checkout succeeds.
- Frozen workspace install succeeds.
- Submodule and baseline integrity checks pass.
- Unit tests and non-mutating checks pass.
- Root production build generates static and SSR outputs.
- Hosted read-only smoke checks pass without logging data.

### Probabilistic

- Review implementation against the linked compatibility spec and root constitution.
- Review whether the change remains one bounded surface and one reversible purpose.
- Review generated UI against the local design-system specification.

### Human

- Approve compatibility assumptions and any exception from v18 behavior.
- Accept authenticated and write-path behavior.
- Approve dependencies, Firebase contract changes, deployment changes, and releases.
- Gate candidate retrospective learnings before persistent writeback.

## Residual Risks

- Authenticated writes have not yet been accepted as v18-compatible in v21.
- Legacy hardcoded client configuration remains in immutable imported history even though it was removed from the current tree.
- The imported ancestry makes non-first-parent history views noisy.
- Netlify configuration is duplicated across root and app scopes.
- Secret values were not committed, but a CLI environment-import operation displayed values in operational output; disposable development credentials should be treated accordingly.
- Current local success does not replace CI enforcement on future branches.

## Close Decision

The delivery loop can be closed as a successful baseline establishment: v18 is imported, runnable, testable, Firebase-connected, and deployed in the v21 workspace structure.

The next loop should not start with design-system migration code. It should first convert the highest-value manual discoveries into deterministic bootstrap, test, CI, deployment, and smoke gates. That is the compound payoff: the next bounded migration begins with less uncertainty than this import did.
