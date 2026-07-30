# Core Token Ownership

Status: Draft 2026-07-30
Branch: `feat/ds-foundations` (not opened)

## Why

`packages/design-system` owns colour tokens and nothing else, so `--cn-grid` is
undefined there. Six shadow tokens derive from it, which means the colour book
publishes a shadow contract that cannot resolve, and surfaces and elevation — the
next design-system capability — cannot be built at all. Fixing that means owning
the unit and radius families outright rather than patching one token.

Separately, three token names the application uses are defined nowhere, so a
handful of declarations silently take their initial values in production.

## Decisions

Human, 2026-07-30:

- v20 names are the v21 vocabulary. Names that exist only in Cyan 4 are translated
  in `styles/compat/cyan-4.css`, as the colour contract already does.
- Units and radii are formula-identical between the two versions, so this is
  plumbing with no intended visual change.
- Typography is deferred to its own epic. Cyan 4 computes values *into* tokens
  where v20 keeps tokens as *inputs* to a composed value; correcting that model
  changes every heading in the application, so it needs its own approved
  exception, delivery record and book.
- Consequence: cyan-css stops supplying units and radii but still supplies
  typography. "cyan-css supplies no tokens", and the terminal Cyan sweep behind
  it, is therefore sequenced after the typography epic — not abandoned.

## Dangling names

Rulings, human 2026-07-30:

- `--cn-border-radius` is real vocabulary — an alias for the default radius.
  Define it.
- `--cn-radius` means `--cn-border-radius`. Correct the call sites.
- `--cn-gap-xs` means `--cn-grid`. Correct the call sites.
- `--cn-border-radius-field` means `--cn-border-radius-small`. Correct the call
  site. Its current fallback encodes a single-corner shape, which is retired.
- `--cn-editor-border` is a legacy mistake. Deferred.

Defining and correcting these changes appearance wherever the declarations are
invalid today. That is the fix, and it is what the PR asks the owner to look at.

## Slices

1. **Units, radii, dangling names.** Own the unit and radius families, define
   `--cn-border-radius`, correct the mistaken call sites. Repairs the shadow
   tokens as a consequence. Book: Units & grid.
2. **Surfaces and elevation.** The capability that motivated the work, now that
   its tokens resolve. Book: Elevation.

Typography follows on its own branch.

## Verification

Parity rather than visual review: every ported token must compute to what
cyan-css computed, so nothing moves except the declarations that were invalid, and
those are named in the PR. `--cn-shadow-elevation-*` must compute to real shadows
on the design site, which is the check that fails today. If a heading moves, a
typography token was touched by mistake.

## Open

- Is the default radius medium or large? Medium assumed.
- Does `styles/units.css` absorb `styles/icon.css`, whose tokens came from the
  same v20 file? Not required by either slice.
- The typography epic must also own `--cn-font-family`, which only cyan-css
  references.
