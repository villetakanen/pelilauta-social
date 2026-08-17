---
status: draft
---

# Site Rail

## Blueprint

### Context

The navigation a reader reaches from anywhere inside one site. Unlike the other rails, what
it holds differs from site to site and from reader to reader: a site enables the tools it
plays with, and a reader holds a role in it.

### Architecture

An Astro component, `apps/pelilauta/src/site/chrome/SiteRail.astro`, reached as
`@pelilauta/site/chrome/SiteRail.astro`. It wraps `CnRail` and supplies its entries;
`../../../design-system/rail/spec.md` and `../../../design-system/chrome-actions/spec.md`
govern everything about how they are drawn, placed and behave.

What the site enables is known to the server and renders with the page. What the reader's
role decides arrives as an island, `client/SiteToolEntries.svelte`.

### Constraints

The site's places. Each is a page of the site, so each can be the one the reader is on:

| Entry | Leads to | Stands |
| :--- | :--- | :--- |
| The site | the site's root | below `--cn-breakpoint-small`, where the bar cannot carry it |
| Hakemisto | the table of contents | always |
| Lataukset | the site's assets | always |
| Kellot | the clocks | where the site uses clocks, for every reader |
| Salaisuudet | the handouts | where the site uses handouts, for every reader |
| Jäsenet | the site's members | for a site owner |
| Työkalut | the tools a site plays with | for a site owner |
| Asetukset | the site's settings | for a site owner |
| Tuo & vie | the site's content, in and out | for a site owner |

Salaisuudet is a site player tool: it stands wherever the site has enabled it, and is
disabled for a reader who is not a player. The site states that it plays this way, whoever
is looking.

Kellot stands for every reader the site shows it to, as v18 serves it.

A site owner tool is absent for a reader who is not an owner, rather than disabled.

The rail's footer carries Pelilauta, the reader's inbox and their identity. The first
stands here and in no other rail.

## Contract

### Definition of Done

- A reader inside a site reaches every place the site offers them.
- The rail states which of them the reader is on.

### Regression Guardrails

- The rail states no measurement, responsive rule or interaction of its own beyond the
  entry the bar cannot carry; those are the design system's.
- A site owner tool never renders for a reader who is not an owner.

### Scenarios

```gherkin
Given a site that uses handouts
And a reader who is not one of its players
When the rail renders
Then the handouts entry stands, disabled
```

```gherkin
Given a reader who is not a site owner
When the rail renders
Then it carries no site owner tool
```
