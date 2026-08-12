# The Cyan parity check covers the unit tokens only

`packages/design-system/test/units.test.ts` asserts that our unit and radius tokens
still hold the values the installed `cyan-css` computes. That assertion exists because
both stylesheets load together while the migration runs: an unmigrated page reads
whichever declaration the cascade hands it, so a value that drifts from Cyan's changes
what a legacy consumer computes, silently and at runtime rather than at build time.

The guarantee stops at that one file. Colour, typography and spacing have since moved
into the design system with no equivalent check, and each is declared under the same
`--cn-*` names Cyan declares. Nothing detects a divergence in them.

The failure mode is a rendering defect on a surface nobody touched, whose cause is a
token two stylesheets disagree about and whose symptom depends on import order.

## Remaining change

Generalise `units.test.ts` into a parity check over every token family the design
system has taken from Cyan, listing the families deliberately excluded and why —
a token we intend to differ on is a decision, and it belongs in the list rather than
in a gap.

Then widen `.agents/skills/design-system-tests`, which predates this and names neither
the parity kind nor the derived-geometry kind the content container work relied on:
a container query condition cannot read a custom property, so the condition is
recomputed from its own tracks in a unit test rather than read back as a literal. Both
patterns are in the repository and neither is in the skill, so the next person invents
them again.

## Why it is not in the content-grids epic

Deferred by the owner, 2026-08-11: the work does not relate to that epic's goal. It
belongs to whatever epic next touches the token layers.

A third item travelled with these two and no longer exists. Container names had no
documented convention while the design system shipped three of them; `cn-content` was
removed in `a3e5393` as drift, and `tray` leaves with the v20 tray import. `surface-area`
is the only one left, it is specified, and one line in `docs/ARCHITECTURE.md` recording
that the design system ships exactly one container name is all that remains — cheap
enough to carry with the token work, and pointless on its own.
