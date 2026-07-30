# feat/icon-context-sizing Lessons Learned

| Lesson | Disposition | Result |
| --- | --- | --- |
| Contexts standardize icon size through public size tokens, not a private variable or `!important`. | Applied | Icon spec; `packages/design-system/styles/icon.css` |
| A token contract test should distinguish root definitions from contextual overrides instead of weakening its assertion. | Applied | `packages/design-system/test/icon-registry.test.ts` |
| Removing a per-consumer workaround is a concrete probe that the context rule owns the behavior. | Applied | App-bar consumer and rendered visual acceptance |
