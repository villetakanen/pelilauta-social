# Poster

## Goal

At the end of this epic cycle, `packages/design-system` provides the page poster
— the decorative image that replaces the application surface behind a page's
content on hub and site pages. Pelilauta renders it from the design system and
loads no Cyan rule for its markup, wash, chrome treatment or narrow-viewport
behaviour, and the poster is readable in both schemes without filtering the
artwork it renders.

## Success criterion

1. An approved design-system specification defines the poster: its slot-only
   mounting, its decorative markup, its two-layer wash, the contract it imposes
   on the application bar, on navigation and on the flat surface level, and its
   scroll and narrow-viewport behaviour
2. `packages/design-system` implements `CnPoster` and declares its styles through
   the CSS entry point, scriptless and unhydrated
3. The poster carries no filter over user artwork in either scheme, and resolves
   to plain surface under `prefers-reduced-transparency` and `forced-colors`
4. On a page carrying a poster, the flat surface level renders the page surface
   at 80% opacity rather than opaquely, so content sitting at `.elevation-0`
   reads against the image instead of masking it
5. The poster supports both a scrolling and a non-scrolling placement, the
   scrolling one by default, and both keep the content over them readable
6. A Component book named **CnPoster** teaches the capability and demonstrates
   both placements from source in Light and Dark
7. Pelilauta's hub pages and site pages render the design-system poster from the
   same slot, from the same image sources, without changing which pages carry
   one or where their images come from
8. Pelilauta has no live dependency on Cyan's background-poster selectors,
   gradient, light-scheme filter or navigation blend rule
9. A page carrying a poster can carry its copyright note, readable and
   selectable over artwork the design system does not control, without the
   poster ceasing to be decorative

## Known scope

Decisions belong to the capability specification this epic delivers.

The poster imposes transparency on the chrome it sits behind: the application
bar through `--cn-app-bar-background` and its sticky variant, and a surface wash
plus a legibility halo on `nav#rail` and `nav#tray`. The flat surface override
belongs to the poster's stylesheet, conditioned on a poster being mounted, so
`surface.css` keeps one unconditional definition per level.

The copyright note is the one part of the poster that is not decorative. It is
readable and selectable, it takes a focus stop when it carries a link, and it
sits over the artwork rather than on the ground plane, so it needs a legibility
treatment of its own. It withdraws wherever the poster paints nothing, since
there is then nothing to credit, and it holds its position under both the
scrolling and the pinned placement.

### Open

- The copyright note: a design-system component taking the note as a string and
  an optional link, mounted through its own slot beside the poster. The design
  system does not model licences — the consuming application composes the
  string, from `assets[]` or from anywhere else. Needs a spec and a Component
  book.
- Hub pages onto the design-system poster: front page, channels index, channel,
  library. Retires the app-local `ui/BackgroundPoster.astro` and neutralises
  Cyan's poster rules.
- Site pages onto the design-system poster, from the unchanged
  `site.backgroundURL`, and Cyan's `nav#rail` multiply blend gone. Real user
  artwork is the check for the wash in both schemes.

### Done

- The capability contract and the design-system component: spec, scriptless
  `CnPoster.astro`, its stylesheet in the CSS entry point, and the Component
  book, which mounts a real poster through the book layout because a page-level
  singleton cannot be demonstrated inside a figure.

## Outscoped

- The licence vocabulary, and how an application derives a copyright note from
  `assets[]`, `site.license` or anything else
- `SiteListItem`'s card-level poster and its shader
- Application bar, rail and tray beyond the transparency and halo the poster needs
- Site theming settings, and how a site's background image is chosen or uploaded
- Cyan's remaining core stylesheet imports
- Lightboxes, dialog backdrops and other overlay surfaces
