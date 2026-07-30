# feat/color-theme-compatibility Lessons Learned

| Lesson | Disposition | Result |
| --- | --- | --- |
| A compatibility alias can break fallback behavior when it defines a property that was intentionally absent. | Applied | `apps/pelilauta/src/styles/compat/cyan-4.css`; color contract tests |
| Static CSS remains the canonical token implementation until an approved non-web consumer requires another source. | Applied | Design-token spec and styles |
| The design-system book should consume committed implementation rather than introduce a second token model. | Applied | Design-system color book |
| Root release identity must not overwrite the imported application's compatibility version. | Applied | Root `package.json`; `docs/runbooks/releases.md` |
| Deterministic browser checks complement but do not replace human visual acceptance for theme migrations. | Applied | Color-theme plan and Playwright checks |
| A finding does not authorize its own writeback; process and scope changes require human disposition. | Applied | `docs/practices/lessons.md`; lessons skill |
| Generic CI expansion without a demonstrated failure was premature. | Rejected | None |
