# The Shipped Faces Are Still Cut

Status: Ruled 2026-08-01, unimplemented — blocks the merge of the fonts story

## The ruling

Lato's OFL declares a Reserved Font Name, from the source face's own name table:

> Copyright (c) 2011-2015 by tyPoland Lukasz Dziedzic (http://www.typoland.com/) with
> Reserved Font Name "Lato".

OFL 1.1 clause 3, as bundled with `lato-font`:

> No Modified Version of the Font Software may use the Reserved Font Name(s) unless
> explicit written permission is granted by the corresponding Copyright Holder. This
> restriction only applies to the primary font name as presented to the users.

Owner ruling: **stop cutting Lato and ship whole faces.** An unmodified copy is never
a Modified Version, so clause 3 does not arise, and no argument about whether
subsetting counts has to be won. `specs/design-system/fonts/spec.md` carries the rule.

## What the repository still does

`packages/design-system/scripts/cut-fonts.mjs` subsets both families, and the 30 cut
files are committed under `packages/design-system/fonts/`. The spec now forbids this.
Until the implementation lands, the spec and the shipped stylesheet disagree.

## What the implementation owes

- Lato from `lato-font` whole: 14 faces, ~178 KB each, no `unicode-range`.
- Roboto Mono from `@fontsource/roboto-mono`, which publishes its own `latin` and
  `latin-ext` subsets — the publisher's files, so they stay, with their ranges.
- `cut-fonts.mjs`, `font-manifest.mjs`, the `subset-font` dependency and the 30
  committed woff2 all go.
- The licence notice stays, and still has to be served: whole faces are still
  redistributed faces.
- `test/fonts.test.ts` loses the manifest it reads and has to resolve faces from the
  packages instead. `apps/design/e2e/fonts.spec.ts` expects 28 Lato faces, and will
  expect 14.
- The book's coverage sentence and its `cut:fonts` section both become false.

## What this costs

The human register's payload returns to what it was: ~178 KB for the face every page
needs, against ~31 KB cut. Only used faces are fetched, so this is the cost of the
first paint, not of the whole set.
