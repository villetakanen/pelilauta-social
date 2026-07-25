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
   `cn-sortable-list cn-icon[noun="drag"]`. These set size, negative margin,
   button circularity (`:has(cn-icon:only-child)`), and flex/heading layout.
3. **Decide how each matching rule is re-expressed against the local
   component**, not per-consumer hardcoding:
   - *Size* → the context sets the public `--cn-icon-size-*` tokens within its
     scope (see Carried Decisions).
   - *Margin / layout / circularity* → a design-system rule that targets the
     local component's class, or the consumer's own layout where the rule was
     consumer-specific. Record which.
   - A rule with no consumer in the migrated surface is noted and skipped.
4. **Confirm each noun's disposition:** reviewed catalog artwork or an explicit
   approved missing-glyph outcome. Resolve undecided nouns before migration.
5. **Implement**, then run the smallest applicable deterministic checks
   (`astro check`, unit, relevant e2e, both app builds).
6. **Rendered-in-context visual acceptance** of the migrated surface in Light
   and Dark. This is a required gate, not optional; it is the only check that
   catches a missed tag rule.
