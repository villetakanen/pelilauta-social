# feat/githits-cli Lessons

Status: **Active — tooling slice prepared for integration.**

## GitHits CLI Tooling Slice

- **Outcome.** Repository agents can invoke the shared GitHits code-research skill through the workspace-installed CLI instead of downloading an unpinned `latest` release at invocation time.
- **Scope decision.** This is a consumer-free factory/tooling slice, explicitly approved by the human on 2026-07-25. It does not change either application's runtime output; merging it still triggers the normal Netlify beta-preview build.
- **Isolation.** Prepared on `feat/githits-cli` from `origin/main` because `feat/cn-icon` has the unrelated open PR #41. The icon worktree and PR remain untouched.
- **Included factory evolution.** Root `githits` dev dependency and lockfile; canonical repository-owned `.agents` skill plus its `.claude` compatibility symlink. Skill commands consistently use `pnpm exec githits` from the workspace root.
- **Compatibility.** No v18 behavior, public route, Firebase contract, persisted data, or deployment configuration changes.
- **Verification.** `pnpm install --frozen-lockfile --ignore-scripts` passes; `pnpm exec githits --version` reports `0.6.4`; `pnpm dlx skills list --json` discovers the repository-owned skill through both supported agent locations; root `pnpm test` passes (design-system 10/10, Pelilauta 463/463). The first pre-push attempt correctly failed because the isolated worktree had not initialized the pinned proprietary submodule; after `git submodule update --init --recursive`, the exact suite passed. A full fresh install under unsupported local Node `24.14.0` failed while building the pre-existing `sharp@0.34.5`; GitHits has no dependency path to Sharp. The Node 22 Netlify preview is the supported-runtime clean install/build gate.
- **Delivery review.** Independent review found three blockers. Resolved: removed `skills-lock.json`, whose upstream restore would overwrite the local `pnpm exec` customization; added the upstream Apache-2.0 license and prominent modification notices; designated the Node 22 Netlify preview as the clean install/build gate. The review also found that adding GitHits deduplicates Astro/Vite's YAML peer from `2.8.1` to `2.9.0`, so the preview must establish application build compatibility.
- **Supply-chain decision.** GitHits introduces moderate advisory `GHSA-frvp-7c67-39w9` through `@modelcontextprotocol/sdk > @hono/node-server@1.19.15`. The affected Windows static-file middleware is not used by the code-research CLI path or deployed applications. Human accepted this tooling-only risk on 2026-07-25; merge remains gated on the Netlify preview.
- **Node compatibility.** GitHits declares Node `^20.18.1 || >=22.13.0`; Netlify uses Node 22. Older Node 20 patch releases are unsupported.
- **Integration identity.** PR #42 (`feat/githits-cli` → `main`); source head before this integration-record commit: `3409621`. Merge is gated on the PR's Netlify Node 22 preview.
- **Carry-forward.** None expected; restart OpenCode after integration so the modified skill is reloaded.
