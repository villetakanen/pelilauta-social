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
| Netlify's ready state does not prove traced SSR dependencies survived upload; stage hoisted dependencies under the preserved app path and keep endpoint verification authoritative. | Applied | Pelilauta Netlify build scripts and config; release endpoint gate |
| The footer color-theme e2e still targets the removed custom-element tag. | Deferred | `plans/cn-icon-consumer-migration.md` terminal batch |
