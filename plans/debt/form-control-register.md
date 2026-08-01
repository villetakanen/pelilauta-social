# Form Controls Took the Technical Register Early

Status: Recorded 2026-08-01, accepted

`plans/typography.md` rules form controls a later phase. The fonts story styled them
anyway: `packages/design-system/styles/fonts.css` puts `input`, `select` and `textarea`
in the technical register, and `packages/design-system/test/fonts.test.ts` asserts it.
The owner accepted the debt rather than reverting the story.

## What this leaves

- The epic's out-of-scope table and the shipped stylesheet disagree. A reader of either
  one alone is misled.
- The test pins the rules in place, so removing them fails the suite. The decision has
  to be reversed in both files or neither.
- In `apps/pelilauta` the rule wins on load order alone: `cyan-css`'s
  `input[type="text"]` ties it on specificity. Changing import order silently returns
  text inputs to Lato, and no test covers the application — every font test runs
  against the design site, which loads no Cyan.
- `<button>` is unaffected: it stays in the human register, which is where the deferred
  phase would have left it anyway.
