# Content Grids

A plan coordinates an active epic. Its entries exist to make the work and what
remains legible, not as a delivery record. It may be deleted after the epic closes;
deletion is not a closeout requirement.

## Capability naming pivot

**This epic deliberately pivots the durable capability from Content Containers to
Content Container Layouts.** The previous name described the box but not the behavior
it governs. The new name records the product model: a host contains a vertical sequence
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

- ~~**Harness enablers**~~ — out of this epic, all four. The design e2e suite in
  `verify` is deferred indefinitely during beta
  (`plans/debt/browser-tests-run-locally-only.md`). The token parity check, the test
  gate skill and what remains of the container-name question belong to whatever epic
  next touches the token layers (`plans/debt/token-parity-covers-units-only.md`). The
  bare tray leaves with the v20 tray import.
- **Content Container Layouts capability contract** — write and approve
  `specs/design-system/content-container-layouts/spec.md` for the Prose, Golden, and Triad
  stackable container modes.
- **Front page triad migration** — replace `.content-columns` on `apps/pelilauta/src/pages/index.astro` and resolve adjacent stream header typography.
- **Thread & channel page golden migration** — migrate discussion and channel pages to `.content-golden`, retiring legacy `.content-columns`.
- **Site & profile page golden migration** — migrate site, wiki, and profile pages to `.content-golden` or prose containers.
- **Admin & tool page layout migration** — migrate admin, settings, and utility screens to the appropriate content grid primitives.
- **Opportunistic sweep** — retire any `.secondary` or `.border-radius` usage encountered on surfaces touched by this work.

### Done

- **Content grids stylesheet & book** — `.content-triad` and `.content-golden` ship in
  `styles/content-containers.css` with their container queries, the layout book renders
  both in live hosts, and `content-container.spec.ts` runs every scenario against each
  mode. Success criteria 1, 2 and 4 are met.

  Two findings. The planned `:nth-child(N of :not(script, style, template))` rules of
  criterion 3 are unnecessary: those elements are `display: none`, so they never become
  grid items and take no track. And region block alignment was unstated, so regions
  stretched to the row; the spec now says a region is as tall as its own content, and
  the composition as tall as its tallest region.

- **Design site front page on Golden** — not in the plan when it was written. The
  design system's index was the one page opted out of `.app-main`, laying out
  full-bleed sections with its own display scale. It now stacks a Golden container
  with a Prose flow nested in its primary, and the editorial vocabulary it needed —
  `.hero`, `.kicker`, `.lede`, `.facts`, `.section-heading` — left
  `styles/docs.css` with it. Golden has a real consumer before Pelilauta migrates.

- **Toolchain: Astro 5→7 in one step** — both applications run Astro 7.2 with
  `@astrojs/netlify` 8, `@astrojs/svelte` 9, `@astrojs/mdx` 7 and Vite 8. The planned
  stop at Astro 6 turned out to buy nothing: the direct jump passed every release gate,
  so the two steps became one. Success criterion 6 is met.

## Outscoped

- `content-cards` / auto-fill card grid listing layouts.
- Layouts requiring unbuilt primitives (e.g. standalone canvas editors).
- Button touch target and card action row control geometry.
- Full repository component rename sweeps (`Icon` → `CnIcon` ADR 0002).
- Non-layout debts (version info, monospace form register).
