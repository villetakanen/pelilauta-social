# v20 Color Theme Compatibility Specification

Status: Implemented; human visual acceptance pending

## Production Outcome

`pelilauta.social` uses the established v20 Light and Dark color themes across
the whole application while existing Astro, Svelte, and Cyan Lit consumers keep
working through their current CSS custom-property names.

The visible color change is intentional. Routes, content, interactions,
authentication, persisted data, and theme-selection behavior remain compatible
with v18.

## Approved Scope

The human owner approved a whole-application visual-theme replacement on
2026-07-18. This is an explicit exception to v18 visual parity: v20 OKLCH colors
replace the current Cyan 4 HSL colors everywhere the application consumes the
translated theme contract.

The application continues to select Light or Dark from the browser/OS
`prefers-color-scheme`. This change does not activate, validate, migrate, or
write the persisted `account.lightMode` field. It does not add a theme picker.

## Sources Of Truth

### v18 compatibility source

- Imported application commit:
  `bac42a7ae56526b8f9cb1c1cc10d3e30ea468239`
- Installed dependency: `@11thdeg/cyan-css@4.0.0-beta.39`
- Chroma contract:
  `apps/pelilauta/node_modules/@11thdeg/cyan-css/src/tokens/chroma.css`
- Semantic contract:
  `apps/pelilauta/node_modules/@11thdeg/cyan-css/src/tokens/colors.css`
- Theme selection:
  `apps/pelilauta/node_modules/@11thdeg/cyan-css/src/utilities/theme.css`
  and `src/core/preflight.css`

### v20 visual source

- Source commit:
  `02880fbc995b45d459ce4f264b29d5283b1d8ced`
- Reference colors:
  `packages/cyan/src/tokens/chroma.css` at that commit
- Light/Dark semantic theme:
  `packages/cyan/src/tokens/semantic.css` at that commit
- Immutable repository base:
  `https://github.com/villetakanen/pelilauta-20/tree/02880fbc995b45d459ce4f264b29d5283b1d8ced`

When prose documentation and CSS disagree, the immutable CSS implementation is
authoritative.

## Current Behavior

- `BaseHead.astro` and `EditorHead.astro` import `@11thdeg/cyan-css` globally.
- Cyan declares `color-scheme: dark light`; `light-dark()` follows browser/OS
  preference because Pelilauta does not apply `.light` or `.dark` classes.
- `account.lightMode` is an optional persisted string initialized during account
  creation, but no current application code applies it to the document.
- Application and dependency styles consume overlapping `--chroma-*`,
  `--color-*`, and `--cn-color-*` namespaces.
- CodeMirror reads semantic properties and several direct chroma properties.
- The footer directly consumes surface chroma properties.
- Browser and PWA theme colors are fixed and do not follow the active mode.

## Architecture

`packages/design-system/styles` owns three static, web-native CSS layers:

1. `color-reference.css` contains the 42 exact v20 reference colors under a
   collision-free v21 namespace.
2. `color-theme.css` contains the established v20 Light/Dark semantic mappings,
   adjusted only to reference the collision-free names.
3. `compat/cyan-4.css` translates production-consumed Cyan 4 custom properties
   to the v20 semantic theme.

`packages/design-system/styles/color.css` imports those layers in order.
Pelilauta imports that entrypoint after `@11thdeg/cyan-css` in both head
components. Cyan 4 remains installed because this slice replaces its color
contract, not its typography, layout utilities, component styles, or Lit
components.

`packages/design-system/pages/tokens/ColorPage.astro` is the living DS book for
this intent and contract. It parses the committed reference and compatibility
CSS at build time, renders both semantic modes, and is exposed by the thin
`apps/design/src/pages/tokens/color.astro` route.

The source-level link uses a Vite alias mirrored by a TypeScript path alias. No
workspace package dependency or build orchestration is introduced.

CSS is canonical for this web-only consumer. This slice does not introduce a
JSON token manifest, DTCG schema, generator, projection, or a new third-party
package version. The design app and book are required verification consumers.

## Translation Rules

- Preserve the complete set of v18 semantic custom-property names declared by
  Cyan 4 `colors.css` when they are consumed by Pelilauta or its installed Cyan
  components.
- Use the exact v20 semantic property when one exists.
- Map a legacy-only semantic role to the closest existing v20 semantic role;
  do not create a new reference color to preserve a legacy distinction.
- Expose missing application-consumed aliases such as focus, primary, and hover
  only when they resolve directly to an established v20 semantic role.
- Translate direct primary and surface chroma consumers to the corresponding
  v20 reference step. The changed meaning of numbered steps is intentional.
- Translate `--chroma-K-S` to the light surface endpoint and `--chroma-S-K` to
  the dark surface endpoint.
- Translate scalar info, warning, and error properties through the established
  v20 status semantics and derive their tints with OKLCH color mixing.
- Leave the unused Cyan 4 secondary ramp and HSL fragment properties untouched.
  They have no v20 authority and no production consumer was found.
- Keep `.light`, `.dark`, `.light-only`, and `.dark-only` behavior unchanged in
  this slice. The application continues to rely on OS preference.
- Keep fixed browser `theme-color` and PWA manifest colors unchanged.

Before release, the compatibility stylesheet must contain a reviewable table
or grouping that shows every translated legacy property and its v20 target.
Missing production-consumed properties are release blockers.

## Compatibility Boundaries

This feature must not:

- remove or update `@11thdeg/cyan-css` or `@11thdeg/cyan-lit`;
- change Firebase schemas, account documents, local storage, or session stores;
- make `account.lightMode` affect rendering;
- add a user-facing theme setting;
- change public URLs, HTML semantics, content, or interaction behavior;
- repair the existing CodeMirror `.dark` class detection mismatch;
- alter PWA metadata or browser chrome colors;
- migrate spatial, radius, typography, or motion tokens;
- add token-generation infrastructure or unrelated design-site functionality.

## Delivery Plan

| Status | Task | Gate |
| --- | --- | --- |
| Complete | Establish v18 behavior, immutable v20 sources, approved visual scope, and compatibility exclusions. | This specification records the whole-application exception and OS-driven selection contract. |
| Complete | Add the static v20 reference, semantic, and Cyan 4 compatibility CSS under `packages/design-system/styles`. | Exact reference values match the immutable v20 CSS; every production-consumed legacy property resolves without fallback. |
| Complete | Import the local theme after Cyan 4 in both Pelilauta head components and update only direct application chroma consumers that cannot be translated safely. | Normal and editor builds load the local theme after Cyan 4 without changing routes or behavior. |
| Complete | Add deterministic color-contract and browser checks for Light and Dark modes. | Contract tests cover exact references, layer order, transitive local/Cyan property resolution, and head imports; Playwright verifies canonical computed roles, CodeMirror styles, and inherited custom-element color in both modes. |
| Complete | Publish the intent and contract as a package-owned DS book. | `/tokens/color` builds from current CSS, renders Light and Dark semantics, lists all 42 references, and exposes the Cyan 4 translation table. |
| In progress | Run repository checks, deploy a preview, and complete human visual acceptance before release. | Unit tests, check, build, focused Playwright checks, preview smoke tests, and the route matrix below pass. |

If the production import and first browser evidence are not working within one
working day, stop and re-scope. Do not add token infrastructure to solve the
delay.

## Deterministic Acceptance

- All 42 reference declarations exactly match v20 commit
  `02880fbc995b45d459ce4f264b29d5283b1d8ced`.
- A static contract test inventories custom properties consumed by tracked
  Pelilauta styles and verifies that each translated color property resolves to
  either the local theme or an explicitly retained Cyan 4 property.
- Browser checks emulate Light and Dark OS preferences without adding document
  theme classes.
- Browser checks assert representative computed colors for body background and
  text, links, borders, buttons, status feedback, inputs, footer, CodeMirror,
  and at least one inherited Cyan Lit/custom-element surface.
- Switching the emulated OS preference updates `light-dark()` values without a
  route change.
- All 462 unit tests pass, including six color-theme contract tests.
- `pnpm --filter pelilauta check` reports no new errors.
- `pnpm --filter pelilauta build` succeeds.
- `pnpm --filter design build` succeeds and emits `/tokens/color`.
- `pnpm --filter design test:e2e` verifies the CSS-derived book content and
  Light/Dark computed values in Chromium.
- Focused Playwright checks run through the repository-defined script rather
  than invoking the binary directly.

## Human Acceptance

Review the deploy preview in Light and Dark OS modes on:

- `/` for body, navigation, links, cards, footer, and background poster;
- `/search` for theme-specific logo visibility;
- `/settings` for modal and form surfaces;
- one thread route for replies, reactions, buttons, and inherited Lit elements;
- one editor route for CodeMirror, fields, selection, and focus states;
- `/admin/channels/add` for currently incomplete NounSelect aliases.

Confirm readable contrast, visible focus, hover and active states, status colors,
dialog backdrops, and no flash caused by account/session hydration. Safari or
WebKit remains a human gate because the theme relies on `light-dark()`, OKLCH,
and `color-mix()`.

## Remaining Human Gates

- Approve the legacy-only semantic mapping table before merge and release.
- Accept the deploy-preview appearance in both modes across the route matrix.
- Decide separately whether a future feature should activate or remove
  `account.lightMode`; this feature must not make that decision implicitly.
