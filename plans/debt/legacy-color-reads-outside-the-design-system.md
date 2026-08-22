# Three Components Still Read Cyan's Colour Vocabulary

Status: Recorded 2026-08-22, found by removing Cyan's CSS in the deprecate-cyan epic

## What is wrong

`compat/cyan-4.css` declared the legacy `--color-*` names, and left with Cyan. Three
components still read them, so each read now resolves to nothing and the declaration it
sits in is invalid at computed-value time:

- `SiteListItem.astro`
- `NounSelect.svelte`
- `SentryTestButton.svelte`

The design system's stylesheets are clean — `token-contract.test.ts` asserts it —
but that test covers `packages/design-system/styles` only, so a scoped block in an
`apps/pelilauta` component is unguarded.

`apps/pelilauta/src/overrides.css` reads four more — `--color-border`, `--color-text`,
`--color-surface-1` and `--color-background` — and is not counted here. That file leaves
whole on its own step of the deprecate-cyan epic, so its reads need no replacement role.

## Why it stays open

Each read needs the semantic `--cn-color-*` role that carries its intent, and picking
that role means looking at what the component is painting rather than at the alias table.
`SentryTestButton` is a developer tool and may need no colour role at all.

## What done looks like

No file outside the design system reads a `--color-*` or `--background-*` name, and a
check holds the application to that the way `token-contract.test.ts` holds the package.
