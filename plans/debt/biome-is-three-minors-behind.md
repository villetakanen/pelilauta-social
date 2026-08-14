# Biome Is Three Minors Behind

Status: Recorded 2026-08-14, while moving stylesheet sweeps from vitest to lint

## What is wrong

`biome.json` pins its schema to 2.2.3 and `package.json` installs the matching
`@biomejs/biome`. The published version is 2.5.8 — same major, three minors and
their patches ahead.

`.agents/skills/design-system-tests/SKILL.md` puts every rule that binds each
stylesheet at the Lint level, written as Biome GritQL plugins with `language css;`.
2.2.3 carries that capability, so the sweeps can land without the upgrade. What the
intervening releases changed about CSS plugins is unread.

## What done looks like

Biome runs at a version chosen deliberately rather than by inertia, with the
schema in `biome.json` and the dependency in `package.json` agreeing. The CSS
plugin behaviour the sweeps rely on is confirmed on that version.
