# cn-icon Migration Plan

Status: Proposed for human approval
Branch: `feat/cn-icon`
Intent: `specs/design-system/components/cn-icon/spec.md`
Prior loop: `docs/retros/feat-color-theme-compatibility-retro.md`

## Production Outcome

Pelilauta icons again inherit the correct contextual foreground color in Light
and Dark modes. The shared app bar, front-page featured tags, and application
footer use the local server-rendered icon capability, while remaining Cyan Lit
consumers continue to work unchanged.

This is the second design-system migration after tokens and themes. It is not a
prerequisite exercise and does not attempt a mechanical rewrite of every icon
call site.

## Why This Slice

The color-theme release defined global `--color-on`. Cyan 4 `cn-icon` uses
`color: var(--color-on, currentColor)`, so the new definition prevents icons
from inheriting link, button, selected, status, and other contextual colors.
The existing browser test missed this because its footer icon has an inline
color.

The imported application contains 182 declarative `cn-icon` uses across 98
files plus one imperative creation site. A global syntax replacement would mix
public static rendering, hydrated Svelte updates, dynamic persisted nouns, test
selectors, missing assets, and accessibility changes in one delivery.

The selected public consumers provide a bounded vertical slice:

- `AppBar.astro` exercises the default-size search icon in a labeled link;
- `FeaturedTags.astro` exercises extra-small contextual and branded icons;
- `AppFooter.astro` exercises an extra-large icon with an explicit low-emphasis
  color.

## Evidence

### v18 contract

- Installed authority: `@11thdeg/cyan-lit@4.0.0-beta.30`.
- `cn-icon` is a globally registered Lit custom element loaded through the Cyan
  package root in both Pelilauta head variants.
- Its reflected API is `noun`, `xsmall`, `small`, `large`, and `xlarge`; medium
  is the implicit default.
- It references `/icons/{noun}.svg#icon`, uses the established five size tokens,
  and applies `var(--color-on, currentColor)` to its host.
- The current implementation exposes the technical noun through a shadow SVG
  title. Existing consumers also create the element imperatively and use its
  tag and noun attribute as test selectors.

### v20 direction

- Immutable source commit:
  `02880fbc995b45d459ce4f264b29d5283b1d8ced`.
- Intent source:
  `specs/cyan-ds/components/cn-icon/spec.md` at that commit.
- Component source:
  `packages/cyan/src/components/CnIcon.svelte` at that commit.
- v20 renders trusted catalog SVG in the initial response, uses a five-value
  size API, inherits `currentColor` for monochrome artwork, preserves colors
  encoded in branded artwork, provides a visible missing fallback, and treats
  icons as decorative by default.
- v20 evidence is direction, not code to copy blindly. Its public and managed
  catalogs do not contain every noun currently used by v18.

## Approved-Scope Proposal

1. Correct the Cyan 4 compatibility mapping so legacy icons recover their
   original `currentColor` fallback everywhere. Verify other production
   consumers do not require a global `--color-on` definition.
2. Add the smallest local icon catalog needed by the selected consumers and the
   missing fallback. Reconcile `search`, `fox`, `dd5`, `pathfinder`,
   `ll-ampersand`, and `pbta-logo` against current assets and immutable v20
   provenance before moving or copying artwork.
3. Implement the local icon capability in `packages/design-system` from the
   approved intent spec. It must render on the server and require no new
   dependency.
4. Migrate only `AppBar.astro`, `FeaturedTags.astro`, and `AppFooter.astro` to
   direct local component imports. Leave the global Cyan Lit registration in
   place for all remaining consumers.
5. Publish a package-owned icon book through a thin `/components/icon` route in
   `apps/design`. Demonstrate all sizes, contextual monochrome color, branded
   artwork, and the unknown-noun fallback in Light and Dark modes.
6. Add focused package, Pelilauta, and design-book tests for server output,
   noun resolution, sizes, fallback, accessibility, and computed color.
7. Add one root `test` dispatcher and a root Lefthook pre-push test hook. Do not
   add CI, root check/build orchestration, or other harness work.
8. Complete human review, update the retrospective, and decide the next beta
   only after the production and book surfaces are accepted.

## Compatibility Boundaries

This iteration must not:

- remove or update `@11thdeg/cyan-lit`;
- replace all `<cn-icon>` consumers or their test selectors;
- change Firebase data, persisted noun values, routes, or authentication;
- repair the unsupported `name="discussion"` call or currently missing asset
  nouns unless one enters the selected surface;
- announce decorative icons or otherwise perform a global accessibility rewrite;
- add a generic icon-generation pipeline, package-linking architecture, or new
  dependency;
- add CI, authenticated-write verification, or unrelated root check/build
  dispatch;
- redesign, normalize, or recolor approved source artwork.

## Deterministic Acceptance

- A contract test proves the legacy `--color-on` regression is removed without
  leaving a production-consumed color property unresolved.
- Existing Pelilauta unit tests pass.
- The selected consumers contain no `cn-icon` custom elements and render local
  icon markup in server output.
- Known selected nouns resolve to reviewed artwork; an unknown noun renders the
  stable missing fallback.
- All five sizes produce the approved square dimensions.
- Monochrome icons match their parent's computed foreground in both modes and
  interaction states; branded artwork retains reviewed internal colors.
- Decorative SVG is hidden from assistive technology, while containing links
  retain their existing accessible names.
- Pelilauta and design application builds pass.
- Focused browser tests cover `/`, one route with the shared search app bar, and
  `/components/icon` in both modes.
- Root `pnpm test` runs available workspace test scripts, and the root pre-push
  hook invokes it.

## Human Acceptance

Review Light and Dark rendering for:

- app-bar search action in normal, hover, active, and focus states;
- front-page D&D, Pathfinder, L&L, and PbtA featured tags;
- footer fox alignment and low-emphasis color;
- every size, monochrome context, branded example, and missing fallback in the
  design-system book.

Approve the selected asset provenance and confirm that decorative-by-default
semantics are acceptable for the migrated consumers.

## Deferred Inventory

Later icon slices must account for hydrated Svelte noun updates, imperative
`document.createElement('cn-icon')`, dynamic channel/tag/system nouns, the
NounSelect catalog, fixed-color legacy assets, and missing nouns. Those are
evidence for future scope, not work authorized by this plan.

## Stop Rule

If the selected consumers cannot render from a small reviewed catalog within
one working day, stop and re-scope the asset model. Do not introduce a registry
generator or migrate additional consumers to justify the delay.
