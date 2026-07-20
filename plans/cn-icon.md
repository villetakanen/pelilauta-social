# cn-icon Migration Plan

Status: Approved 2026-07-20
Branch: `feat/cn-icon`
Intent: `specs/design-system/components/cn-icon/spec.md`
Prior lessons: `docs/lessons/feat-color-theme-compatibility.md`
Active lessons: `docs/lessons/feat-cn-icon.md`

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
- Fallback source:
  `packages/cyan/src/components/CnIconFallback.ts` at that commit.
- Registry generator:
  `scripts/generate-icon-registry.ts` at that commit.
- Community registry and source assets:
  `packages/pelilauta-icons/src/` at that commit.
- Icon sizing authority:
  `packages/cyan/src/tokens/units.css` at that commit.
- v20 renders trusted catalog SVG in the initial response, uses a five-value
  size API, inherits `currentColor` for monochrome artwork, preserves colors
  encoded in branded artwork, provides a visible missing fallback, and treats
  icons as decorative by default.
- v20's source precedence is community icons, managed/proprietary icons,
  built-in fallbacks, and finally the mandatory missing glyph. The source SVG,
  rather than component-side recoloring, determines whether artwork is
  monochrome or branded.
- This source, color, fallback, and sizing model is the target architecture for
  v21. The implementation must still reconcile it with current production:
  v20's catalogs do not contain every noun currently used by v18.

### Source tiers and the licensing boundary

v20 resolves nouns across tiers, and the tiers are a licensing boundary, not
just a lookup order (lessons Finding 13):

- Community tier `@pelilauta/icons` holds project-licensed artwork (e.g. `fox`).
- Managed tier `@myrrys/proprietary` is a separate submodule whose README
  states "All rights reserved... not licensed under the main project license."
  It holds `dd5`, `pathfinder`, `ll-ampersand`, `pbta`, and other branded nouns.
- The v20 generator inlines each tier's SVG source into an `index.ts` **inside
  that tier's own package**, so proprietary artwork never lands in the open
  packages. Resolution is community → managed → bundled fallback → missing.

v21 therefore keeps the same segregation: community artwork lives in the public
design-system catalog; proprietary artwork is consumed from the
`@myrrys/proprietary` submodule and is never copied into public design-system
source.

### Current-only and reconciled assets

The tracked `apps/pelilauta/public/icons/` directory is the compatibility
authority for production nouns missing from v20's packages. `search` is such a
current-only community asset. Community current-only SVGs may be copied into the
public design-system catalog with contents and provenance preserved; they must
not be moved while legacy `cn-icon` consumers still request `/icons/{noun}.svg`.

`pbta-logo` needs explicit reconciliation. In v18, `public/icons/pbta-logo.svg`
and `public/icons/pbta.svg` are byte-identical and are the artwork on the live
front page; the submodule's `pbta` is different artwork. Mapping `pbta-logo` to
the submodule's `pbta` would silently change the rendered logo. Preserving
appearance requires the exact v18 `pbta-logo` artwork as the source; being
branded, it belongs in the proprietary submodule tier.

The v21 submodule is pinned at `b34789a`, before the icon registry existed; the
registry (`icons/`, generated `index.ts`, `@myrrys/proprietary` `package.json`)
exists from `13857fc` (`origin/main`) onward, which still carries the served
webp folders. Nouns absent from both v20 and the current public directory remain
explicit product decisions; this iteration must not invent aliases or artwork
for them.

### Required sizing tokens

The local icon cannot satisfy its five-size contract until v21 owns the
established component sizing tokens. This is not a separate token foundation.
The icon iteration pulls in only the tokens required by its production
consumer:

| Property | Value | Size |
| --- | --- | --- |
| `--cn-icon-size-xsmall` | `1rem` | 16px at the default root size |
| `--cn-icon-size-small` | `1.5rem` | 24px |
| `--cn-icon-size` | `2.25rem` | 36px, the medium default |
| `--cn-icon-size-large` | `4.5rem` | 72px |
| `--cn-icon-size-xlarge` | `8rem` | 128px |

The names and values match Cyan 4 and immutable v20 evidence. Spatial scales,
general sizing tokens, and token generation remain outside this iteration.

## Approved-Scope Proposal

1. Correct the Cyan 4 compatibility mapping so legacy icons recover their
   original `currentColor` fallback everywhere. Verify other production
   consumers do not require a global `--color-on` definition.
2. Add the five exact icon sizing tokens under `packages/design-system` and
   make them visible in the icon book. Do not add unrelated token families.
3. Port the established v20 trusted-registry model and precedence for the
   production-required catalog. Adapt the v20 icon registry generator when it
   is the smallest way to keep source SVGs and the consumed registry aligned;
   this is feature-owned catalog maintenance, not generic token infrastructure.
4. Reconcile the selected nouns across the v20 two-tier source model (see
   Source Tiers below), keeping proprietary artwork out of the public
   design-system catalog:
   - Community tier (project-licensed): `fox` from the v20 `pelilauta-icons`
     source and `search` from the current v18 asset are copied into the
     public design-system community catalog, without removing their public
     originals.
   - Managed tier (all-rights-reserved): `dd5`, `pathfinder`, `ll-ampersand`,
     and `pbta-logo` are consumed from the `@myrrys/proprietary` submodule
     registry, never copied into the public design-system source. This
     requires advancing the v21 submodule pointer from `b34789a` to
     `origin/main` (`13857fc`), which adds the icon registry while preserving
     the served webp assets, and reconciling the `pbta-logo` noun whose live
     artwork differs from the submodule's `pbta`.
   - Include the stable bundled missing fallback.
5. Implement the local icon capability in `packages/design-system` from the
   approved intent spec. It must render on the server and require no new
   dependency.
6. Migrate only `AppBar.astro`, `FeaturedTags.astro`, and `AppFooter.astro` to
   direct local component imports. Leave the global Cyan Lit registration in
   place for all remaining consumers.
7. Publish a package-owned icon book through a thin `/components/icon` route in
   `apps/design`. Demonstrate all sizes, contextual monochrome color, branded
   artwork, source tiers, and the unknown-noun fallback in Light and Dark modes.
8. Add focused package, Pelilauta, and design-book tests for server output,
   registry precedence, noun resolution, size tokens, computed dimensions,
   fallback, accessibility, and computed color.
9. Add one root `test` dispatcher and a root Lefthook pre-push test hook. Do not
   add CI, root check/build orchestration, or other harness work.
10. Complete human review, finalize the cycle lessons, and decide the next beta
   only after the production and book surfaces are accepted.

## Compatibility Boundaries

This iteration must not:

- remove or update `@11thdeg/cyan-lit`;
- replace all `<cn-icon>` consumers or their test selectors;
- change Firebase data, persisted noun values, routes, or authentication;
- repair the unsupported `name="discussion"` call or currently missing asset
  nouns unless one enters the selected surface;
- change icon accessibility semantics or perform a global accessibility
  rewrite; the local icon keeps v18's noun announcement per the 2026-07-20
  spec decision;
- add generic token generation, package-linking architecture, or a new
  dependency; the directly consumed icon registry and its v20-derived generator
  are inside scope;
- copy or inline `@myrrys/proprietary` artwork into the public design-system
  source; proprietary nouns are consumed only from the submodule registry;
- add CI, authenticated-write verification, or unrelated root check/build
  dispatch;
- redesign, normalize, or recolor approved source artwork.

## Deterministic Acceptance

- A contract test proves the legacy `--color-on` regression is removed without
  leaving a production-consumed color property unresolved.
- The five icon sizing properties exactly match the immutable v20 values and no
  unrelated token family is introduced.
- Existing Pelilauta unit tests pass.
- The selected consumers contain no `cn-icon` custom elements and render local
  icon markup in server output.
- Registry generation is deterministic. Community, managed, fallback, and
  missing precedence follows the v20 model, and every generated entry comes
  from a reviewed repository-owned SVG.
- Known selected nouns resolve to reviewed artwork, current-only assets remain
  available at their legacy public paths, and an unknown noun renders the stable
  missing fallback.
- All five sizes produce the approved square dimensions.
- Monochrome icons match their parent's computed foreground in both modes and
  interaction states; branded artwork retains reviewed internal colors.
- The local icon exposes its noun to assistive technology through its artwork
  title as v18 does, and containing links retain their existing accessible
  names.
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

Approve the selected asset provenance. Accessibility semantics were decided
2026-07-20 during the spec's adversarial review: the icon retains v18's noun
announcement, and decorative-by-default was rejected. Confirm that the v20
registry precedence and source-owned monochrome/branded color model are the v21
target.

## Deferred Inventory

Later icon slices must account for hydrated Svelte noun updates, imperative
`document.createElement('cn-icon')`, dynamic channel/tag/system nouns, the
NounSelect catalog, fixed-color legacy assets, and missing nouns. Those are
evidence for future scope, not work authorized by this plan.

## Further Work: Iconography Principles (targeted for v21.0.0-beta.3)

Decided 2026-07-20: the icon epic also delivers an iconography principles
capability, shipped as its own later slice and not in this one. Legacy Cyan 4
publishes two icon pages — a principles page that is in practice only an icon
inventory, and the component usage page. The new design system keeps the
two-page shape but gives the principles page real design content.

The follow-on slice owns:

- an intent spec at `specs/design-system/iconography/spec.md` covering the
  icon vocabulary philosophy, catalog governance, when-to-use guidance, and
  the monochrome versus branded design position;
- a principles book page in `apps/design`, including a catalog inventory
  generated from the icon registry this plan introduces;
- moving catalog-governance ownership from the cn-icon component spec to the
  iconography spec, with the component spec anchoring to it.

That slice runs through the same gates as this one: spec, adversarial review,
human approval, then delivery. Nothing in it is authorized by this plan.

## Stop Rule

If the selected consumers cannot render from a small reviewed catalog within
one working day, stop and re-scope the asset model. Reuse the v20 generator only
for the catalog this iteration consumes; do not expand the catalog or migrate
additional consumers merely to justify the mechanism.
