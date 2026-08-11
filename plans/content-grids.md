# Content Grids

A plan coordinates an active epic. Its entries exist to make the work and what
remains legible, not as a delivery record. It may be deleted after the epic closes;
deletion is not a closeout requirement.

## Capability naming pivot

**This epic deliberately pivots the durable capability from Content Containers to
Content Container Layouts.** The previous name described the box but not the behavior
it owns. The new name records the product model: a host contains a vertical sequence
of stackable **content containers**, and each container selects a **layout mode** for
its own children. The application `main` is the usual host, not the capability
boundary; card-sized and nested containment hosts use the same model.

**Content Grids** remains the delivery epic's name and an implementation shorthand.
**Content Container Layouts** is the design-system capability, specified in
`specs/design-system/content-container-layouts/spec.md`. Prose, Golden, and Triad are
container layout modes; none is a page-level layout mode. The shipped
`.content-prose`, `.content-golden`, and `.content-triad` classes use the unprefixed
public-class convention in `docs/ARCHITECTURE.md`.

This distinction is a significant outcome of the epic. It prevents the CSS Grid
implementation, the containing element, and the layout behavior from becoming one
interchangeable concept when further modes are specified.

## Goal

At the end of this epic cycle, the workspace runs on the newest Astro and Svelte
toolchain, `packages/design-system` provides the Golden and Triad Content Container
modes (`.content-golden` and `.content-triad`), specified, tested in Playwright,
and documented in a layout book. Pelilauta migrates its front page and every content
container fitting the Golden and Triad modes off legacy `.content-columns`.

## Success criterion

1. The approved Content Container Layouts specification defines the Golden and Triad modes,
   their container query thresholds, and track geometry across wide and narrow
   available widths.
2. `packages/design-system` implements `.content-triad` and `.content-golden` in
   `styles/content-containers.css`, exported via `ds.css`.
3. Astro `server:defer` siblings (such as `<SyndicateStream />`) land in their correct grid
   tracks via `:nth-child(N of :not(script, style, template))` rules.
4. A Component/Layout book demonstrates Triad and Golden grid responsiveness with live
   cards and streams across dark and light schemes.
5. `apps/pelilauta/src/pages/index.astro` and all candidate thread, channel, site, profile,
   and admin content containers render in the new layout modes without legacy
   `.content-columns`.
6. The workspace runs on the newest Astro and Svelte toolchain, verified against all
   release gates (frozen lockfile, font emission, SSR Netlify entry check).

## Known scope

Outcomes, not steps, in two lists. The set grows as the work finds more.

### Open

- **Harness enablers** — document DS container prefix & fix bare tray, wire design e2e to verify, extend token collision test, and widen test gate skill.
- **Toolchain major step 1: Astro 5→6** — update `astro`, `@astrojs/netlify`, `@astrojs/svelte`, `@astrojs/mdx`, and `vite` to Astro 6 across both apps.
- **Toolchain major step 2: Astro 6→7 & latest Svelte** — update `astro` and integrations to Astro 7 and latest Svelte across both applications.
- **Content Container Layouts capability contract** — write and approve
  `specs/design-system/content-container-layouts/spec.md` for the Prose, Golden, and Triad
  stackable container modes.
- **Content grids stylesheet & book** — implement triad/golden CSS rules, container queries, defer filters, and the living layout book.
- **Front page triad migration** — replace `.content-columns` on `apps/pelilauta/src/pages/index.astro` and resolve adjacent stream header typography.
- **Thread & channel page golden migration** — migrate discussion and channel pages to `.content-golden`, retiring legacy `.content-columns`.
- **Site & profile page golden migration** — migrate site, wiki, and profile pages to `.content-golden` or prose containers.
- **Admin & tool page layout migration** — migrate admin, settings, and utility screens to the appropriate content grid primitives.
- **Opportunistic sweep** — retire any `.secondary` or `.border-radius` usage encountered on surfaces touched by this work.

### Done

None yet.

## Outscoped

- `content-cards` / auto-fill card grid listing layouts.
- Layouts requiring unbuilt primitives (e.g. standalone canvas editors).
- Button touch target and card action row control geometry.
- Full repository component rename sweeps (`Icon` → `CnIcon` ADR 0002).
- Non-layout debts (version info, monospace form register).
