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
- The load-order tie is over: Cyan's CSS left the application on 2026-08-22, so
  `input[type="text"]` has one declaration and the register no longer depends on which
  stylesheet is imported second.
- `<button>` is unaffected: it stays in the human register, which is where the deferred
  phase would have left it anyway.
