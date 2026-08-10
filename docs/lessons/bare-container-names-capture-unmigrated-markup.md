---
name: bare-container-names-capture-unmigrated-markup
branch: feat/buttons-and-links
date: 2026-08-07
---

**Context:** The FAB stylesheet ships a container query named `tray`
(`packages/design-system/styles/fab.css:151`) intended for the new `nav.fab-tray`.

**What happened:** The unmigrated application tray in
`apps/pelilauta/src/layouts/PageWithTray.astro:44` already declares
`container: tray / inline-size` inline, so the new query captured it: the
Cyan-positioned tray shrinks to its widest FAB, always under the 38.75rem
threshold, and every FAB label on those pages would go `display: none` at all
window sizes.

**Suspected why:** Nothing checks whether a container name a design-system query
introduces is already declared by legacy or application markup mid-migration.

**Fix:** Name the design-system prefix for container names (alongside the
private-token prefix in `docs/ARCHITECTURE.md`) and rename `tray` to match, so a
legacy declaration cannot answer a new query by coincidence.
