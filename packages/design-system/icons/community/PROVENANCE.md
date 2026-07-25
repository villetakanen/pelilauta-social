# Community icon provenance

Project-licensed community artwork consumed by the design-system icon
component. Proprietary artwork is never stored here; it stays in the
`@myrrys/proprietary` submodule (see `plans/cn-icon.md`).

| Noun | Source | Notes |
| --- | --- | --- |
| `fox` | v20 `packages/pelilauta-icons/src/fox.svg` at immutable commit `02880fbc995b45d459ce4f264b29d5283b1d8ced` | Monochrome, `fill="currentColor"`. |
| `search` | v18 `apps/pelilauta/public/icons/search.svg` (current-only asset, absent from v20 packages) | Monochrome, `fill="currentColor"`. |
| `arrow-left` | v18 `apps/pelilauta/public/icons/arrow-left.svg` (project-provenance asset) | Monochrome, `fill="currentColor"`. Moved from the bundled fallback tier to its canonical community home; the v18 artwork differs from the prior fallback path and is the compatibility authority. |
| `add` | v18 `apps/pelilauta/public/icons/add.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `card` | v18 `apps/pelilauta/public/icons/card.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `chevron-left` | v18 `apps/pelilauta/public/icons/chevron-left.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `chevron-right` | Derived from the project `chevron-left` (horizontal mirror via SVG transform) | Monochrome, `fill="currentColor"`. Its natural pair; not invented artwork — the same project polygon reflected. Absent from v18 (the legacy `chevron-right` consumers rendered blank). |
| `clock` | v18 `apps/pelilauta/public/icons/clock.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `dragger` | v18 `apps/pelilauta/public/icons/dragger.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `arrow-up` | v18 `apps/pelilauta/public/icons/arrow-up.svg` (project-created) | Normalized to `currentColor` (source had no fill and defaulted to black). |
| `arrow-down` | v18 `apps/pelilauta/public/icons/arrow-down.svg` (project-created) | Normalized to `currentColor` (source had no fill and defaulted to black). |
| `dots` | v18 `apps/pelilauta/public/icons/dots.svg` (project-created) | Normalized to `currentColor` (source had no fill and defaulted to black). |
| `drag` | v18 `apps/pelilauta/public/icons/drag.svg` (project-created) | Normalized to `currentColor` (source had no fill and defaulted to black). |
| `close` | v18 `apps/pelilauta/public/icons/close.svg` (project-created) | Normalized to `currentColor` (source `<style>` hardcoded `fill:#000`, which overrode its own `fill="currentColor"` attribute). Moved from the bundled fallback tier to its canonical community home. |
| `font` | v18 `apps/pelilauta/public/icons/font.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `label-tag` | v18 `apps/pelilauta/public/icons/label-tag.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `palette` | v18 `apps/pelilauta/public/icons/palette.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `reduce` | v18 `apps/pelilauta/public/icons/reduce.svg` (project-created) | Monochrome, `fill="currentColor"`. Copied verbatim. |
| `info` | v18 `apps/pelilauta/public/icons/info.svg` (project-created) | Monochrome, `fill="currentColor"`. Inkscape `sodipodi:namedview` editor cruft (pagecolor/bordercolor) stripped; the artwork path was already `currentColor`. |
| `filter` | v18 `apps/pelilauta/public/icons/filter.svg` (project-created) | Normalized to `currentColor` (source `<style>` hardcoded `.cls-1{fill:#000}`, overriding its own `fill="currentColor"` attribute). |
| `kebab` | v18 `apps/pelilauta/public/icons/kebab.svg` (project-created) | Normalized to `currentColor` (source had no fill and defaulted to black). |
| `pdf` | v18 `apps/pelilauta/public/icons/pdf.svg` (project-created) | Normalized to `currentColor` (source had no fill and defaulted to black). |

Artwork is copied verbatim unless a Notes entry records a deliberate
`currentColor` normalization (source hardcoded a fill or defaulted to black).
The public originals under `apps/pelilauta/public/icons/` are not removed while
legacy Cyan `cn-icon` consumers still fetch `/icons/{noun}.svg`.
