# Site settings: Theming

The Theming section of `spec.md` governs the poster and the background image.

## Context

A site owner changes the site poster and background images through the theming tool. The
section renders a lightweight preview, `CnPoster` behind the site card, and two forms that
update the images. The poster image covers the site card; the background image forms
the poster behind site pages.

## Architecture

A `client:only` CSR island: `@pelilauta/site/client/settings/SiteThemingSection.svelte`.

The preview is an iframe on an SSR page, `pages/sites/[siteKey]/settings/poster.astro`.
The page renders `CnPoster` and nothing else. A poster restyles the whole document around
it, so it gets a document of its own. The frame is the section's backdrop: it fills the
section, and the site card and the forms sit over it.

The poster page enforces `requireSiteOwner` and contains no islands.

Two `SiteThemeImageInput` forms follow the frame; one writes `backgroundURL`, and the other
writes `posterURL`. Each form previews the selected file as a thumbnail, uploads the file to site
assets, and writes the asset URL to the site document. Deleting an image writes an empty string
to the field.

## Constraints

- A write to `backgroundURL` reloads the frame to display saved state.
- The poster page sends `Cache-Control: no-store` and carries no cache tag, so a reload
  shows the current document.
- The frame accepts no pointer events and adds no focus stop.
- The poster takes the scrolling placement, as the site's pages mount it, so the frame shows
  the reader's picture: the same tint and the same dissolve.

## Regression Guardrails

- The section paints no background directly; the framed document renders `CnPoster`.
- The settings document holds no `#cn-poster`.
- The design system does not change for the section: no shade class, no scoped poster.

## Scenarios

```gherkin
Feature: Site settings theming

  Scenario: Background set
    Given an owner on /sites/{siteKey}/settings
    And the site carries a backgroundURL
    Then the Theming section shows that image through the poster, tinted for the scheme
    And the site card and the forms sit over it

  Scenario: No background
    Given an owner on /sites/{siteKey}/settings
    And the site carries no backgroundURL
    Then the Theming section shows the site card and the forms on the plain surface

  Scenario: Background uploaded
    Given an owner on /sites/{siteKey}/settings
    When the owner uploads a background image
    Then backgroundURL on the site document carries the asset URL
    And the Theming section shows the new image through the poster
```
