# Consumer Migration Practice

How to migrate a surface off a legacy Cyan Lit component to its local Svelte
equivalent without silently dropping behavior. This is durable practice, not a
plan: it outlines carried-forward decisions and a required pre-flight that every
consumer migration follows. Plans are disposable; this file is not.

Read this before migrating any consumer alongside the relevant capability spec
under `specs/`.

## Carried Decisions

Accepted decisions from closed cycles that the next migration must not
rediscover. Each links to its evidence.

- **A class does not match a tag rule.** The local components render a
  class-bearing element (e.g. `<span class="cn-icon">`), so every legacy
  `@11thdeg/cyan-css` rule scoped to the custom-element **tag** (`cn-icon`,
  `cn-loader`, …) silently stops applying at the migrated site — size, margin,
  and layout included. This is the dominant migration risk and the reason for
  the required tag-rule inventory below.
- **Contextual size forcing sets public tokens, not private variables.** A
  context that needs one icon size (buttons, fabs) sets the public
  `--cn-icon-size-*` tokens within its scope; the component resolves its size
  from those tokens. Do not override the component's private `--icon-dim`, and
  never with `!important` — v20 did and it was a latent specificity bug. The
  owning contract is `specs/design-system/components/cn-icon/spec.md`.
- **Every noun needs a reviewed disposition before consumer migration.** Add
  approved artwork to the appropriate catalog tier, or record an explicit human
  decision that the noun uses the component's missing glyph. Never let an
  unresolved noun fall through accidentally. The owning catalog contracts are
  `specs/design-system/iconography/spec.md` and the component spec.
- **Verify the actual absent case; do not reason from syntax.** "Make the
  import optional" is not "make the build optional" under a build-time
  resolver. Test the real failure mode (remove the submodule, delete the
  asset), do not infer it from the import statement. The optional resolver in
  `packages/design-system/vite/optional-proprietary.mjs` encodes this boundary.
- **A deterministic check protects only once something runs it.** A test with
  no runner or gate is not protection. Wire the runner in the same slice that
  adds the check.
- **Per-consumer, rendered-in-context visual acceptance is the only gate that
  catches tag-selector breakage today.** Unit and registry tests never render
  in the consumer context, so they cannot see it.
- **The end-to-end suite is a second consumer of the element tag.** Playwright
  specs locate controls by the legacy tag (`button:has(cn-icon[noun="send"])`),
  so migrating the source breaks them — silently, because the suite needs the
  emulator and sits in no gate. The migrated equivalent is
  `.cn-icon[data-noun="…"]`.
- **An earlier batch does not retire the tag-rule inventory.** The rules that
  apply depend on the context, not on the component, so a later surface can be
  the first to reach a rule nobody has re-expressed yet — the button and fab
  icon spacing rules survived several batches that way. Re-run the inventory
  for each batch's own contexts.
- **Cross-capability bridges are application migration helpers.** When a local
  component reaches a legacy selector owned by a capability that has not yet
  migrated, re-express only that reached selector under
  `apps/pelilauta/src/styles/migrations/`. Record its legacy source, current
  consumers, future owner, and removal condition. Do not make temporary Button,
  Fab, layout, or typography behavior intrinsic to the migrated component.

### Open debts

- `apps/pelilauta/e2e/color-theme.spec.ts` selects the `cn-icon` tag and is
  broken by the migrated footer; it is in no gate, so it fails silently. Repair
  the selector before that e2e is trusted or gated.

## Migration Pre-flight

Run this before implementing any Lit-consumer migration.

1. **Read** this practice and the capability spec for the component being
   migrated.
2. **Enumerate the tag rules for the target context.** Grep the legacy
   stylesheet for every rule scoped to the component's custom-element tag that
   could apply where this consumer renders it:

   ```sh
   grep -rnE '<tag>' node_modules/@11thdeg/cyan-css/src
   ```

   For `cn-icon`, the legacy rules are (as of `cyan-css@4.0.0-beta.39`):
   `button cn-icon` / `a.button cn-icon` (and the `:only-child`,
   `:first-child:not(:only-child)` variants), `.fab cn-icon`,
   `button.fab` / `a.button.fab cn-icon:first-child:not(:only-child)`,
   `.flex.items-start > cn-icon`, `h3 cn-icon`, and
   `cn-sortable-list cn-icon[noun="drag"]`. These set size, control spacing,
   and flex/heading layout. Cyan 4 has no `:has(cn-icon:only-child)` rule.
3. **Decide how each matching rule is re-expressed against the local
   component**, not per-consumer hardcoding:
   - *Size* → the context sets the public `--cn-icon-size-*` tokens within its
     scope (see Carried Decisions).
   - *Margin / layout* → the owning local capability, or an
     explicitly temporary application migration helper when that capability
     does not exist yet. Keep helpers limited to selectors reached by migrated
     consumers and record their future owner and removal condition.
   - A rule with no consumer in the migrated surface is noted and skipped.
4. **Confirm each noun's disposition:** reviewed catalog artwork or an explicit
   approved missing-glyph outcome. Resolve undecided nouns before migration.
   A noun with no artwork in any tier and none under `public/icons/` is already
   rendering blank in production; say so in the disposition rather than
   treating the miss as new.
5. **Grep the deprecated e2e suite for the tag** over the surface being migrated
   (`grep -rn '<tag>' apps/pelilauta/e2e`) and repair every selector this batch
   breaks, in this batch. Record selectors an earlier batch already broke as
   named debt rather than leaving them to fail silently. Do not cite these e2es
   as acceptance evidence unless the suite is explicitly restored to a gate.
6. **Implement**, then run the smallest applicable deterministic checks
   (`astro check`, unit, contract tests, both app builds).
7. **Rendered-in-context visual acceptance** of the migrated surface. This is a
   required gate, not optional; it is the only check that catches a missed tag
   rule. What it looks for is **theme-independent** — size, control spacing, and
   flex/heading layout, the properties the legacy tag rules actually set. One
   theme is sufficient.

   Light **and** Dark review belongs to design-system colour and theming
   capabilities, not to an application consumer migration (human decision
   2026-07-28). A migrated component that inherits its colour — the local `Icon`
   renders monochrome artwork with `currentColor` — cannot change theme
   behaviour at the consumer, so a dual-theme pass adds no coverage here. Scope
   a dual-theme gate to the slice that owns colour.
