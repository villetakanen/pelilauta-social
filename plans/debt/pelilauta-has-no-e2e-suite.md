# Pelilauta Features Have No E2e Suite

Status: Recorded 2026-08-21, at the deprecate-cyan retro

No suite exercises a pelilauta feature in a browser. The inherited v18 suite at
`apps/pelilauta/e2e` is not evidence and is not run (`docs/MIGRATION.md:67`). Its cost
is recorded in `e2e-signs-in-through-the-form.md`. The UAT suite accepts a release
journey, not a feature. The first consequence is filed in
`editor-views-have-no-automated-check.md`: a regression in a view's wiring ships with
every suite green. `delivery.yaml` states the gap as the `app-e2e` row.

## What done looks like

A pelilauta feature's browser behaviour has a gate an agent can run in flight, and the
`app-e2e` row names a command instead of `none`. The scope is an epic's, not a slice's.
