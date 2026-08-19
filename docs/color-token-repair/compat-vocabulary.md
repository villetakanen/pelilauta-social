# Cyan 4 Compatibility Colour Vocabulary Inventory

## Part 1: Custom Property Declarations in cyan-4.css

File: `/Users/ville.takanen/dev/pelilauta-social/packages/design-system/styles/compat/cyan-4.css`

### Chroma names (lines 3-44)

| Line | Property Name | Value |
|------|---------------|-------|
| 3 | `--chroma-K-S` | `var(--cn-color-surface-100)` |
| 4 | `--chroma-S-K` | `var(--cn-color-surface-0)` |
| 5 | `--chroma-primary-10` | `var(--cn-color-primary-10)` |
| 6 | `--chroma-primary-20` | `var(--cn-color-primary-20)` |
| 7 | `--chroma-primary-30` | `var(--cn-color-primary-30)` |
| 8 | `--chroma-primary-40` | `var(--cn-color-primary-40)` |
| 9 | `--chroma-primary-50` | `var(--cn-color-primary-50)` |
| 10 | `--chroma-primary-60` | `var(--cn-color-primary-60)` |
| 11 | `--chroma-primary-70` | `var(--cn-color-primary-70)` |
| 12 | `--chroma-primary-80` | `var(--cn-color-primary-80)` |
| 13 | `--chroma-primary-90` | `var(--cn-color-primary-90)` |
| 14 | `--chroma-primary-95` | `var(--cn-color-primary-95)` |
| 15 | `--chroma-primary-99` | `var(--cn-color-primary-99)` |
| 16 | `--chroma-surface-10` | `var(--cn-color-surface-10)` |
| 17 | `--chroma-surface-20` | `var(--cn-color-surface-20)` |
| 18 | `--chroma-surface-30` | `var(--cn-color-surface-30)` |
| 19 | `--chroma-surface-40` | `var(--cn-color-surface-40)` |
| 20 | `--chroma-surface-50` | `var(--cn-color-surface-50)` |
| 21 | `--chroma-surface-60` | `var(--cn-color-surface-60)` |
| 22 | `--chroma-surface-70` | `var(--cn-color-surface-70)` |
| 23 | `--chroma-surface-80` | `var(--cn-color-surface-80)` |
| 24 | `--chroma-surface-90` | `var(--cn-color-surface-90)` |
| 25 | `--chroma-surface-95` | `var(--cn-color-surface-95)` |
| 26 | `--chroma-surface-99` | `var(--cn-color-surface-99)` |
| 27 | `--chroma-info` | `var(--cn-color-info)` |
| 28 | `--chroma-warning` | `var(--cn-color-warning)` |
| 29 | `--chroma-error` | `var(--cn-color-error)` |
| 30-34 | `--chroma-info-tint` | `color-mix(in oklch, var(--cn-color-info), transparent 90%)` |
| 35-39 | `--chroma-warning-tint` | `color-mix(in oklch, var(--cn-color-warning), transparent 90%)` |
| 40-44 | `--chroma-error-tint` | `color-mix(in oklch, var(--cn-color-error), transparent 90%)` |

### Semantic colour names (lines 47-138)

| Line | Property Name | Value |
|------|---------------|-------|
| 47 | `--color-surface` | `var(--cn-surface)` |
| 48 | `--color-surface-1` | `var(--cn-surface-1)` |
| 49 | `--color-surface-2` | `var(--cn-surface-2)` |
| 50 | `--color-surface-3` | `var(--cn-surface-3)` |
| 51 | `--color-surface-4` | `var(--cn-surface-4)` |
| 52 | `--color-surface-hover` | `var(--cn-hover)` |
| 53 | `--color-on-surface` | `var(--cn-on-surface)` |
| 54 | `--color-on-surface-secondary` | `var(--cn-on-surface-secondary)` |
| 57 | `--color-on-primary` | `var(--cn-on-button)` |
| 58 | `--color-secondary` | `var(--cn-surface-4)` |
| 59 | `--color-secondary-1` | `var(--cn-surface-3)` |
| 60 | `--color-on-secondary` | `var(--cn-text-high)` |
| 61 | `--color-background` | `var(--cn-background)` |
| 62 | `--color-on-background` | `var(--cn-on-background)` |
| 63 | `--color-text` | `var(--cn-text)` |
| 64 | `--color-text-primary` | `var(--cn-text)` |
| 65 | `--color-text-secondary` | `var(--cn-text-low)` |
| 66 | `--color-text-high` | `var(--cn-text-high)` |
| 67 | `--color-text-low` | `var(--cn-text-low)` |
| 68 | `--color-text-low-emphasis` | `var(--cn-text-low)` |
| 69 | `--color-heading-1` | `var(--cn-text-heading)` |
| 70 | `--color-heading-2` | `var(--cn-text-subheading)` |
| 71 | `--color-link` | `var(--cn-link)` |
| 72 | `--color-link-hover` | `var(--cn-link-hover)` |
| 73 | `--color-link-active` | `var(--cn-link-active)` |
| 74 | `--color-on-rail-button` | `var(--cn-on-surface-secondary)` |
| 75 | `--color-alert` | `var(--cn-color-warning)` |
| 76 | `--color-on-alert` | `var(--cn-on-surface)` |
| 77 | `--color-notify` | `var(--cn-color-warning)` |
| 78 | `--color-on-notify` | `var(--cn-on-surface)` |
| 79 | `--color-code` | `var(--cn-input)` |
| 80 | `--color-on-code` | `var(--cn-on-input)` |
| 81 | `--color-on-code-strong` | `var(--cn-link-hover)` |
| 82 | `--color-on-code-emphasis` | `var(--cn-text-subheading)` |
| 83 | `--color-focus` | `var(--cn-focus-ring)` |
| 84 | `--color-on-focus` | `var(--cn-on-button)` |
| 85 | `--color-primary` | `var(--cn-link)` |
| 86 | `--color-primary-low` | `color-mix(in oklch, var(--cn-link), transparent 80%)` |
| 87 | `--color-reaction-red` | `var(--cn-color-love)` |
| 88 | `--color-hover` | `var(--cn-hover)` |
| 89 | `--color-button` | `var(--cn-button)` |
| 90 | `--color-button-light` | `var(--cn-button-light)` |
| 91 | `--color-button-accent` | `var(--cn-color-primary-70)` |
| 92 | `--color-button-cta` | `var(--cn-button-cta)` |
| 93 | `--color-on-button` | `var(--cn-on-button)` |
| 94 | `--color-on-button-cta` | `var(--cn-on-button-cta)` |
| 95 | `--color-button-disabled` | `var(--cn-text-low)` |
| 96 | `--color-button-text` | `color-mix(in oklch, var(--cn-link), transparent 90%)` |
| 97-101 | `--color-button-text-hover` | `color-mix(in oklch, var(--cn-link), transparent 80%)` |
| 102-106 | `--color-button-text-active` | `color-mix(in oklch, var(--cn-link), transparent 70%)` |
| 107 | `--color-on-toggle-button` | `var(--cn-on-button)` |
| 108 | `--color-on-toggle-button-off` | `var(--cn-on-surface-secondary)` |
| 109 | `--color-border` | `var(--cn-border)` |
| 110 | `--color-border-subtle` | `var(--cn-border)` |
| 111 | `--color-border-hover` | `var(--cn-border-hover)` |
| 112 | `--color-border-focus` | `var(--cn-border-focus)` |
| 113 | `--color-selection` | `var(--cn-selection)` |
| 114 | `--color-on-selection` | `var(--cn-on-selection)` |
| 115 | `--color-success` | `var(--cn-color-success)` |
| 116 | `--color-warning` | `var(--cn-color-warning)` |
| 117 | `--color-error` | `var(--cn-color-error)` |
| 118 | `--color-info` | `var(--cn-color-info)` |
| 119 | `--color-shadow` | `var(--cn-shadow-color)` |
| 120 | `--color-elevation-1` | `var(--cn-surface-1)` |
| 121 | `--color-elevation-2` | `var(--cn-surface-2)` |
| 122 | `--color-elevation-3` | `var(--cn-surface-3)` |
| 123 | `--color-input` | `var(--cn-input)` |
| 124 | `--color-on-input` | `var(--cn-on-input)` |
| 125 | `--color-input-hover` | `var(--cn-input-hover)` |
| 126 | `--color-input-focus` | `var(--cn-input-focus)` |
| 127 | `--color-input-disabled` | `var(--cn-input-disabled)` |
| 128 | `--color-halo` | `var(--cn-focus-ring)` |
| 129 | `--color-on-label` | `var(--cn-on-surface)` |
| 130 | `--color-field` | `var(--cn-input)` |
| 131 | `--color-on-field` | `var(--cn-on-input)` |
| 132 | `--color-on-field-placeholder` | `var(--cn-on-surface-secondary)` |
| 133 | `--color-field-hover` | `var(--cn-input-hover)` |
| 134 | `--color-on-field-hover` | `var(--cn-on-input)` |
| 135 | `--color-field-focus` | `var(--cn-input-focus)` |
| 136 | `--color-bubble` | `var(--cn-bubble)` |
| 137 | `--color-on-bubble` | `var(--cn-on-bubble)` |
| 138 | `--color-reply-bubble` | `var(--cn-reply-bubble)` |
| 139 | `--color-on-reply-bubble` | `var(--cn-on-reply-bubble)` |
| 140-144 | `--color-scrollbar-thumb` | `color-mix(in oklch, var(--cn-text-low), transparent 50%)` |
| 145-149 | `--color-scrollbar-thumb-hover` | `color-mix(in oklch, var(--cn-text-low), transparent 30%)` |

### Older cn-color names (lines 152-179)

| Line | Property Name | Value |
|------|---------------|-------|
| 152 | `--cn-color-primary` | `var(--cn-color-primary-70)` |
| 153 | `--cn-color-primary-variant` | `var(--cn-color-primary-80)` |
| 154 | `--cn-color-on-primary` | `var(--cn-on-button)` |
| 155 | `--cn-color-secondary` | `var(--cn-surface-4)` |
| 156 | `--cn-color-secondary-variant` | `var(--cn-surface-3)` |
| 157 | `--cn-color-on-secondary` | `var(--cn-on-surface)` |
| 158 | `--cn-color-surface` | `var(--cn-surface)` |
| 159 | `--cn-color-surface-variant` | `var(--cn-surface-1)` |
| 160 | `--cn-color-on-surface` | `var(--cn-on-surface)` |
| 161 | `--cn-color-on-surface-variant` | `var(--cn-on-surface-secondary)` |
| 162 | `--cn-color-background` | `var(--cn-background)` |
| 163 | `--cn-color-on-background` | `var(--cn-on-background)` |
| 164 | `--cn-color-hover` | `var(--cn-hover)` |
| 165 | `--cn-color-focus` | `var(--cn-focus-ring)` |
| 166 | `--cn-color-active` | `var(--cn-active)` |
| 167 | `--cn-color-on-field-active` | `var(--cn-on-button)` |
| 168 | `--cn-color-on-button-hover` | `var(--cn-on-button)` |
| 169 | `--cn-color-on-button-active` | `var(--cn-on-button)` |
| 170 | `--cn-color-text-secondary` | `var(--cn-text-low)` |
| 171 | `--cn-color-avatar-1` | `var(--cn-surface-4)` |
| 172 | `--cn-color-avatar-2` | `var(--cn-color-primary-50)` |
| 173-177 | `--cn-color-error-bg` | `color-mix(in oklch, var(--cn-color-error), transparent 85%)` |
| 178 | `--cn-color-status-error` | `var(--cn-color-error)` |
| 179 | `--cn-color-on-status-error` | `var(--cn-on-button)` |

### Background and other properties (lines 181-198)

| Line | Property Name | Value |
|------|---------------|-------|
| 181 | `--background-dialog-backdrop` | `var(--cn-backdrop)` |
| 182-186 | `--background-alert-tint` | `color-mix(in oklch, var(--cn-color-warning), transparent 90%)` |
| 187-191 | `--background-button` | `linear-gradient(120deg, var(--cn-button-light), var(--cn-button))` |
| 192 | `--background-button-hover` | `var(--cn-hover)` |
| 193 | `--background-button-active` | `var(--cn-active)` |
| 194 | `--background-toggle-button` | `var(--cn-button)` |
| 195 | `--background-toggle-button-off` | `var(--cn-surface-4)` |
| 196 | `--background-mobile-nav-bar` | `var(--cn-surface)` |
| 197 | `--background-editor` | `var(--cn-input)` |
| 198 | `--cn-input-border` | `1px solid var(--cn-border)` |

---

## Part 2: Consumers of Declared Properties (var() references)

### --chroma-primary-* properties

**--chroma-primary-10**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-primary-20**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-primary-30**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:357 `--color-caret: light-dark(var(--chroma-primary-90), var(--chroma-primary-30))`

**--chroma-primary-40**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:361-362 (color-mix formula) `var(--chroma-primary-40)`

**--chroma-primary-50**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-primary-60**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-primary-70**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-primary-80**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:361 `var(--chroma-primary-80)`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:369 `var(--chroma-primary-80)`

**--chroma-primary-90**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:357 `--color-caret: light-dark(var(--chroma-primary-90), var(--chroma-primary-30))`

**--chroma-primary-95**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-primary-99**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:372 `--color-code: light-dark(var(--chroma-primary-10), var(--chroma-primary-99))`

### --chroma-surface-* properties

**--chroma-surface-10**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-20**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-30**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-40**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:365-366 `var(--chroma-surface-40)`

**--chroma-surface-50**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-60**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-70**
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:365 `var(--chroma-surface-70)`

**--chroma-surface-80**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-90**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-95**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-surface-99**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

### --chroma-* tint and other properties

**--chroma-K-S**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-S-K**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-info**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-warning**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-error**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-info-tint**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-warning-tint**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--chroma-error-tint**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

### --color-* properties

**--color-surface**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:236 `background: var(--color-surface);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:289 `background: var(--color-surface);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:313 `background: var(--color-surface);`

**--color-surface-1**
- apps/pelilauta/src/overrides.css:4 `--cn-story-clock-slice-color: var(--color-surface-1);`

**--color-surface-2**
- apps/pelilauta/src/styles/migrations/cyan-elements.css:15 `--cn-lightbox-background: var(--color-surface-2);`

**--color-surface-3**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-surface-4**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-surface-hover**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:245 `background: var(--color-surface-hover);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:358 `background: var(--color-surface-hover);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:362 `background: var(--color-surface-hover);`

**--color-on-surface**
- apps/pelilauta/src/styles/migrations/cyan-elements.css:16 `--cn-lightbox-color: var(--color-on-surface);`

**--color-on-surface-secondary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-primary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-secondary**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:116 `backgroundColor: 'var(--color-secondary)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:251 `backgroundColor: 'var(--color-secondary)',`

**--color-secondary-1**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-secondary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-background**
- apps/pelilauta/src/overrides.css:7 `text-shadow: 1px 1px 12px var(--color-background);`

**--color-on-background**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-text**
- apps/pelilauta/docs/pbi/041-styling-guide.md:250 (prose) `var(--color-text)`

**--color-text-primary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-text-secondary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-text-high**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-text-low**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:277 `color: var(--color-text-low);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:381 `color: var(--color-text-low);`

**--color-text-low-emphasis**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-heading-1**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:129 `color: 'var(--color-heading-1)',`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:136 `color: 'var(--color-heading-1)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:264 `color: 'var(--color-heading-1)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:271 `color: 'var(--color-heading-1)',`

**--color-heading-2**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:143 `color: 'var(--color-heading-2)',`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:150 `color: 'var(--color-heading-2)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:278 `color: 'var(--color-heading-2)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:285 `color: 'var(--color-heading-2)',`

**--color-link**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-link-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-link-active**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-rail-button**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-alert**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-alert**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-notify**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-notify**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-code**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:164 `backgroundColor: 'var(--color-code)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:299 `backgroundColor: 'var(--color-code)',`

**--color-on-code**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:163 `color: 'var(--color-on-code)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:298 `color: 'var(--color-on-code)',`

**--color-on-code-strong**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:154 `color: 'var(--color-on-code-strong)'`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:289 `color: 'var(--color-on-code-strong)'`

**--color-on-code-emphasis**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:158 `color: 'var(--color-on-code-emphasis)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:293 `color: 'var(--color-on-code-emphasis)',`

**--color-focus**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:250 `outline: 2px solid var(--color-focus);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:318 `outline: 2px solid var(--color-focus);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:363 `outline: 2px solid var(--color-focus);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:374 `outline: 2px solid var(--color-focus);`

**--color-on-focus**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-primary**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:252 `border-color: var(--color-primary);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:320 `border-color: var(--color-primary);`
- apps/pelilauta/docs/pbi/closed/034-accessibility-and-best-practices-fixes.md:240 `background: var(--color-primary);`

**--color-primary-low**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:368 `background: var(--color-primary-low);`

**--color-reaction-red**
- apps/pelilauta/src/styles/migrations/cyan-elements.css:27 `var(--color-reaction-red) 11%,`

**--color-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-button**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-button-light**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-button-accent**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-button-cta**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-button**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:95 `color: 'var(--color-on-button)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:230 `color: 'var(--color-on-button)',`

**--color-on-button-cta**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-button-disabled**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-button-text**
- apps/pelilauta/src/styles/migrations/cyan-elements.css:23 `--background-reaction-button: var(--color-button-text);`

**--color-button-text-hover**
- apps/pelilauta/src/styles/migrations/cyan-elements.css:24 `--background-reaction-button-hover: var(--color-button-text-hover);`

**--color-button-text-active**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-toggle-button**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-toggle-button-off**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-border**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:237 `border: 1px solid var(--color-border);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:290 `border: 1px solid var(--color-border);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:305 `border-bottom: 1px solid var(--color-border);`
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:311 `border: 1px solid var(--color-border);`
- apps/pelilauta/src/overrides.css:2 `--cn-story-clock-border-color: var(--color-border);`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:96 `borderRight: '1px solid var(--color-border, #ddd)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:231 `borderRight: '1px solid var(--color-border, #ddd)',`

**--color-border-subtle**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-border-hover**
- apps/pelilauta/src/components/svelte/ui/NounSelect.svelte:246 `border-color: var(--color-border-hover);`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:56 `borderBottomColor: 'var(--color-border-hover)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:191 `borderBottomColor: 'var(--color-border-hover)',`

**--color-border-focus**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:62 `borderBottomColor: 'var(--color-border-focus)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:197 `borderBottomColor: 'var(--color-border-focus)',`

**--color-selection**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:73 `background: 'var(--color-selection) !important',`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:77 `background: 'var(--color-selection) !important',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:208 `background: 'var(--color-selection) !important',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:212 `background: 'var(--color-selection) !important',`

**--color-on-selection**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:81 `color: 'var(--color-on-selection) !important',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:216 `color: 'var(--color-on-selection) !important',`

**--color-success**
- apps/pelilauta/src/components/svelte/admin/SentryTestButton.svelte:77 `color: var(--color-success);`

**--color-warning**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-error**
- apps/pelilauta/src/styles/migrations/cyan-elements.css:28 `var(--color-error) 90%`
- apps/pelilauta/src/components/svelte/admin/SentryTestButton.svelte:81 `color: var(--color-error);`

**--color-info**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-shadow**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-elevation-1**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:94 `'var(--color-elevation-1, var(--background-editor, black))',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:229 `'var(--color-elevation-1, var(--background-editor, black))',`

**--color-elevation-2**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:103 `'var(--color-elevation-2, var(--background-editor, black))',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:238 `'var(--color-elevation-2, var(--background-editor, black))',`

**--color-elevation-3**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:108 `'var(--color-elevation-3, var(--background-editor, black))',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:243 `'var(--color-elevation-3, var(--background-editor, black))',`

**--color-input**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:23 `background: 'var(--color-input, black)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:158 `background: 'var(--color-input, black)',`

**--color-on-input**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-input-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-input-focus**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-input-disabled**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-halo**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-label**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-field**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-field**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:45 `color: 'var(--color-on-field)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:180 `color: 'var(--color-on-field)',`

**--color-on-field-placeholder**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:68 `color: 'var(--color-on-field-placeholder)',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:203 `color: 'var(--color-on-field-placeholder)',`

**--color-field-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-field-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-field-focus**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-bubble**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-bubble**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-reply-bubble**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-on-reply-bubble**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-scrollbar-thumb**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--color-scrollbar-thumb-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

### --background-* properties

**--background-dialog-backdrop**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-alert-tint**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-button**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-button-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-button-active**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-toggle-button**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-toggle-button-off**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-mobile-nav-bar**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--background-editor**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:94 `'var(--color-elevation-1, var(--background-editor, black))',`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:103 `'var(--color-elevation-2, var(--background-editor, black))',`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:108 `'var(--color-elevation-3, var(--background-editor, black))',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:229 `'var(--color-elevation-1, var(--background-editor, black))',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:238 `'var(--color-elevation-2, var(--background-editor, black))',`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:243 `'var(--color-elevation-3, var(--background-editor, black))',`

### --cn-color-* properties (compatibility aliases)

**--cn-color-primary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-primary-variant**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-primary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-secondary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-secondary-variant**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-secondary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-surface**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-surface-variant**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-surface**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-surface-variant**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-background**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-background**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-focus**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-active**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-field-active**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-button-hover**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-button-active**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-text-secondary**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-avatar-1**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-avatar-2**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-error-bg**
- apps/pelilauta/src/components/svelte/discussion/ReplyDialog.svelte:24 `background: var(--cn-color-error-bg, #fee);`
- apps/pelilauta/src/components/svelte/discussion/EditReplyDialog.svelte:57 `style="background: var(--cn-color-error-bg, #fee); color: var(--cn-color-error, #c00); padding: var(--cn-grid); border-radius: var(--cn-border-radius); margin-bottom: var(--cn-gap);"`

**--cn-color-status-error**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

**--cn-color-on-status-error**
- NO CONSUMERS OUTSIDE CYAN-4.CSS

### --cn-input-border property

**--cn-input-border**
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/cnEditorTheme.ts:31 `borderBottom: 'var(--cn-input-border)',`
- apps/pelilauta/src/components/svelte/CodeMirrorEditor/styles.css:3 `--_cn-editor-border-bottom: var(--cn-border);`
- apps/pelilauta/docs/pbi/closed/029-migrate-codemirror-from-lit-to-svelte.md:162 `borderBottom: 'var(--cn-input-border)',`

---

## Part 3: Other Custom Property Declarations (--chroma-, --color-, --background- patterns) Outside cyan-4.css

### Files with --color-* declarations:

1. **apps/pelilauta/src/components/svelte/CodeMirrorEditor/styles.css**
   - Line 3: `--color-caret: var(--cn-focus-ring);`
   - Line 4: `--color-on-code-strong: var(--cn-link-hover);`
   - Line 5: `--color-on-code-emphasis: var(--cn-text-subheading);`
   - Line 6: `--color-on-code: var(--cn-on-input);`
   - Line 7: `--color-code: var(--cn-input);`

2. **apps/pelilauta/src/styles/migrations/cyan-elements.css**
   - Line 23: `--background-reaction-button: var(--color-button-text);`
   - Line 24: `--background-reaction-button-hover: var(--color-button-text-hover);`
   - Line 25-29: `--background-reaction-button-active: linear-gradient(...)` (with `var(--color-reaction-red)` and `var(--color-error)`)
   - Line 30: `--color-reaction-button: var(--color-text-low);`
   - Line 31: `--color-reaction-button-active: var(--color-surface);`

---

## Summary Statistics

- **Total properties declared in cyan-4.css:** 105
  - `--chroma-*`: 32
  - `--color-*`: 59
  - `--background-*`: 8
  - `--cn-*` (compatibility aliases): 19
  - Other: 1 (`--cn-input-border`)

- **Declarations outside cyan-4.css:** 9 total
  - In `apps/pelilauta/src/components/svelte/CodeMirrorEditor/styles.css`: 5
  - In `apps/pelilauta/src/styles/migrations/cyan-elements.css`: 4

- **Unconsumed properties (NO consumer references outside cyan-4.css):**
  - `--chroma-K-S`
  - `--chroma-S-K`
  - `--chroma-primary-10`, `--chroma-primary-20`, `--chroma-primary-50`, `--chroma-primary-60`, `--chroma-primary-70`, `--chroma-primary-95`
  - `--chroma-surface-10`, `--chroma-surface-20`, `--chroma-surface-30`, `--chroma-surface-50`, `--chroma-surface-60`, `--chroma-surface-80`, `--chroma-surface-90`, `--chroma-surface-95`, `--chroma-surface-99`
  - `--chroma-info`, `--chroma-warning`, `--chroma-error`
  - `--chroma-info-tint`, `--chroma-warning-tint`, `--chroma-error-tint`
  - `--color-surface-3`, `--color-surface-4`, `--color-on-surface-secondary`, `--color-on-primary`, `--color-secondary-1`, `--color-on-secondary`, `--color-on-background`, `--color-text-primary`, `--color-text-secondary`, `--color-text-high`, `--color-text-low-emphasis`, `--color-link`, `--color-link-hover`, `--color-link-active`, `--color-on-rail-button`, `--color-alert`, `--color-on-alert`, `--color-notify`, `--color-on-notify`, `--color-on-focus`, `--color-hover`, `--color-button`, `--color-button-light`, `--color-button-accent`, `--color-button-cta`, `--color-on-button-cta`, `--color-button-disabled`, `--color-button-text-active`, `--color-on-toggle-button`, `--color-on-toggle-button-off`, `--color-border-subtle`, `--color-warning`, `--color-info`, `--color-shadow`, `--color-on-input`, `--color-input-hover`, `--color-input-focus`, `--color-input-disabled`, `--color-halo`, `--color-on-label`, `--color-field`, `--color-on-field-hover`, `--color-field-focus`, `--color-bubble`, `--color-on-bubble`, `--color-reply-bubble`, `--color-on-reply-bubble`, `--color-scrollbar-thumb`, `--color-scrollbar-thumb-hover`
  - All `--cn-color-*` compatibility aliases
  - `--background-dialog-backdrop`, `--background-alert-tint`, `--background-button`, `--background-button-hover`, `--background-button-active`, `--background-toggle-button`, `--background-toggle-button-off`, `--background-mobile-nav-bar`

- **Most-consumed properties:**
  - `--color-border`: 7 references
  - `--color-heading-1`: 4 references
  - `--color-heading-2`: 4 references
  - `--color-elevation-1`, `--color-elevation-2`, `--color-elevation-3`: 6 references (combined)
  - `--color-selection`: 4 references
  - `--background-editor`: 6 references
