# feat/release-beta-8 Lessons Learned

| Lesson | Disposition | Result |
| --- | --- | --- |
| Broad repository verification belongs to one executable PR gate; agents use targeted local checks instead of manually reconstructing or repeating that gate. | Applied | Root `pnpm verify`; `.github/workflows/verify.yml`; delivery and release skills |
