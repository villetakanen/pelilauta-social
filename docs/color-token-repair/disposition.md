# T0.4/T0.5 — `color-theme.css` token disposition

Classifies all 78 `:root` declarations captured in `color-theme-declarations.md`
(tag `before/color-token-repair`). Evidence cites file paths found by direct
repository search in addition to the T0.4 consumer-reach sweep; compat reach
alone never establishes shared status (per plan rule).

Legend — classification: **shared** (semantic.css), **elevation** (elevation.css),
**private** (component scope, private name), **custom** (component
customization token — public `--cn-*` name kept, spec-declared surface),
**compat** (compatibility-only).

| Token | Classification | Destination | Evidence | Notes / OPEN |
| :--- | :--- | :--- | :--- | :--- |
| `--cn-surface` | shared | semantic.css | CnReactionButton, surface.css, color-contrast test; Surface spec names it the level-0 ground-plane role. | — |
| `--cn-surface-1` | shared | semantic.css | surface.css (elevation-1 background); Surface spec table names the role. | Background colour, not shadow — stays out of elevation.css per plan's family split (elevation.json carries shadow, not level backgrounds). |
| `--cn-surface-2` | shared | semantic.css | SnackbarSpecimen, CnAvatar, identity.css, surface.css; Surface spec table. | — |
| `--cn-surface-3` | shared | semantic.css | surface.css; Surface spec table. | — |
| `--cn-surface-4` | shared | semantic.css | CnSnackbar, surface.css; Surface spec table (level 4, "highest system layer"). | — |
| `--cn-on-surface` | shared | semantic.css | chip.spec, CnAvatar, buttons.css, chip.css, identity.css, menu.css. | — |
| `--cn-on-surface-secondary` | shared | semantic.css | toggle.css; paired foreground role for surface-secondary text. | Single production file today (toggle.css) but pairs with `--cn-on-surface` as one role family; no contrary evidence found. |
| `--cn-background` | shared | semantic.css | SnackbarSpecimen, preflight.css, color-contrast test. | Alias of `--cn-surface`; kept as its own role since preflight/base HTML consume it directly. |
| `--cn-on-background` | compat | compat/cyan-4.css | Grep confirms zero non-compat consumers repo-wide (`apps/pelilauta`, `packages/design-system`). | Compat's `--color-on-background`/`--cn-color-on-background` should derive straight from `--cn-on-surface` instead of through this now-unused intermediate. |
| `--cn-text` | shared | semantic.css | SnackbarSpecimen, CnCard, preflight.css. | — |
| `--cn-text-high` | shared | semantic.css | cn-card.spec, Pelilauta OnboardingCallout + NotificationItem, CnCard, CnSnackbar, identity.css, typography.css. | — |
| `--cn-text-low` | shared | semantic.css | SnackbarSpecimen, CnCard, CnReactionButton, docs.css, poster-credits.css, typography.css. | — |
| `--cn-text-heading` | shared | semantic.css | CnCard, typography.css. | — |
| `--cn-text-subheading` | shared | semantic.css | Pelilauta CodeMirror styles (`styles.css`), typography.css. | — |
| `--cn-link` | shared | semantic.css | Pelilauta color-theme e2e, `overrides.css`, links.css; Actions spec (default-link table). | — |
| `--cn-link-hover` | shared | semantic.css | Pelilauta CodeMirror styles, CnCard, identity.css, links.css; Actions spec. | — |
| `--cn-link-active` | shared | semantic.css | identity.css, links.css; Actions spec. | — |
| `--cn-button` | shared | semantic.css | buttons.css; Actions spec (default button-variant table). | — |
| `--cn-button-light` | shared | semantic.css | buttons.css, toggle.css; Actions spec. | Two real capabilities (button + toggle) confirm shared independent of the spec. |
| `--cn-button-cta` | shared | semantic.css | buttons.css; Actions spec (`.cta` variant table). | Single production file, but Actions spec names it as the CTA variant's contract role — spec-declared shared (T0.5). |
| `--cn-on-button` | shared | semantic.css | chip.spec, buttons.css. | — |
| `--cn-on-button-cta` | shared | semantic.css | buttons.css; Actions spec `.cta` table. | Spec-declared (T0.5), single production file. |
| `--cn-button-text` | shared | semantic.css | chip.spec, CnReactionButton, buttons.css, chip.css, toggle.css. | — |
| `--cn-button-secondary-light` | custom | Actions/buttons token file | buttons.css only; Actions spec `.secondary` table: "the v20 alternate chroma treatment where that palette is explicitly required." | T0.5 — spec explicitly frames `.secondary` as an intentional, named exception rather than an ordinary shared role; flagging for operator confirmation of shared vs. customization-surface treatment. |
| `--cn-button-secondary` | custom | Actions/buttons token file | buttons.css only; same spec passage as above. | T0.5, same as `--cn-button-secondary-light`. |
| `--cn-fab` | custom | fab component token file | fab.css only; Actions spec FAB variant table names the role explicitly. | T0.5 — single-consumer family, but Actions spec pins the exact `--cn-fab*` names as FAB's public per-variant contract; treat as a declared customization surface, not a demotion candidate. |
| `--cn-fab-blend` | custom | fab component token file | fab.css only; Actions spec. | T0.5, same as `--cn-fab`. |
| `--cn-on-fab` | custom | fab component token file | fab.css only; Actions spec. | T0.5. |
| `--cn-fab-cta` | custom | fab component token file | fab.css only; Actions spec `.cta` FAB table. | T0.5. |
| `--cn-fab-cta-blend` | custom | fab component token file | fab.css only; Actions spec. | T0.5. |
| `--cn-on-fab-cta` | custom | fab component token file | fab.css only; Actions spec. | T0.5. |
| `--cn-fab-secondary` | custom | fab component token file | fab.css only; Actions spec `.secondary` FAB table. | T0.5. |
| `--cn-fab-secondary-blend` | custom | fab component token file | fab.css only; Actions spec. | T0.5. |
| `--cn-on-fab-secondary` | custom | fab component token file | fab.css only; Actions spec. | T0.5. |
| `--cn-hover` | shared | semantic.css | chrome-actions.spec, CnReactionButton, buttons.css, chip.css, chrome-actions.css, menu.css. | — |
| `--cn-active` | shared | semantic.css | Same consumer set as `--cn-hover`. | — |
| `--cn-indicator` | shared | semantic.css | chrome-actions.spec, chrome-actions.css; chrome-actions spec Regression Guardrails name `--cn-indicator` explicitly. | Only one production file today, but the governing spec declares the exact token name as a contract item — spec-declared shared. |
| `--cn-on-indicator` | shared | semantic.css | chrome-actions.spec, chrome-actions.css, color-contrast test; same spec passage as `--cn-indicator`. | — |
| `--cn-surface-over-poster` | private | poster.css (private name) | poster.css only (`background-color: var(--cn-surface-over-poster)`). No `cn-poster`/`cn-poster-credits` spec names this token. | Single capability, no customization declared — demote to a private poster-scoped custom property. |
| `--cn-scrim` | shared | semantic.css | CnRail.astro (`background-color: var(--cn-scrim)`), consumed in production via AdminRail/LibraryRail; Rail spec: "the scrim takes a published colour role... published where the other design [tokens are]." | T0.4 correction: the input sweep reported zero consumers, but CnRail.astro consumes it directly and Rail spec explicitly calls it a *published* role — not compat-only or dead. |
| `--cn-focus-ring` | shared | semantic.css | Widest reach (14): buttons, chip, chrome-actions, fab, identity, links, menu, toggle, CnCard, CnReactionButton, CodeMirror, two design-site specs. | — |
| `--cn-border` | shared | semantic.css | Pelilauta CodeMirror, LoaderSpecimens, CnCard, docs.css. | — |
| `--cn-border-hover` | compat | compat/cyan-4.css | Grep confirms zero non-compat consumers. | Compat's `--color-border-hover` should derive directly from `--cn-border` (or a hover mix) instead of keeping this as a permanent root role. |
| `--cn-border-focus` | compat | compat/cyan-4.css | Grep confirms zero non-compat consumers. | Same treatment as `--cn-border-hover`, deriving from `--cn-focus-ring`/`--cn-border`. |
| `--cn-color-success` | compat | compat/cyan-4.css | Grep confirms zero non-compat consumers; no spec assigns a "success" status role anywhere (Surface's attention states use only warning/info). | — |
| `--cn-color-warning` | shared | semantic.css | surface.css (`has-alert` flag); compat. Surface spec: "alert takes the warning role," a published role any consumer composing `has-alert` may trigger. | Spec-declared shared despite one current CSS file. |
| `--cn-color-error` | shared | semantic.css | CnReactionButton (pressed gradient); **also** `apps/pelilauta/src/components/svelte/discussion/ReplyDialog.svelte:162` and `EditReplyDialog.svelte:87` (`color: var(--cn-color-error, #c00)`, direct inline-style consumption, not through compat). | T0.4 correction: the input sweep listed only CnReactionButton + compat; direct grep found a second real production capability (reply-error messaging), confirming two-capability shared status without needing the spec-declared exception. |
| `--cn-color-info` | shared | semantic.css | chrome-actions.css, surface.css (`has-notify` flag). | Two real production capabilities — shared by the plain consumer-count rule. |
| `--cn-color-love` | private | CnReactionButton (private name) | CnReactionButton only; spec prose names `--cn-color-love` but only as internal implementation detail of the pressed gradient, not as an exposed customization input. | OPEN — CnReactionButton's spec pins this exact custom-property name in its Constraints prose. Ask whether that textual pin counts as a declared customization surface (keep public) or is merely documentation of an internal value (demote private). |
| `--cn-bubble` | private | CnBubble.svelte (private name) | CnBubble.svelte only (`.cn-bubble { background: var(--cn-bubble) }`); compat alias has no consumer. CnBubble spec's Constraints table fixes this role per variant, not as a customizable input. | — |
| `--cn-on-bubble` | private | CnBubble.svelte (private name) | Same as `--cn-bubble`. | — |
| `--cn-reply-bubble` | private | CnBubble.svelte (private name) | CnBubble.svelte (`.cn-bubble.reply`); compat alias unconsumed. | — |
| `--cn-on-reply-bubble` | private | CnBubble.svelte (private name) | Same as `--cn-reply-bubble`. | — |
| `--cn-reply-context-bg` | OPEN | none established | Zero consumers anywhere (grep of `apps/`, `packages/`, `specs/`, `plans/` finds only the color-theme.css declaration itself). No "reply context"/"reply dock" spec exists; thread-presentation plan lists CnBubble/CnLightbox/reaction control as the only in-scope capabilities and puts the reply dialog itself out of scope. | OPEN — no consumer and no governing spec place this token anywhere. Ask: delete now as dead v20-copied vocabulary, or retain as component-private scaffolding for a not-yet-specified reply-dock capability? |
| `--cn-reply-context-text` | OPEN | none established | Same as `--cn-reply-context-bg`. | Same open question. |
| `--cn-reply-dock-bg` | OPEN | none established | Same as `--cn-reply-context-bg`; also absent from compat. | Same open question. |
| `--cn-reply-dock-border` | OPEN | none established | Same. | Same open question. |
| `--cn-input` | OPEN | semantic.css or private (undetermined) | Pelilauta CodeMirror (`styles.css: --color-code: var(--cn-input)`), consumed through the compat `--color-input`/`--color-field` chain by `cnEditorTheme.ts`; compat. No input/forms/field spec exists (`plans/forms-and-feedback.md` was deleted from the working tree with no successor spec found under `specs/design-system`). | OPEN — single current capability (CodeMirror editor) with no governing spec for a generic "input" role; the name reads as a base semantic intended for native form controls generally. Ask whether to keep shared in anticipation of unmigrated form inputs, or scope private to CodeMirror pending a Forms spec. |
| `--cn-on-input` | OPEN | pairs with `--cn-input` | Same evidence and question as `--cn-input`. | Same open question. |
| `--cn-input-hover` | compat | compat/cyan-4.css | Grep confirms zero non-compat consumers (including through `--color-input-hover`/`--color-field-hover`, both themselves unconsumed outside cyan-4.css). | Fully dead beyond compat; compat should compute from `--cn-input`/`--cn-hover` directly instead. |
| `--cn-input-focus` | compat | compat/cyan-4.css | Same as `--cn-input-hover` (`--color-input-focus`/`--color-field-focus` also unconsumed). | Same treatment. |
| `--cn-input-disabled` | compat | compat/cyan-4.css | Same pattern (`--color-input-disabled` unconsumed outside cyan-4.css). | Same treatment. |
| `--cn-shadow-color` | elevation | elevation.css | CnCard, CnReactionButton, buttons.css, compat. | — |
| `--cn-shadow-elevation-1` | elevation | elevation.css | CnAvatar, fab.css, identity.css; Surface spec's elevation table. | — |
| `--cn-shadow-elevation-2` | elevation | elevation.css | fab.css, identity.css, surface.css; Surface spec. | — |
| `--cn-shadow-button-hover` | elevation | elevation.css | CnReactionButton, buttons.css. | — |
| `--cn-shadow-elevation-3` | elevation | elevation.css | surface.css; Surface spec names the full elevation-1..4 family as its architecture regardless of per-token consumer count. | Spec-declared shared as part of the elevation family. |
| `--cn-shadow-elevation-4` | elevation | elevation.css | CnSnackbar, fab.css, surface.css. | — |
| `--cn-reply-dock-shadow` | OPEN | none established | Zero consumers; derives only from `--cn-shadow-elevation-3`. | Same open question as the other `--cn-reply-dock-*`/`--cn-reply-context-*` tokens — grouped with that family. |
| `--cn-selection` | compat | compat/cyan-4.css | Direct grep: only `apps/pelilauta/test/styles/colorThemeContract.test.ts` names it (a contract test, not a capability). Real downstream use is `cnEditorTheme.ts` consuming the compat name `--color-selection`, which per plan rule does not count as a second capability. | Compat-only for classification; note the CodeMirror editor's colour ultimately depends on this chain, so removing the root declaration requires re-deriving `--color-selection` from a permanent semantic role in the same change. |
| `--cn-on-selection` | compat | compat/cyan-4.css | Only reached through compat's `--color-on-selection` → `cnEditorTheme.ts`; no direct `--cn-on-selection` consumer anywhere. | Same treatment and caveat as `--cn-selection`. |
| `--cn-backdrop` | compat | compat/cyan-4.css | `colorThemeContract.test.ts` names it (contract test only); compat's `--background-dialog-backdrop` alias itself has zero consumers outside cyan-4.css. | Fully dead beyond compat and its own contract test. |
| `--cn-lightbox-background` | OPEN | undetermined | Overridden in production by `apps/pelilauta/src/styles/migrations/cyan-elements.css:15` (`cn-lightbox { --cn-lightbox-background: var(--color-surface-2); }`), which backs the still-rendered legacy `cn-lightbox` Cyan element in `ThreadEditorForm.svelte`, `ReplyArticle.svelte`, `ReplyDialog.svelte`, `EditReplyDialog.svelte`, `ThreadArticle.astro`. No `CnLightbox` spec exists yet (thread-presentation plan lists it as unshipped "possible work"); `apps/design` has no book or check naming `cn-lightbox`. | OPEN — the root declaration feeds a genuine, still-live production surface (the unmigrated Cyan lightbox), so it isn't compat-only or dead, but it also has no design-system specification or component scope to move into yet. Ask whether to leave it in semantic.css until CnLightbox ships, or carry it as a temporary migration-bridge declaration alongside `cyan-elements.css`. |
| `--cn-lightbox-color` | OPEN | undetermined | Same evidence as `--cn-lightbox-background` (`cyan-elements.css:16`). | Same open question. |
| `--cn-loader-color` | custom | CnLoader component token file | CnLoader.svelte only; CnLoader spec Definition of Done: "Tokens `--cn-loader-size`, `--cn-loader-line-width`, and `--cn-loader-color` are declared on `:root` with `light-dark()` values." | T0.5 — the spec explicitly requires public `:root` declaration as part of its contract, the clearest customization-surface statement in this set; keep the public name, move the declaration into CnLoader's own token stylesheet per the plan's component-carrier model. |
| `--cn-avatar-backdrop-from` | private | CnAvatar.svelte (private name) | CnAvatar.svelte only (`background: linear-gradient(..., var(--cn-avatar-backdrop-from), ...)`); identity-mark spec does not name this token or declare a customization surface. | — |
| `--cn-avatar-backdrop-to` | private | CnAvatar.svelte (private name) | Same as `--cn-avatar-backdrop-from`. | — |
| `--cn-on-avatar` | private | CnAvatar.svelte (private name) | CnAvatar.svelte only (`color: var(--cn-on-avatar)`); no spec customization declared. | — |

## OPEN questions

1. **`--cn-color-love`** — CnReactionButton's approved spec names this exact
   custom-property in prose describing its pressed-state gradient. Does citing
   the name in Blueprint prose count as declaring a customization surface (keep
   public, T0.5), or is it documentation of an internal value only (demote to a
   private CnReactionButton token)?
2. **`--cn-reply-context-bg` / `--cn-reply-context-text` / `--cn-reply-dock-bg`
   / `--cn-reply-dock-border` / `--cn-reply-dock-shadow`** — zero consumers
   anywhere in the repository and no governing spec (no reply-dock or
   reply-context capability is specified; the reply dialog itself is out of
   scope for thread-presentation). Delete now as dead v20-copied vocabulary, or
   retain privately as scaffolding for a future, not-yet-specified reply-dock
   capability?
3. **`--cn-input` / `--cn-on-input`** — one real current capability
   (Pelilauta's CodeMirror editor theme, both directly and through the compat
   `--color-input`/`--color-field` chain) and no governing Input/Forms spec
   (the prior `plans/forms-and-feedback.md` was removed with no successor spec
   found). Keep shared in `semantic.css` on the expectation that native form
   controls will need the same role, or scope it private to the CodeMirror
   editor until a Forms specification exists?
4. **`--cn-lightbox-background` / `--cn-lightbox-color`** — the root
   declarations feed the still-live, unmigrated Cyan `cn-lightbox` element
   (five production consumers), overridden in `cyan-elements.css`, but no
   `CnLightbox` specification or design-system book exists yet to give them a
   component scope. Where should these live until CnLightbox ships — kept in
   `semantic.css`, or carried as a dedicated migration-bridge declaration
   alongside `cyan-elements.css`?
5. **`--cn-button-secondary-light` / `--cn-button-secondary`** and the full
   **`--cn-fab*` family** — each has exactly one production consumer file, but
   the Actions specification explicitly tables their names as each variant's
   public contract. Confirm these should be treated as declared customization
   surfaces (T0.5, public name retained in a component token file) rather than
   demoted by the plain consumer-count rule.

## Classification counts

Counted directly from the 78 table rows (one row per declaration):

- shared (→ `semantic.css`): 32
- elevation (→ `elevation.css`): 6
- component-private: 9
- component customization token (→ component token file, public name kept): 12
- compatibility-only (→ `compat/cyan-4.css` only): 10
- OPEN (undetermined): 9

Total: 78.
