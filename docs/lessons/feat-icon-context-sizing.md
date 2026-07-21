# feat/icon-context-sizing Lessons

Status: Complete — shipped as `v21.0.0-beta.3` (merge `22f9506`, tag
`v21.0.0-beta.3`), 2026-07-21. `pelilauta.social` returns HTTP 200; branch
deleted.

## Update Rule

Read this file before doing work on this branch. Update it as soon as work
produces a meaningful observation, correction, failed assumption, decision, or
reusable technique. Keep facts, interpretations, and decisions distinguishable.

## Intended Production Outcome

Re-express the legacy Cyan button/fab icon-size behavior against the local
`Icon` component so a control standardizes the size of any icon it contains,
removing the per-consumer `size="small"` workaround introduced for the app-bar
search in `v21.0.0-beta.2` (finding 20 of `docs/lessons/feat-cn-icon.md`).

## Spec Authority

`specs/design-system/components/cn-icon/spec.md` (updated 2026-07-21): a context
that requires a single icon size sets the public `--cn-icon-size-*` tokens
within its scope; the icon resolves its size from those tokens. Deliberate
refinement of v20, which forced the component's private `--icon-dim` with
`!important` (a latent specificity bug per the retro).

## Pre-flight (per docs/practices/consumer-migration.md)

Legacy `@11thdeg/cyan-css@4.0.0-beta.39` rules scoped to the `cn-icon` element,
for the button/fab context this slice addresses:

- `button cn-icon`, `a.button cn-icon` — force `--cn-icon-size-small`. **Sizing.**
  Re-expressed as token-collapse on `.cn-icon` within the scope.
- `button:has(cn-icon:only-child)`, `a.button:has(cn-icon:only-child)` —
  icon-only button circularity. **Layout.** Deferred: no migrated consumer is an
  icon-only button (`AppBar` search is a `.button.text` link; verify in visual
  acceptance it did not depend on circularity).
- `button cn-icon:first-child:not(:only-child)` — negative left margin for an
  icon+label control. **Layout.** Deferred: no migrated consumer needs it yet.
- `.fab cn-icon` (fab.css) — force `--cn-icon-size-small`. **Sizing.** Included
  in the token-collapse rule; no migrated fab consumer yet, but the approved
  spec names buttons and fabs together as the same context behavior.

Contexts out of scope for this slice (no migrated consumer): `.flex.items-start
> cn-icon`, `h3 cn-icon`, `cn-sortable-list cn-icon[noun="drag"]`.

## Findings

### 1. Token-collapse needs no `!important`; a zero-specificity selector suffices

The context rule sets the public tokens directly on the local Icon's element
(`:where(button, a.button, .fab) .cn-icon`). A value declared on the element
always wins over the value inherited from `:root`, independent of specificity,
so `:where(...)` (zero specificity) is enough and keeps the rule easy for a
future consumer to override. This is the clean alternative to v20's
`--icon-dim: … !important`.

### 2. The token contract test caught the change and was strengthened, not weakened

`test/icon-registry.test.ts` scanned the whole `icon.css` for
`--cn-icon-size*` declarations and asserted exactly the five `:root` values.
The new context block tripped it. Rather than relax the assertion, the test was
split: one case still pins the five `:root` definitions; a second asserts the
context rule collapses the four non-small tokens to `var(--cn-icon-size-small)`,
does not redefine the small token, and never touches the private `--icon-dim`.
The regression guardrail is now encoded, per finding 16 of the cn-icon cycle.

### 3. Removing the app-bar workaround is the observable proof

`AppBar.astro` dropped `size="small"` on the search Icon. It now renders at the
default medium selection, which the button context collapses to the button
icon size (small, 24px). If the context rule were absent or wrong, the icon
would render at 36px — so the removed workaround is the visual acceptance
probe.

## Open Gates

- ~~Implementation and deterministic checks.~~ Complete 2026-07-21: astro check
  0 errors; DS 9/9; pelilauta 463/463; both app builds.
- ~~Rendered-in-context visual acceptance (Light + Dark) of the app-bar search
  action after the `size="small"` workaround is removed.~~ Passed 2026-07-21
  (human).
- ~~Release decision.~~ Approved 2026-07-21 as `v21.0.0-beta.3` (human).

## Release Note

- **Version.** `v21.0.0-beta.3`. Reassigns the beta.3 earmark: the
  iconography-principles epic (cn-icon finding 12) moves to a later beta. Semver
  identifies the release; the earmark was a plan note, not a commitment.
- **Bundled cycle-setup (disclosed per the AGENTS.md amendment).** This RC
  bundles the feature with a one-time cycle-setup unit —
  `docs/practices/consumer-migration.md` and the delivery-contract amendment
  sanctioning disclosed cycle-setup bundles. Reverting the RC reverts both.
- **Carried known issue.** `apps/pelilauta/e2e/color-theme.spec.ts` remains
  broken and ungated (cn-icon LOW 6); still deferred.
