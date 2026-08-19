# T0.4 input — `color-theme.css` declarations and consumer reach

Captured at tag `before/color-token-repair` (2026-08-18). 78 custom properties,
all on `:root`. Consumer counts exclude color-theme.css itself; note that
`compat/cyan-4.css` appears as a consumer of most roles — compat reach alone
does not establish shared semantic status.

## Declarations (line, name, value)

| Line(s) | Property | Value |
| --- | --- | --- |
| 3–6 | `--cn-surface` | `light-dark(var(--cn-color-surface-95), var(--cn-color-surface-20))` |
| 7–10 | `--cn-surface-1` | `light-dark(var(--cn-color-surface-100), var(--cn-color-surface-30))` |
| 11–14 | `--cn-surface-2` | `light-dark(var(--cn-color-surface-100), var(--cn-color-surface-30))` |
| 15–18 | `--cn-surface-3` | `light-dark(var(--cn-color-surface-100), var(--cn-color-surface-40))` |
| 19–22 | `--cn-surface-4` | `light-dark(var(--cn-color-primary-99), var(--cn-color-primary-40))` |
| 23–26 | `--cn-on-surface` | `light-dark(var(--cn-color-surface-10), var(--cn-color-surface-90))` |
| 27–30 | `--cn-on-surface-secondary` | `light-dark(var(--cn-color-surface-40), var(--cn-color-surface-60))` |
| 31 | `--cn-background` | `var(--cn-surface)` |
| 32 | `--cn-on-background` | `var(--cn-on-surface)` |
| 34 | `--cn-text` | `light-dark(var(--cn-color-surface-10), var(--cn-color-surface-95))` |
| 35–38 | `--cn-text-high` | `light-dark(var(--cn-color-surface-0), var(--cn-color-surface-100))` |
| 39–42 | `--cn-text-low` | `light-dark(var(--cn-color-surface-30), var(--cn-color-surface-60))` |
| 43–46 | `--cn-text-heading` | `light-dark(var(--cn-color-surface-30), var(--cn-color-surface-99))` |
| 47–50 | `--cn-text-subheading` | `light-dark(var(--cn-color-surface-40), var(--cn-color-surface-80))` |
| 52 | `--cn-link` | `light-dark(var(--cn-color-primary-40), var(--cn-color-surface-80))` |
| 53–56 | `--cn-link-hover` | `light-dark(var(--cn-color-surface-50), var(--cn-color-primary-80))` |
| 57–60 | `--cn-link-active` | `light-dark(var(--cn-color-primary-30), var(--cn-color-surface-70))` |
| 62–65 | `--cn-button` | `light-dark(var(--cn-color-surface-50), var(--cn-color-surface-40))` |
| 66 | `--cn-button-light` | `var(--cn-color-primary-50)` |
| 67 | `--cn-button-cta` | `var(--cn-color-error-40)` |
| 68 | `--cn-on-button` | `var(--cn-color-surface-100)` |
| 69 | `--cn-on-button-cta` | `var(--cn-color-surface-100)` |
| 75 | `--cn-button-text` | `color-mix(in oklab, var(--cn-button) 33%, transparent)` |
| 77–80 | `--cn-button-secondary-light` | `light-dark(var(--cn-color-primary-40), var(--cn-color-primary-80))` |
| 81–84 | `--cn-button-secondary` | `light-dark(var(--cn-color-primary-60), var(--cn-color-primary-95))` |
| 85 | `--cn-fab` | `var(--cn-color-primary-70)` |
| 86 | `--cn-fab-blend` | `var(--cn-color-surface-50)` |
| 87 | `--cn-on-fab` | `var(--cn-color-surface-100)` |
| 88 | `--cn-fab-cta` | `var(--cn-color-error-60)` |
| 89 | `--cn-fab-cta-blend` | `var(--cn-color-surface-50)` |
| 90 | `--cn-on-fab-cta` | `var(--cn-color-surface-100)` |
| 92 | `--cn-fab-secondary` | `var(--cn-button)` |
| 93–97 | `--cn-fab-secondary-blend` | `color-mix(in oklch, var(--cn-button), var(--cn-on-surface) 22%)` |
| 98 | `--cn-on-fab-secondary` | `var(--cn-on-button)` |
| 99–102 | `--cn-hover` | `light-dark(color-mix(in oklch, var(--cn-color-surface-50), transparent 90%), color-mix(in oklch, var(--cn-color-surface-50), transparent 33%))` |
| 103–106 | `--cn-active` | `light-dark(color-mix(in oklch, var(--cn-color-surface-50), transparent 33%), color-mix(in oklch, var(--cn-color-surface-50), transparent 70%))` |
| 136–139 | `--cn-indicator` | `light-dark(color-mix(in oklch, var(--cn-color-surface-100), transparent 33%), color-mix(in oklch, var(--cn-color-surface-30), transparent 33%))` |
| 140 | `--cn-on-indicator` | `var(--cn-text-high)` |
| 150–154 | `--cn-surface-over-poster` | `color-mix(in oklch, var(--cn-surface), transparent 20%)` |
| 160–163 | `--cn-scrim` | `light-dark(color-mix(in oklch, var(--cn-color-surface-10), transparent 45%), color-mix(in oklch, var(--cn-color-surface-10), transparent 30%))` |
| 164–167 | `--cn-focus-ring` | `light-dark(var(--cn-color-primary-60), var(--cn-color-primary-40))` |
| 169–172 | `--cn-border` | `light-dark(var(--cn-color-surface-70), var(--cn-color-surface-30))` |
| 173–176 | `--cn-border-hover` | `light-dark(var(--cn-color-surface-50), var(--cn-color-surface-40))` |
| 177–180 | `--cn-border-focus` | `light-dark(var(--cn-color-primary-70), var(--cn-color-primary-40))` |
| 182 | `--cn-color-success` | `var(--cn-color-primary-60)` |
| 183–186 | `--cn-color-warning` | `light-dark(var(--cn-color-warning-40), var(--cn-color-warning-60))` |
| 187–190 | `--cn-color-error` | `light-dark(var(--cn-color-error-40), var(--cn-color-error-60))` |
| 191–194 | `--cn-color-info` | `light-dark(var(--cn-color-primary-50), var(--cn-color-primary-90))` |
| 195 | `--cn-color-love` | `light-dark(var(--cn-color-love-40), var(--cn-color-love-60))` |
| 197–200 | `--cn-bubble` | `light-dark(var(--cn-color-surface-90), var(--cn-color-surface-30))` |
| 201–204 | `--cn-on-bubble` | `light-dark(var(--cn-color-surface-20), var(--cn-color-surface-95))` |
| 205–208 | `--cn-reply-bubble` | `light-dark(var(--cn-color-primary-70), var(--cn-color-primary-40))` |
| 209–212 | `--cn-on-reply-bubble` | `light-dark(var(--cn-color-surface-20), var(--cn-color-surface-95))` |
| 213–216 | `--cn-reply-context-bg` | `light-dark(var(--cn-color-primary-90), var(--cn-color-primary-20))` |
| 217–220 | `--cn-reply-context-text` | `light-dark(var(--cn-color-primary-20), var(--cn-color-primary-90))` |
| 221–224 | `--cn-reply-dock-bg` | `light-dark(var(--cn-color-surface-100), var(--cn-color-surface-20))` |
| 225–228 | `--cn-reply-dock-border` | `light-dark(var(--cn-color-surface-80), var(--cn-color-surface-30))` |
| 230 | `--cn-input` | `light-dark(var(--cn-color-surface-80), var(--cn-color-surface-0))` |
| 231 | `--cn-on-input` | `var(--cn-on-surface)` |
| 232–235 | `--cn-input-hover` | `light-dark(var(--cn-color-surface-70), var(--cn-color-surface-0))` |
| 236–239 | `--cn-input-focus` | `light-dark(var(--cn-color-surface-70), var(--cn-color-surface-0))` |
| 240–243 | `--cn-input-disabled` | `light-dark(var(--cn-color-surface-80), var(--cn-color-surface-20))` |
| 245–248 | `--cn-shadow-color` | `light-dark(var(--cn-color-surface-30), var(--cn-color-surface-0))` |
| 249–251 | `--cn-shadow-elevation-1` | `calc(var(--cn-grid) * 0.125) calc(var(--cn-grid) * 0.125) calc(var(--cn-grid) * 0.5) var(--cn-shadow-color)` |
| 252–253 | `--cn-shadow-elevation-2` | `calc(var(--cn-grid) * 0.25) calc(var(--cn-grid) * 0.25) var(--cn-grid) var(--cn-shadow-color)` |
| 254 | `--cn-shadow-button-hover` | `var(--cn-shadow-elevation-2)` |
| 255–256 | `--cn-shadow-elevation-3` | `calc(var(--cn-grid) * 0.5) calc(var(--cn-grid) * 0.5) calc(var(--cn-grid) * 2) var(--cn-shadow-color)` |
| 257–258 | `--cn-shadow-elevation-4` | `calc(var(--cn-grid) * 0.75) calc(var(--cn-grid) * 0.75) calc(var(--cn-grid) * 3) var(--cn-shadow-color)` |
| 259 | `--cn-reply-dock-shadow` | `var(--cn-shadow-elevation-3)` |
| 260–263 | `--cn-selection` | `light-dark(color-mix(in oklch, var(--cn-color-primary-60), transparent 70%), color-mix(in oklch, var(--cn-color-primary-40), transparent 70%))` |
| 264 | `--cn-on-selection` | `var(--cn-on-surface)` |
| 265–268 | `--cn-backdrop` | `light-dark(color-mix(in oklch, var(--cn-color-surface-0), transparent 50%), color-mix(in oklch, var(--cn-color-surface-0), transparent 30%))` |
| 269 | `--cn-lightbox-background` | `var(--cn-color-surface-30)` |
| 270 | `--cn-lightbox-color` | `var(--cn-color-surface-95)` |
| 272–275 | `--cn-loader-color` | `light-dark(var(--cn-color-primary-60), var(--cn-color-surface-60))` |
| 281–284 | `--cn-avatar-backdrop-from` | `light-dark(var(--cn-color-primary-30), var(--cn-color-primary-60))` |
| 285–288 | `--cn-avatar-backdrop-to` | `light-dark(var(--cn-color-surface-50), var(--cn-color-surface-80))` |
| 289–292 | `--cn-on-avatar` | `light-dark(var(--cn-color-surface-95), var(--cn-color-surface-10))` |

## Consumer reach (files referencing each role, excluding color-theme.css)

Compat = `styles/compat/cyan-4.css`. Consumer lists as reported by the source
sweep; production/design-site/test split matters for classification.

- `--cn-surface` (4): CnReactionButton, compat, surface.css, color-contrast test.
- `--cn-surface-1` (2): compat, surface.css.
- `--cn-surface-2` (5): SnackbarSpecimen, CnAvatar, compat, identity.css, surface.css.
- `--cn-surface-3` (2): compat, surface.css.
- `--cn-surface-4` (3): CnSnackbar, compat, surface.css.
- `--cn-on-surface` (7): chip.spec, CnAvatar, buttons.css, chip.css, compat, identity.css, menu.css.
- `--cn-on-surface-secondary` (2): compat, toggle.css.
- `--cn-background` (4): SnackbarSpecimen, compat, preflight.css, color-contrast test.
- `--cn-on-background` (1): compat only.
- `--cn-text` (4): SnackbarSpecimen, CnCard, compat, preflight.css.
- `--cn-text-high` (8): cn-card.spec, pelilauta OnboardingCallout + NotificationItem, CnCard, CnSnackbar, compat, identity.css, typography.css.
- `--cn-text-low` (7): SnackbarSpecimen, CnCard, CnReactionButton, compat, docs.css, poster-credits.css, typography.css.
- `--cn-text-heading` (3): CnCard, compat, typography.css.
- `--cn-text-subheading` (3): pelilauta CodeMirror styles, compat, typography.css.
- `--cn-link` (4): pelilauta color-theme e2e, pelilauta overrides.css, compat, links.css.
- `--cn-link-hover` (5): pelilauta CodeMirror styles, CnCard, compat, identity.css, links.css.
- `--cn-link-active` (3): compat, identity.css, links.css.
- `--cn-button` (2): buttons.css, compat.
- `--cn-button-light` (3): buttons.css, compat, toggle.css.
- `--cn-button-cta` (2): buttons.css, compat.
- `--cn-on-button` (3): chip.spec, buttons.css, compat.
- `--cn-on-button-cta` (2): buttons.css, compat.
- `--cn-button-text` (5): chip.spec, CnReactionButton, buttons.css, chip.css, toggle.css.
- `--cn-button-secondary-light` (1): buttons.css.
- `--cn-button-secondary` (1): buttons.css.
- `--cn-fab*` family (9 tokens, 1 each): fab.css only.
- `--cn-hover` (7): chrome-actions.spec, CnReactionButton, buttons.css, chip.css, chrome-actions.css, compat, menu.css.
- `--cn-active` (7): same set as `--cn-hover`.
- `--cn-indicator` (2): chrome-actions.spec, chrome-actions.css.
- `--cn-on-indicator` (3): chrome-actions.spec, chrome-actions.css, color-contrast test.
- `--cn-surface-over-poster` (1): poster.css.
- `--cn-scrim` (0): none.
- `--cn-focus-ring` (14): widest reach — buttons, chip, chrome-actions, fab, identity, links, menu, toggle, CnCard, CnReactionButton, pelilauta CodeMirror, compat, two design-site specs.
- `--cn-border` (5): pelilauta CodeMirror, LoaderSpecimens, CnCard, compat, docs.css.
- `--cn-border-hover` (1): compat only.
- `--cn-border-focus` (1): compat only.
- `--cn-color-success` (1): compat only.
- `--cn-color-warning` (2): compat, surface.css.
- `--cn-color-error` (2): CnReactionButton, compat.
- `--cn-color-info` (3): chrome-actions.css, compat, surface.css.
- `--cn-color-love` (2): CnReactionButton, compat.
- `--cn-bubble`, `--cn-on-bubble`, `--cn-reply-bubble`, `--cn-on-reply-bubble` (2 each): CnBubble, compat.
- `--cn-reply-context-bg/-text`, `--cn-reply-dock-bg/-border`, `--cn-reply-dock-shadow` (0): no consumers found — verify against the reply/thread epic before classifying.
- `--cn-input` (2): pelilauta CodeMirror, compat. `--cn-on-input` (2): same.
- `--cn-input-hover/-focus/-disabled` (1 each): compat only.
- `--cn-shadow-color` (4): CnCard, CnReactionButton, buttons.css, compat.
- `--cn-shadow-elevation-1` (3): CnAvatar, fab.css, identity.css.
- `--cn-shadow-elevation-2` (3): fab.css, identity.css, surface.css.
- `--cn-shadow-button-hover` (2): CnReactionButton, buttons.css.
- `--cn-shadow-elevation-3` (1): surface.css.
- `--cn-shadow-elevation-4` (3): CnSnackbar, fab.css, surface.css.
- `--cn-selection`, `--cn-on-selection`, `--cn-backdrop` (1 each): compat only.
- `--cn-lightbox-background`, `--cn-lightbox-color` (0): none — lightbox may consume them in apps/pelilauta by another mechanism; verify.
- `--cn-loader-color` (1): CnLoader.
- `--cn-avatar-backdrop-from/-to`, `--cn-on-avatar` (1 each): CnAvatar.

## Flags for classification (T0.4/T0.5)

- Compat-only consumers: `--cn-on-background`, `--cn-border-hover`,
  `--cn-border-focus`, `--cn-color-success`, `--cn-selection`,
  `--cn-on-selection`, `--cn-backdrop`, `--cn-input-hover/-focus/-disabled`.
- Zero consumers: `--cn-scrim`, `--cn-reply-context-*`, `--cn-reply-dock-*`,
  `--cn-lightbox-*` — check specs (Lightbox, Reply Dock, Scrim uses) before
  declaring them dead; a spec-declared customization surface overrides the
  consumer-count rule.
- Single-component families: fab (9), avatar (3), loader (1), lightbox (2) —
  prime candidates for component scope or component global-token files.
