# Cut Lato Keeps a Reserved Font Name

Status: Recorded 2026-08-01, unresolved — blocks the merge of the fonts story

## What is wrong

Lato's OFL declares a Reserved Font Name. From the source face's own name table:

> Copyright (c) 2011-2015 by tyPoland Lukasz Dziedzic (http://www.typoland.com/) with
> Reserved Font Name "Lato".

OFL 1.1 clause 3, as bundled with `lato-font`:

> No Modified Version of the Font Software may use the Reserved Font Name(s) unless
> explicit written permission is granted by the corresponding Copyright Holder. This
> restriction only applies to the primary font name as presented to the users.

`scripts/cut-fonts.mjs` subsets the family, which makes each of the 28 committed Lato
files a modified version. They keep name ID 1 = `Lato`, and
`styles/fonts.css` declares `font-family: Lato`, so the reserved name is the primary
name presented to users.

Roboto Mono is unaffected: it is OFL but declares no reserved name.

## What has been done

The licensing that does not depend on this ruling is fixed: the OFL text and both
copyright notices are in `packages/design-system/fonts/LICENSE`, both applications
serve a copy at `/fonts-license.txt`, the root `LICENSE` names the exception, and the
cut preserves name IDs 0, 13 and 14 so each file carries its own notice again.

## What has to be decided

- **Rely on the delivery reading.** `@fontsource/lato` and Google Fonts both serve
  `unicode-range` subsets of reserved-name families under the original name. If that
  is the position, it should be written down rather than inherited by accident.
- **Rename the cut family.** Safest on clause 3. Costs the family token's value, the
  stylesheet, the tests, the book, and it diverges from every other consumer of Lato.
- **Stop cutting Lato.** Ship whole faces at ~178 KB each: unmodified copies never
  reach clause 3. Loses the payload reduction the story was for.
- **Ask tyPoland for written permission.**

## What nothing checks

No check reads a committed face's name table, so a `subset-font` upgrade that changed
its default name handling would strip the notices again silently. `--check` verifies
the notice files, not the records inside the fonts.
