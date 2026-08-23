# Tests do static CSS analysis, which this phase does not do

`packages/design-system/test/lengths.test.ts:23` reads every stylesheet and permits a
pixel length only inside `outline*` and `border*`. `poster.test.ts:72` reads
`poster.css` and rejects a raw percentage inside a `color-mix`. Neither renders
anything, and neither can fail because the system behaves wrongly — each fails
because a declaration is written in a form a convention disallows.

That is static analysis of the source, and v21 does not do static analysis of CSS.
There is no stylelint, no config for one and nothing in any `package.json` that lints
a stylesheet, and that is the intended state: the design system is still being
written, and a rule about the form of a declaration is not yet worth enforcing on
every commit. These test files reach for the phase after this one.

Thirteen of the twenty-five files in `packages/design-system/test` exist only to
read a stylesheet off disk and assert on its text, around ninety-six cases in total;
five more read one incidentally while testing a component's markup. The thirteen are
not one thing: some compute what a reader cannot check by eye, some are generation parity
already carried by `plans/debt/tokens-are-asserted-not-generated.md` and
`plans/debt/token-parity-covers-units-only.md`, and the rest are conventions about
how the CSS is written.

The cost while they stand is that `pnpm test` reports a naming violation and a broken
surface identically, and that the layer grows by copying itself: an agent adding a
convention adds a test file, because that is what the last convention did.

## Remaining change

Remove the cases that assert the form of a declaration rather than a behaviour.
Nothing replaces them — the check is not moving to another tool, it is not being made
in this phase.

Classifying the thirteen files comes first, and it is a list to decide from rather
than a sweep to run. Several of the cases are worth keeping.
