---
status: approved
---

# Docs

## Blueprint

### Context

The documentation is Pelilauta's guide to itself: how the wiki syntax works, what the
terms of use say, how a site is made, what a release changed. A reader arrives to read one
article and leaves knowing one thing, so the application does nothing but present them.

It is written in Finnish. Its chrome translates; its articles do not.

### Architecture

The documentation application lives under `apps/pelilauta/src/docs`, reached as
`@pelilauta/docs`. Its layout is `apps/pelilauta/src/layouts/Docs.astro`, its bar is
`chrome/DocsBar.astro` and its rail is `chrome/DocsRail.astro`. Its strings are the `docs`
locale namespace.

The articles are an Astro content collection, `docs`, loaded from
`apps/pelilauta/src/content/docs`. `src/content.config.ts` states its shape: a `name`, and
optionally a `shortname`, a `noun` and a `description`.

### Constraints

The bar carries the documentation's name and glyph, leading to its front page. A
reader reaches Pelilauta from the rail's footer.

Every article is public. This application reads no session, and shows every reader the
same of it.

## Contract

### Definition of Done

- A reader reaches every article from any article.
- A reader who is not signed in reads the documentation whole.

### Regression Guardrails

- Adding an article to the collection adds it to the rail, and nothing else changes.

### Scenarios

```gherkin
Given a reader without a session
When they open an article
Then they read it
```
