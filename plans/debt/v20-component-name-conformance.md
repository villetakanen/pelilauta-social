# ADR 0002's Renames Are Not Carried Out

Status: Recorded 2026-08-05 while reviewing the CnCard release against v20

## What is wrong

`docs/adrs/0002-preserve-v20-design-system-names.md` is accepted, and
`docs/ARCHITECTURE.md` states its rules. The tree does not yet meet them. The CnCard
slice carried out one rename — `Card` became `CnCard` — and left the rest.

- `packages/design-system/components/Icon.svelte` is still `Icon`. The ADR requires
  `CnIcon`, and its specification already lives at
  `specs/design-system/components/cn-icon/spec.md`. Roughly 110 files import it,
  nearly all of them in `apps/pelilauta/src`, so the rename is wide and mechanical.
- The icon book is published at `/components/icon` rather than `/components/cn-icon`,
  from `apps/design/src/content/components/icon.mdx`.
- Two book specimens are reusable across books and should take the `Ds` prefix:
  `books/specimens/Composition.astro`, used by four books, and
  `books/specimens/TokenTable.astro`, used by five. `ARCHITECTURE.md:10` already cites
  the target name `DsComposition.astro` as its example.
- Every other specimen is used by exactly one book and may keep its unprefixed name
  under the ADR's private-component rule.
- `books/specimens/ContrastMatrix.astro` has no consumer at all, and
  `ARCHITECTURE.md:11` cites it as the canonical example of a one-book private
  component. The canonical example is a dead file.

The naming model is correct as written; only the code diverges from it.

## What done looks like

`Icon` is `CnIcon`, its book is `/components/cn-icon`, and its importers follow.
`Composition` and `TokenTable` are `DsComposition` and `DsTokenTable`.
`ContrastMatrix.astro` either gains a consumer or leaves the package, and
`ARCHITECTURE.md` illustrates its rules with files that exist. No `App*` component is
created or moved — the ADR defers that ownership question.
