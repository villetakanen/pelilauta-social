---
name: a-stale-dev-server-reads-as-four-defects
branch: feat/21-0
date: 2026-09-29
---

**Context:** `docs/ACCEPTANCE_TESTING.md:54` says the runner starts no server, and
that the operator starts the application under acceptance before the run. It says
nothing about the state that server may be in. `uat/pelilauta/e2e/global-setup.ts:39`
checks the subject by fetching the page and matching the repository version as a
substring.

**What happened:** four of eleven journeys failed against a dev server that had been
running across dependency changes. Vite answered
`/node_modules/.vite/deps/@codemirror_state.js` with `504 Outdated Optimize Dep`, so
`PageEditorForm.svelte` never hydrated and `.cn-editor` never entered the DOM.
`apps/pelilauta/node_modules/.vite/deps/_metadata.json` carried 25 optimized entries
and no CodeMirror among them. The version check passed throughout, because the front
page renders without the editor island. Stopping the server, deleting
`apps/pelilauta/node_modules/.vite` and starting a fresh one turned eleven of eleven
green with no source change. Diagnosis cost two suite runs, a subagent, and a reading
of `apps/pelilauta/astro.config.mjs:46` that concluded, wrongly, that
`optimizeDeps.include` was missing entries.

**Suspected why:** the subject check reads one page, and a stale optimizer breaks
islands rather than pages, so the one signal the harness takes is blind to the one
failure it needs to catch.

**Fix:** state in `docs/ACCEPTANCE_TESTING.md` that a server which has run across a
dependency change is restarted with `node_modules/.vite` cleared before an acceptance
run.
