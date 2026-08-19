# Operator rulings on the T0 open questions (2026-08-18)

These override the corresponding rows in `disposition.md`. The classifier's
table stays as the record of what was found; these rulings state what was
decided.

1. **Status colours.** `--cn-color-love` is private (Reaction Button). The same
   holds for `--cn-color-warning` and `--cn-color-error`: not shared semantic
   vocabulary. Their partial scales (love/warning/error 20-40-60-90) are chroma
   families and belong in the chroma file as partial, lightness-indexed scales.
   **Info does not exist**: neither an info role nor an info scale is carried
   forward. Consumers to remap during T4/T5: `--cn-color-info` in
   `chrome-actions.css` and `surface.css`; `--cn-color-warning` in
   `surface.css`; `--cn-color-error` in Pelilauta's `ReplyDialog.svelte` and
   `EditReplyDialog.svelte`. Cyan compatibility may keep whatever alias its
   remaining consumers require, derived from permanent tokens.
2. **Reply-context and reply-dock tokens** (`--cn-reply-context-bg`,
   `--cn-reply-context-text`, `--cn-reply-dock-bg`, `--cn-reply-dock-border`,
   `--cn-reply-dock-shadow`): delete. Dead vocabulary copied from v20.
3. **`--cn-input` / `--cn-on-input`**: keep shared. Native form controls will
   consume them later.
4. **`--cn-lightbox-background` / `--cn-lightbox-color`**: keep. They feed the
   live, unmigrated Cyan lightbox until that surface migrates.
5. **Customization surfaces.** Nothing except chroma is a customization
   surface. A spec naming a token documents it; it does not publish an override
   API. The 12 "component customization token" rows reclassify by the plain
   consumer rules — single-consumer tokens (`--cn-fab-*` family,
   `--cn-button-secondary`, `--cn-button-secondary-light`, and peers) become
   private to their consuming surface.

Net classification after rulings: the OPEN and customization categories
dissolve into shared semantic, elevation, component-private, compatibility-only,
chroma-scale, and delete.

## The five-scale relation (settled 2026-08-18, per v20 book)

Source: `../pelilauta-20/app/cyan-ds/src/content/principles/color-system.mdx`.

- Two core chroma scales, **primary** and **surface**: complete 13-step
  (0–100) lightness-indexed families. These are the only theme surface — a
  theme may replace either wholesale (v20's ThemeLab demonstrates hue
  overrides; an achromatic replacement gives B/W).
- Three auxiliary chroma scales, **love**, **warning**, **error**: partial
  20/40/60/90 families under the same `--chroma-{family}-{step}` naming,
  consumed by base styles and components. Fixed — replacing them is not
  supported.
- The v20 book also lists a fourth functional palette, **info** (hue 170°).
  V21 does not carry it: no info scale, no info role. This is a deliberate
  departure from the v20 record.

Consequence for T1/T2: the Design Tokens spec and the token schema distinguish
replaceable (core) from fixed (auxiliary) chroma families; the theme JSON
supplies the core families, the auxiliary scales are system-owned token data.

## Amendment (2026-08-19): information is a role pair, not a family

Ruling 1's "info does not exist" is refined: the v20-era bug is the info
*chroma scale* (`--cn-color-info-{20,40,60,90}`) and the `--cn-color-info`
name. Information itself is a shared semantic pair — `--cn-info` and
`--cn-on-info`, light-dark themed over primary. Eliminated in this changeset:
the scale is deleted, the role renamed, `--cn-on-info` introduced carrying the
badge foreground chrome-actions previously declared locally. Computed values
are unchanged.
