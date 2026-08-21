# The editor views have no automated check

Status: Recorded 2026-08-21, while reviewing the shell adoption

The five editor views wire `CnEditorShell` and `CnEditor` to the application:
frontmatter controls in the region, `markClean` after a successful save, the
submit button gated on the shell's dirty report. Review verified that wiring
by reading source; nothing executes it. The shell and the canvas carry their
own suites in `packages/editor`, and the design site's e2e proves the
geometry, but no test mounts a view.

The application's e2e suite cannot carry this — `docs/MIGRATION.md` says why
it is not acceptance and AGENTS.md forbids running it in flight — so the gap
is structural: a regression in a view's wiring ships with every suite green.

## What done looks like

A broken `markClean` call, a dirty-gated button that stopped gating, or a
control that left the frontmatter region fails a check somewhere.
