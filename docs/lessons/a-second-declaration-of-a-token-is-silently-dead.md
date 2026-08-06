---
name: a-second-declaration-of-a-token-is-silently-dead
branch: feat/buttons-and-links
date: 2026-08-06
---

**Context:** the design system declares colour roles on `:root` in
`packages/design-system/styles/color-theme.css`, and `styles/compat/cyan-4.css`
maps legacy Cyan names onto those roles on `:root` as well.
`styles/color.css` imports color-theme first and compat second, so any role name
that appears in both files resolves to the compat value — same specificity, later
declaration wins.

**What happened:** the CnLoader delta added
`--cn-loader-color: light-dark(var(--cn-color-primary-60), var(--cn-color-surface-60))`
to `color-theme.css:192`, unaware that `compat/cyan-4.css:199` already declared
`--cn-loader-color: var(--cn-link)` for the legacy `<cn-loader>` Lit element. The
new declaration never resolves. Every check passed: the unit test renders markup
only, the five new Playwright tests assert role, class, geometry and animation but
no colour, and the approved spec's guardrail — "visual colors depend strictly on
`--cn-loader-color`" — is true of a token whose value comes from somewhere else.
The book's token table publishes the value that lost.

**Suspected why:** nothing enumerates who declares a `--cn-*` role. A component
author greps for the component's own name, finds no owner, and writes the
declaration into the file where colour roles belong — which is the file the compat
layer overrides. The compat layer is a migration bridge, so its declarations read
as legacy and not as current owners.

**Fix candidate:** extend `packages/design-system/test/token-contract.test.ts` to
fail when one `--cn-*` name is declared in more than one stylesheet under
`styles/`, listing the winner by import order. That makes shared ownership a
deliberate, explained exception instead of an invisible default, and it fires at
the moment the second declaration is written rather than after a book has
documented the wrong value.
