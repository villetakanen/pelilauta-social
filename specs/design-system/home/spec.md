---
status: live
---

# Design Site Home

## Blueprint

### Context

The home page introduces the living design system. A reader arriving without
context learns what the site is, that it serves Pelilauta, and where to start
reading. Search engines and agents receive the same orientation and follow links to the
books, the GitHub repository, and `https://pelilauta.social`.

The page uses an editorial register that welcomes the reader and gives a reason to open
a book.

### Architecture

The page is a bespoke Astro page in `apps/design`. No content collection carries the
page, no MDX entry renders it, and `packages/design-system` does not export it.
`../design-site-navigation/spec.md` governs the surrounding shell and the links to
books.

The page composes shipped content containers and type steps without defining local
measure, rhythm, or type scales. `../spec.md` governs layout containers and
typography.

### Documentation

( -- implicit -- )

### Constraints

The page addresses the reader in the user-facing register defined in `docs/WRITING.md`:
sentences use the pronoun "we" and may carry welcome, orientation, or a reason to read
on. Do not rewrite page copy into the terse, pronoun-free register of a specification.

The page introduces the groups declared in `packages/design-system/books/groups.json`
in declaration order under each group label. The page defines chapter descriptions
directly, while content collections provide the contents of each chapter.

Every link on the page leads to an emitted site page or an external destination, and
the link text names that destination. External destinations are the repository at
`https://github.com/villetakanen/pelilauta-social` and `https://pelilauta.social`.

The `<head>` description and the first paragraph both state what the design system is
and that it serves Pelilauta.

## Contract

### Definition of Done

- A reader without context learns what the site is, whom it serves, and where to start
  before the first chapter.
- The page introduces and links to every group declared in the taxonomy.
- The page links to the GitHub repository and to `https://pelilauta.social`.
- Human review accepts the page as an invitation to read, in Light and Dark.

### Regression Guardrails

- Any group omitted from the page, or any chapter omitted from the taxonomy, creates
  navigation drift.
- A link whose destination the build does not emit fails silently as a static 404.
- Pruning page copy into the specification register turns the home page into a
  duplicate navigation index.

### Scenarios

```gherkin
Feature: Design site home page

  Scenario: Chapter listing
    Given `groups.json` declares a group with at least one book
    When the home page renders
    Then the page introduces the group under its label
    And a link on the page leads to it

  Scenario: Every link lands
    Given the built site
    When every link on the home page is followed
    Then each resolves to an emitted page or to a destination off the site

  Scenario: Orientation before the chapters
    Given a reader arriving without context
    When the reader reads the page from the top
    Then the reader learns what the site is, whom it serves and where to start
    And the first chapter follows
```
