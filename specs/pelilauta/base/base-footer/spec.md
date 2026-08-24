---
status: live
---

# BaseFooter

## Blueprint

### Context

A reader reaching the end of an application page receives peripheral access to active
community presence, external Finnish role-playing spaces and feeds, platform
documentation, release notes, and page attribution. BaseFooter organizes these
ancillary destinations at the close of the document.

### Architecture

An Astro component, `apps/pelilauta/src/base/chrome/BaseFooter.astro`. It mounts
`CnFooter` from `@design-system/components/CnFooter.astro`.

The component maps Pelilauta application content into `CnFooter`'s three sequential
slots:

- **Block 1 (Activity and feeds):** Renders the active users widget
  (`ActiveUsersWidget.astro`), a link to the documentation site, and a link to the RSS
  feed.
- **Block 2 (Community links):** Renders the localized section title
  (`app:footer.links.title`) above the community links from
  `apps/pelilauta/src/data/footer-links.json`.
- **Block 3 (Identity and metadata):** Renders the product logomark, the product
  wordmark, a version link targeting the release notes, and an `app-footer-credits` slot
  for page or artwork attribution.

### Constraints

The footer renders inside the `.app-main` content flow across the primary application
layouts (`Base.astro`, `Site.astro`, `Library.astro`, `Login.astro`, `Admin.astro`, and
`Docs.astro`). Modal and editor shells (`ModalPage.astro`, `EditorPage.astro`) do not
mount it.

Each entry in `footer-links.json` carries a `text` and an `href`, and may carry a
`description` the block renders with the link. The community names are proper nouns in
every language Pelilauta serves, so the file is not localized.

The list includes Myrrys. The other entries are editorial content; changing them
changes no behaviour and does not touch this spec.

The documentation link targets `/docs`.

The RSS feed link targets `/rss/threads.xml`.

The release notes link targets `/docs/80-release-notes` and displays the current package
version.

The active users widget renders active reader avatars during server rendering, and only
when activity data exists. The documentation and RSS links are unconditionally present.

The `app-footer-credits` slot forwards its content to Block 3 beneath the version link.

## Contract

### Definition of Done

- Every primary application layout mounting `BaseFooter` (`Base`, `Site`, `Library`,
  `Login`, `Admin`, `Docs`) displays the footer within its main content flow.
- Block 1 provides working links to `/docs` and `/rss/threads.xml`, and renders active
  reader avatars when active users exist.
- Block 2 renders the localized community heading and every entry of
  `footer-links.json` as a link.
- Block 3 displays the product logomark, wordmark, version link to
  `/docs/80-release-notes`, and any forwarded attribution credits.

### Regression Guardrails

- `BaseFooter` retains the `app-footer-credits` slot for downstream layout attribution.
- The footer introduces no custom media queries or layout breakpoints, delegating
  responsive arrangement to `CnFooter`.
- `footer-links.json` includes Myrrys.

### Scenarios

```gherkin
Given a primary application layout mounting BaseFooter
When the page renders
Then Block 1 displays the documentation link and RSS feed link
And Block 2 displays the localized community heading and the links from footer-links.json
And Block 3 displays the logomark, wordmark, and version link
```

```gherkin
Given an entry in footer-links.json with a text, an href and a description
When the footer renders
Then Block 2 displays the entry as a link with its description
```
