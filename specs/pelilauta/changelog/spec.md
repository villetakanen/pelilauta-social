---
status: proposed
---

# Changelog

## Blueprint

### Context

A reader of pelilauta.social and a maintainer of the repository share one release
record. Keeping a separate reader-facing copy would make maintainers choose which
file to update and let the two disagree.

### Architecture

Root `CHANGELOG.md` is the only authored record. The page bundles it at build time
through a source import, so a deployed page shows the same revision and makes no
runtime request. The route is `/changelog.html` and takes `Base.astro`, which makes
the changelog a base-application page; `specs/pelilauta/base/spec.md` governs its
chrome.

### Constraints

The changelog begins at `21.0.0-rc.2`. The active branch keeps a heading for the
version in root `package.json` and carries no Unreleased section. The heading gains
its date when that version is released. Entries are concise `feat`/`fix`-style lines,
not commit subjects.

The page is public and reads no session. It has no rail entry.

## Contract

### Definition of Done

- The rendered page and the repository file carry the same changelog.
- The footer version link reaches the page.
- A reader without a session reads the page.

### Regression Guardrails

- A missing source fails the build; the page never renders empty.
- The page makes no network request for its content.

### Scenarios

```gherkin
Given the deployed application
When a reader opens /changelog.html
Then the page renders the same entries as root CHANGELOG.md
```

Check: `apps/pelilauta/test/pages/changelog.test.ts`.

```gherkin
Given a reader with no session
When they open /changelog.html
Then the page renders without redirecting to sign-in
```

```gherkin
Given a reader on any base-application page
When they follow the footer version link
Then they land on /changelog.html
```

Check: `apps/pelilauta/test/base/baseFooter.test.ts`.
