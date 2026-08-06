# ADR 0003 — Discontinue characters

- **Status:** accepted
- **Date:** 2026-08-05
- **Decided by:** Ville Takanen

## Context

v18 ships a character sub-app: `/library/characters`, `/characters/*`,
`/create/character`, `/sites/*/characters`, `/sites/*/keeper`,
`/admin/sheets` and five JSON endpoints — about 61 files and 4,600 lines
under `apps/pelilauta/src`, plus three e2e specs, four navigation
entries, two site options and locale strings.

The character sub-app was a failed experiment.

Live v18 released it as a flagged late alpha to admins and moderators,
who were told it was temporary. No character data exists outside that
group.

## Decision

Characters are discontinued — no successor, no spec, no deferral.

All character content leaves v21: routes, components, stores, schemas,
Firestore access, utilities, e2e specs, navigation, locale strings, the
`useCharacters` and `useCharacterKeeper` fields in `SiteSchema` and
`SiteUpdateSchema`, the toggles writing them, and the feature's epic,
PBIs and plan.

v21 reads and writes a subset of the shared schema. A site update
PATCHes through `SiteUpdateSchema`, which strips undeclared keys, and
the handler applies field-scoped `siteRef.update()`. An undeclared field
is never sent and never written, so v18's documents keep it. General
rule, not a character exception.

Before 21.0.0 a migration script exports `characters` and `charsheets`,
renders them per author as Markdown, then deletes both collections and
clears the two site fields. Export precedes delete, and is handed to the
two or three authors who used the experimental functionality. Sole
destructive act authorised, scoped to those collections and fields. The
code stays in git history as history, not as a restoration path.

## Consequences

The removal surfaced during the cn-card cycle, so it is delivered there
or logged as debt. "Character and keeper library cards" and "Workflow
and status cards" become one removal story, and the Cyan `cn-card`
retirement waits on it. Seven call sites are deleted, not migrated.

`docs/ARCHITECTURE.md` records the deviation in one note; `AGENTS.md`
states it in one sentence, ahead of any plan that assumes v18 parity.

`apps/pelilauta` loses ~4,600 lines, three e2e specs, five API routes,
two schemas, two site fields. The routes above return 404; no redirects,
as no v21 surface is equivalent. The script runs last: after v21 stops
reading the data, before 21.0.0, when v18's alpha surfaces read empty
for the group that accepted the alpha's terms.

`docs/MIGRATION.md` gains a line item for the migration script before
21.0.0.

Accepted costs: character data destroyed with the Markdown export its
only remnant; sheet templates lost outright; `useCharacters` cleared
with no notice beyond a conversation with the few affected owners; the
L&L epic and PBI-061 abandoned. Reversal requires new code, a new spec
and an import from the export.
