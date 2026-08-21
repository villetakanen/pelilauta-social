# An inline loader ignores the control it sits in

`CnLoader.svelte:38` sets `color: var(--cn-loader-color)` on the root, so the loader
imposes its own role instead of inheriting the control's foreground. The icon then draws
`currentColor` at 0.44 opacity and the ring at 0.72 — both of that role, not of the
button's `--cn-color-on-button`.

`--cn-loader-color` is `light-dark(primary-60, surface-60)` and `--cn-color-on-button` is
surface-100. Inside a filled button the loader's noun is a mid-tone glyph at 0.44 opacity
on a saturated ground: the ring survives, the icon effectively disappears. The `button`
specimen in `/components/cn-loader` shows it.

The colour is not accidental — `specs/design-system/components/cn-loader/spec.md:27,45`
states that ring and icon share `--cn-loader-color` and that visual colours depend strictly
on it. A loader standing in for a region needs that role; a loader inside a control needs
the control's foreground. The spec does not currently distinguish the two.

## Remaining change

Decide how a loader in a control takes its colour, then apply it:

- Inherit inside a control — the root defaults to `currentColor` and `styles/loader.css`
  supplies `--cn-loader-color` for a standalone or section loader.
- Or keep the role and scope an override to controls, which leaves two places stating the
  same decision.

The opacities need re-checking with whichever wins: 0.44 on a saturated button ground is
not the same reading as 0.44 on a surface. Update
`specs/design-system/components/cn-loader/spec.md` first — it is the file that says the
colour is strictly the token — and the button-in-flight composition in
`specs/design-system/actions/spec.md` is the consumer that proves the fix.
