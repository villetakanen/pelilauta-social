# The design system has no card container layout

`specs/design-system/content-container-layouts/spec.md` governs `.content-prose`,
`.content-golden` and `.content-triad`. It outscopes auto-fill card grid listing
layouts.

The design system does not yet provide a content-cards container layout — a content
container layout mode that provides slots for a header, a tail or footer, and a
responsive auto-fill card grid between them.

Three Pelilauta components need such a layout and currently shim it locally:
`PublicSiteListing.astro`, `UserSitesList.svelte` and `SitesAdmin.svelte`. Each shim
lays out its header, footer and card grid with local styles using `--cn-line` and
`--cn-gap`.

## Remaining change

Spec and publish a card container layout mode in `packages/design-system`, then
replace the local shims in `PublicSiteListing.astro`, `UserSitesList.svelte` and
`SitesAdmin.svelte` with the published capability.
