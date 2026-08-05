# Two Managed Icons Style Every Other Icon on the Page

Status: Recorded 2026-08-05, open

Icon inlines its artwork with `{@html}`. Two entries in `packages/myrrys-proprietary`
carry an SVG `<style>` block inside that artwork, and an inline SVG `<style>` is
document-global, not scoped to its own `<svg>`:

- `bsky` declares `.st0 { fill: #1185fe }`
- `pbta-logo` declares `.st0 { fill: #FFFFFF }`

Three other entries — `discussion`, `homebrew`, `pathfinder` — draw their paths with
`class="st0"` and no fill of their own, relying on `fill="currentColor"` on the wrapping
`<g>`. A CSS rule beats a presentation attribute, so on any page that also renders
`bsky` or `pbta-logo` those three icons stop following the foreground: they paint
Bluesky blue or, on a light surface, white on white.

Found while migrating the front-page thread card, where the channel noun sits inline with
the title. The front page renders `pbta-logo` in a site card, so the `discussion` noun
and the reply-count icon are painted white and are invisible. The card migration did not
introduce this — the previous card rendered the same `Icon noun="discussion"` in its
toolbar — and the failure depends on what else the page happens to render, so it appears
and disappears as unrelated content changes.

## What this leaves

- Icon's contract says monochrome artwork inherits the surrounding foreground through
  `currentColor`. For those three nouns it does not, and nothing detects it: the
  iconography book renders every noun on a tinted tile, where white artwork still reads
  as artwork.
- The fix belongs to the Icon capability, not to a consumer. Either the registry stops
  shipping `<style>` blocks and per-icon class names, or Icon normalizes them out of the
  inner markup when it inlines it. Both change `specs/design-system/components/cn-icon/spec.md`.
- The guard is a browser check: with two icons on one page, the monochrome one computes a
  `fill` equal to its inherited `color`.
- `bsky` and `pbta-logo` are branded artwork and keep their own colours; only the leaked
  rule is the defect.
