# Tokens Are Asserted, Not Generated

Status: Recorded 2026-08-14, while levelling the test suite

## What is wrong

The palette, the token tables and the typography scale exist twice: once as
declarations in `packages/design-system/styles`, once as tables in the books and
specs. Nothing derives one from the other, so vitest files parse the stylesheets
and assert that the two copies agree — `color-palette.test.ts`,
`token-table.test.ts`, `typography.test.ts`, `units.test.ts`.

A consistency check is the cheapest response to two copies, and it is the wrong
one: it grows a case per token, it runs in a test runner rather than a linter,
and it leaves both copies writable.

## What done looks like

One artifact holds each token's value, and the stylesheet and the book are both
produced from it. The checks that hold the copies in agreement are deleted rather
than reduced, because there is one copy.
