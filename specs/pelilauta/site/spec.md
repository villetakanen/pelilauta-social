---
status: draft
---

# Site

## Blueprint

### Context

A site is a game's space on Pelilauta: a wiki for one campaign, one-shot or organised
play, and sometimes a collection of rules, mini-games or prototypes. It succeeds
Mekanismi, where a site was shaped by the people running it and the service showed no more
than a logotype and a footer around it.

This is the application Pelilauta is split for. A site names itself, so the chrome around
it names the site rather than the service.

### Architecture

The site application lives under `apps/pelilauta/src/site`, reached as `@pelilauta/site`.
Its layout is `apps/pelilauta/src/layouts/Site.astro`. Its bar is
`apps/pelilauta/src/site/chrome/SiteBar.astro` and its rail is `chrome/SiteRail.astro`
beside it. What runs in the browser goes under `@pelilauta/site/client`, and what the
server needs under `@pelilauta/site/utils`. Its strings are the `site` locale namespace.

Editing a page or a handout still takes `EditorPage.astro`, which carries Cyan's bar and
none of this chrome: `plans/debt/editor-page-keeps-the-cyan-bar.md`.

A page of the site establishes the site itself, states which reader may see it, and hands
the layout what it read. The layout reads nothing.

### Constraints

The bar carries the site's name and the glyph of the game system it runs, leading to the
site's root. This application states its identity rather than carrying
`../base/base-bar/spec.md`, and a site being what its authors made of it is the reason
Pelilauta hosts applications at all.

A reader reaches Pelilauta from the rail's footer, because the bar names the site here.

A site's pages, assets, handouts and clocks are reached through the rail. A single page,
asset or handout is reached through the content that lists it.

Creating and deleting take `ModalPage.astro`: they interrupt a reader who is inside the
site and return them to it.

## Contract

### Definition of Done

- Every page taking `Site.astro` carries that site's identity, and the same rail.
- A reader inside a site reaches Pelilauta from every page of it.

### Regression Guardrails

- No page of the site states the identity itself: the bar does.
- A reader who may not see a site reaches none of its pages, whichever page they open.

### Scenarios

```gherkin
Given two pages of the same site
When each renders
Then both bars carry that site's name
And both lead to that site's root
```
