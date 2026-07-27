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
