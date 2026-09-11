# ADR 0004 — Publish the root changelog in the application

- **Status:** accepted
- **Date:** 2026-09-11
- **Decided by:** Ville Takanen in [task #145](https://github.com/villetakanen/pelilauta-social/issues/145)

## Context

Pelilauta publishes release notes from
`apps/pelilauta/src/content/docs/80-release-notes.md`. That file serves readers but
does not give repository work a root changelog. Adding another release record would
make maintainers choose which copy to update and allow the copies to disagree.

The release notes are not product guidance. Keeping them in the `docs` content
collection makes the documentation application govern a repository release artifact
and constrains its route and chrome to documentation behavior.

## Decision

The repository root `CHANGELOG.md` is the only authored release record. Its history
starts at `21.0.0-rc.2`. The v18 release notes are deleted rather than migrated.

The active release branch maintains a heading for the version in the root
`package.json`. It does not maintain a separate Unreleased section. The first commit
after a release adds the next version heading when it advances the package version.
The heading gains its release date when that version is published.

New entries follow the practice of the current release notes: one version heading with
its release date, followed by concise `feat`, `fix` and other relevant entries. Authors
may improve wording for readers, but the move introduces no new changelog taxonomy.
Commit subjects and implementation inventories do not become entries. An issue or ADR
link follows an entry when that source explains a decision the entry cannot carry.

Pelilauta publishes the root file at `/changelog.html`. The route takes `Base.astro`
and renders the Markdown on the server. The application build bundles the file through
a source import, so a deployed page shows the changelog from the same revision without
reading GitHub or another runtime service.

The footer version links to `/changelog.html`. The release notes leave the `docs`
content collection and documentation rail. The old `/docs/80-release-notes` route is
retired without a redirect because the changelog is now a core application page.

## Consequences

A release change updates one file that repository readers and application readers
share. The application cannot publish a changelog from another revision, and a
missing source fails during development or build instead of producing an empty page
at runtime.

The changelog becomes part of the application build graph. A Markdown rendering
change can affect it, and every release must include its reader-facing entries before
the merge to `main`.

The base application gains a public core page but no rail entry. The base-footer spec
must change its version destination, and a changelog spec must govern the route,
source, chrome and public access. The docs and docs-rail specs remain unchanged after
the content entry leaves their scope.

The deleted v18 notes remain available in git history. The published changelog carries
only releases from `21.0.0-rc.2` onward.
