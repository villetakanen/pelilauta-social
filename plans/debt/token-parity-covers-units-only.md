# The Design-System Test Skill Names Neither Recent Test Kind

Status: Recorded 2026-08-11; the parity half retired 2026-08-22 when Cyan's CSS left

## What was here

This entry began as a gap in Cyan parity: `units.test.ts` asserted that our unit and
radius tokens computed Cyan's values, because both stylesheets loaded together and a
drifting token changed what a legacy consumer computed at runtime. Colour, typography
and spacing had taken the same `--cn-*` names with no equivalent check.

Cyan's CSS left the application on 2026-08-22 and the parity assertion left with it.
Nothing loads two declarations of a `--cn-*` name any more, so there is no divergence
left to detect and the gap is closed rather than fixed.

## Remaining change

`.agents/skills/design-system-tests` names neither of the two test kinds the token and
container work relied on. One is a parity check between a generated stylesheet and its
token source. The other is derived geometry: a container query condition cannot read a
custom property, so the condition is recomputed from its own tracks in a unit test
rather than read back as a literal. Both patterns are in the repository and neither is
in the skill, so the next person invents them again.

One line in `docs/ARCHITECTURE.md` travels with it, recording how many container names
the design system ships. `cn-content` was removed in `a3e5393` as drift, leaving
`surface-area`, which is specified, and `tray`, which `styles/fab.css:155` still
declares and which leaves with the v20 tray import.

## Why it is not in the content-grids epic

Deferred by the owner, 2026-08-11: the work does not relate to that epic's goal. It
belongs to whatever epic next touches the token layers.
