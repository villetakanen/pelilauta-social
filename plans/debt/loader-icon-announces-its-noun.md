# A loader announces its noun on top of its label

`CnLoader.svelte:20-27` renders `role="status"` with `aria-label={label}` on the root, the
ring `aria-hidden="true"`, and the centre `Icon` with no `decorative`. `Icon` is not
decorative by default: it takes `role="img"`, `aria-label={noun}` and an SVG `<title>`.

So a status region named "Loading" contains an image named "send", and the noun is read out
alongside the label. The noun is the design system's untranslated string, which the
marks and the icon-only control rules elsewhere are careful never to announce. In a button
in flight the control's name is announced too, so the same action is named twice, once
in the reader's language and once not.

The `<title>` also produces a mouse tooltip on the loader's glyph, which nothing in the
loader's contract asks for.

## Remaining change

Pass `decorative` to the centre `Icon`. The loader keeps one accessible name, its `label`,
and the glyph stops carrying a tooltip.

`specs/design-system/components/cn-loader/spec.md` states the live region but not what the
icon exposes, so the constraint goes in first. `packages/design-system/test/cn-loader.test.ts`
and `apps/design/e2e/cn-loader.spec.ts` are where the assertion belongs.
