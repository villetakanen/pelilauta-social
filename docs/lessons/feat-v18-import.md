# feat/v18-import Lessons Learned

| Lesson | Disposition | Result |
| --- | --- | --- |
| Verify an imported baseline by immutable source and Git tree identity, not branch name. | Applied | `plans/v18-import.md` |
| Preserve the verified lock graph when moving an application into a workspace; regenerate only with explicit dependency intent. | Applied | Root `pnpm-lock.yaml`; `plans/v18-import.md` |
| Inventory and test gitlinks from a clean recursive checkout before accepting an import. | Applied | Root `.gitmodules`; `plans/v18-import.md` |
| Netlify base, publish path, and adapter output location are versioned deployment contracts. | Applied | Root and app `netlify.toml`; `scripts/stage-default-netlify-output.mjs` |
| Package lifecycle scripts can discover the workspace Git root and create unintended root tooling. | Applied | Root-owned Lefthook configuration and install |
| Environment import must not expose values in agent-visible output. | Deferred | Human-operated environment setup; future deployment runbook if repeated |
| Install only task-specific agent guidance; more context is not automatically better. | Applied | Scoped project skills under `.agents/skills` |
| Decide imported-history topology before import; retained ancestry makes non-first-parent review noisy. | Applied | First-parent review practice; imported history retained |
