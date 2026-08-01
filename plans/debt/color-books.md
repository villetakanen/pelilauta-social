# Colour Books Need Verification

Status: Recorded 2026-08-01, unstarted

## What is wrong

The colour books build and their automated checks pass, but their published
record is incomplete and partly unsupported.

- The colour lexicon omits `--cn-reply-dock-shadow`: the semantic table excludes
  every name containing `shadow`, while the shadow table includes only the
  `--cn-shadow` prefix.
- `ContrastMatrix.astro` is unused. The published `2.36:1` and `4.32:1` figures
  are written into the book, while tests assert only their broader ranges.
- The usage guidance has not been checked against application consumers. The
  surface and role descriptions were inferred from token names.
- The books say account theme selection is applied during SSR, chroma reaches
  zero at both ends of every family, and every semantic role states both themes.
  The current implementation does not support those statements as written.

## What done looks like

- Every token declared by `color-theme.css` appears exactly once in the colour
  lexicon.
- Published contrast figures are rendered from the production stylesheets and
  cannot drift while tests remain green.
- Role guidance is checked against current application consumers and approved by
  the owner.
- Claims about theme selection, palette construction, and semantic roles either
  cite matching production behavior or are corrected.
