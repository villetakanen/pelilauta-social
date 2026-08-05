# ADR 0002 — Restore v20 naming patterns

- **Status:** accepted
- **Date:** 2026-08-05
- **Decided by:** Ville Takanen

## Context

Early phase project harness instructed the agents to create a new design system
for the v18, inspired by the v20 design intent.

The correct guidance was: "replace v18's cyan-4 with the 'cyan 5' as implemented
in v20 as is. Where the v20 design system is unfinished or is found ambiguous,
we'll update it following v20 design intent in human direction".

This related to the agents inventing a new, undocumented naming scheme for the
repository. As an example v21 renamed v20's `CnIcon` and `CnCard` to `Icon` and
`Card`, even though their specifications claimed to preserve v20's public schema.

This practice is erroneous.

The v20 design system prefixes its reusable `.astro` and `.svelte` components by
category.

Each public design-system component carries the `Cn` prefix, and the _reusable_ 
design-system internals use `Ds`. Thus pelilauta would consume an icon as
`<CnIcon />` and the design system would display a dark-light preview for it
as `<DsComposition><CnIcon /></DsComposition>` (or something like it).

v20 also included shared App-level scaffolding inside the design system, with
prefix `App`. As the package structure of v21 differs from v20 in various ways, the
need or location of these app-level scaffold components is undecided at the time
of writing.

Internals of either app (Pelilauta and the design site) do not prefix their
components. This lets an author easily identify the source of a component.

Public design tokens use a similar `--cn-*` naming scheme. The prefix was added to
minimize token-name clashing risk with libraries, or component level token usage.

The `--chroma-*` prefix provides a simple mechanism to switch themes without
understanding design-system internals. As `--chroma-*` colors guarantee a set
contrast between different scales, switching one chroma palette to another within
the model preserves the UI accessibility requirements.

CSS classes are named plainly for the purpose, without a prefix. The classes, such
as `.surface` or `.content-column` omit the prefix, as all classes are expected to
be provided by the DS.

Component hooks are the exception. A component root uses a `.cn-*` hook, such as
`.cn-card`, to identify component-owned markup. A hook is not a public class that
consumers apply to their own elements.

## Decision

v21 preserves a conforming v20 public design-system component's source name when
porting it. `CnCard` remains `CnCard`, and `CnIcon` remains `CnIcon`.

Public reusable design-system components use `Cn*`. Unprefixed v20 names such as
`ProfileButton` are naming drift and gain the prefix when ported.

New public components without a v20 source use `Cn*`. Domain
components use their domain name without `Cn`, including components that compose a
`Cn*` primitive.

Design system components used to build, document, demonstrate, or test the design
system use the `Ds*` prefix. They are not application API and must not use `Cn*`.

Where a component is used by only a single DS book, and is not usable by other pages,
it can use a domain-style unprefixed name to promote its private nature.

Consumer-facing design-system custom properties preserve v20's `--cn-*` names.
The v20 `--chroma-*` palette remains a deliberate exception when that source is
ported. Component-private custom properties may use concise local names. Deprecated
v20 namespaces such as `--cyan-*` and undocumented `--color-*` names are not
introduced.

Public CSS classes lose any `.cn-` prefix that was inadvertently added. Component
hooks retain `.cn-*` and are not public styling utilities.

Reusable Astro and Svelte component files use PascalCase with matching import
identifiers. Ported public components preserve their v20 names. Private
design-system and design-site components use `Ds*`. Product components and
components private to a single design-system book use their capability or domain
names without `Cn` or `Ds`. Astro route files continue to
follow Astro's route naming grammar rather than the reusable-component rule.

We create `docs/ARCHITECTURE.md` to document the naming architecture. No other
content is generated or added to the document due to this decision.

## Consequences

Acceptance requires creating `docs/ARCHITECTURE.md` with only the naming rules
established here. The existing `AGENTS.md` entry then points to a real canonical
record. Later architecture decisions extend that document through their own ADRs;
this decision does not infer or reconstruct unrelated architecture.

The local `Icon` and `Card` components, their imports, specifications, books, and
tests must become `CnIcon` and `CnCard`. Existing design-system documentation
components must be classified by reach: a component reusable by several books uses
`Ds*`, while a component private to one book may retain an unprefixed domain name.
Application-owned components remain unprefixed. No `App*` component is moved,
created, or renamed until its ownership and location are decided separately.

CSS classes must be inventoried by role. Public styling classes lose any
inadvertently introduced `.cn-` prefix together with the selectors, specimens,
compatibility bridges, and tests that consume it. Component hooks retain `.cn-*`
and consumers do not apply them as styling utilities. Token names follow neither
class category: public tokens remain `--cn-*`, with `--chroma-*` as the deliberate
palette exception and local custom properties remaining private.

Approved capability specifications changed by these renames return to draft for
human approval. Repository-wide import and selector churn is accepted during early
beta so that later component ports begin from one naming model rather than adding
aliases for the accidental one.
