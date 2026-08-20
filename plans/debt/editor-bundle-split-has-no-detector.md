# The editor bundle split has no detector

Status: Recorded 2026-08-20, while reviewing the editor delivery

`specs/design-system/extensions/cn-editor/spec.md` requires that a production
page without an editor contains no `@codemirror` module, and that the editor
views share one content-hashed chunk. Both held at review by building
`apps/pelilauta` and grepping `dist/_astro` by hand.

Nothing runs that check. An import added anywhere in a non-editor page's graph
— a store, a shared component — pulls CodeMirror into that page's bundle, and
every suite stays green.

## What done looks like

A build that ships `@codemirror` outside the editor chunk fails a check, the
way `check:icons` fails a stale icon registry.
