# feat/cn-icon Lessons Learned

| Lesson | Disposition | Durable owner |
| --- | --- | --- |
| Replacing a custom-element tag with class-bearing markup silently drops tag-scoped legacy CSS. | Applied | `docs/practices/consumer-migration.md` |
| Every migrated noun needs reviewed artwork or an explicit missing-glyph disposition. | Applied | Iconography and Icon specs; consumer migration practice |
| A dynamic import is not an optional build boundary when Vite still resolves the source eagerly. | Applied | `packages/design-system/vite/optional-proprietary.mjs` |
| Normalize trusted SVG sources during generation instead of parsing and rewriting markup at render time. | Applied | Community and managed registry generators |
| Proprietary icon provenance cannot be inferred from current file location; human classification owns tier admission. | Applied | Iconography spec; community `PROVENANCE.md` |
| A deterministic test protects behavior only when a real command or gate executes it. | Applied | Root test dispatcher, pre-push hook, and build registry checks |
| Rendered-in-context acceptance remains necessary where unit tests cannot observe legacy layout selectors. | Applied | Consumer migration pre-flight |
| Branch lessons must collect reusable candidates, not become generic agent memory or a delivery log. | Applied | `docs/practices/lessons.md`; project skills and `AGENTS.md` |
| Netlify's ready state does not prove traced SSR dependencies survived upload; use a workspace-owned hoisted pnpm layout and keep endpoint verification authoritative. | Applied | Root pnpm config; release endpoint gate |
| The end-to-end suite is a second consumer of the element tag; migrating source silently breaks selectors nothing gates. | Applied | `docs/practices/consumer-migration.md` pre-flight |
| Earlier batches do not retire the tag-rule inventory: a later context can be the first to reach a rule no one has re-expressed yet. | Applied | `docs/practices/consumer-migration.md` pre-flight |
| A compatibility rule owned by an unmigrated capability belongs in a minimal application migration helper, not the migrated component's stable CSS. | Applied | `docs/practices/consumer-migration.md`; `apps/pelilauta/src/styles/migrations/` |
| Re-expressing a legacy context rule requires checking which property it actually sets: `.fab cn-icon` sets `font-size`, not the element's box, so a helper that collapses size tokens for `.fab` invents behavior the legacy CSS never had. | Deferred | `plans/cn-icon-consumer-migration.md` Batch D; future Fab epic |
| The footer color-theme e2e still targets the removed custom-element tag. | Deferred | `plans/cn-icon-consumer-migration.md` terminal batch |
| `thread-labels.spec.ts` targets the removed tag for `label-tag` chips (broken by PR #41). | Deferred | `plans/cn-icon-consumer-migration.md` terminal batch |
| "No artwork in any tier" does not mean "no visual change": legacy `cn-icon` paints nothing on a 404 while the local `Icon` paints a visible missing glyph, so a missing-glyph disposition is a shipped visual change, not a preserved blank. | Applied | `docs/practices/consumer-migration.md` pre-flight step 4 |
| An aggregator page is fine for *choosing* third-party artwork and wrong as its provenance: take the geometry from the pinned upstream commit, and record the upstream LICENSE holder rather than the aggregator's contributor credit. | Applied | `packages/design-system/icons/open-source/PROVENANCE.md` (`check`, `warning`) |
| A consumer's own scoped rule targeting the legacy tag breaks twice over: a class does not match a tag rule, and Svelte scoping does not cross a component boundary, so it needs `:global(.cn-icon)` and stays the consumer's rule rather than moving into the migration helper. | Candidate | `docs/practices/consumer-migration.md` (proposed) |
| A grep gate written against the element literal does not see imperative `document.createElement('cn-icon')`, so "zero usages" can read as complete while a usage survives. | Candidate | `plans/cn-icon-consumer-migration.md` Batch H amendment; consumer migration practice |
| Where a migration helper collapses a token that legacy also forced with a higher-specificity tag rule, verify the legacy outcome instead of assuming the helper reproduces it — Cyan collapsed `--cn-icon-size-large` on `button` *and* forced `button cn-icon` box size, so both paths already yielded small. | Candidate | `docs/practices/consumer-migration.md` (proposed) |
