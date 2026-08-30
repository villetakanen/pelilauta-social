---
status: live
---

# Clock

## Blueprint

### Context

Game masters, players and viewers track obstacles, countdowns and faction goals during play. Participants step a segmented circular dial forward or backward, while viewers observe the current stage without editing controls.

### Architecture

Clock is an interactive Svelte design-system extension located in `packages/clock`, exporting `CnClock.svelte`. It renders SVG radial slices within a 1:1 aspect square box.

The component accepts a slice definition through the `ticks` prop — an integer slice count, an array of relative slice weights, or an array of slice descriptor objects — and a bindable `value` representing completed progress. The `view` prop selects between an interactive slider and a static visual presentation.

Clock consumes design-system tokens: `--cn-color-surface` for uncompleted slices, `--cn-color-info` for completed slices, the `--cn-color-field-border` family for dividing strokes and the outer perimeter, and `--cn-color-focus-ring` for keyboard focus indication.

### Documentation

- `apps/design/src/content/extensions/clock.mdx`

### Constraints

The circular dial divides into slices proportional to the declared weights, beginning at 12 o'clock (-90 degrees) and proceeding clockwise. The `ticks` prop accepts:
- A positive integer count of at least 2, generating equal slices.
- An array of positive numbers representing relative slice weights.
- An array of slice descriptor objects (`{ weight?: number; label?: string }`).

If `ticks` is omitted, empty, or has a total weight of zero, Clock defaults to 4 equal slices.

The total slice count is the length of the normalized slice array (or the integer count). Setting `value` casts the input using `Math.trunc`. A value that is not finite (`Number.isFinite`) resolves to `0`. Below `0` clamps to `0`; above the total slice count clamps to the total slice count. `value` supports two-way binding (`bind:value`).

The announced step text resolves from the active slice's declared `label`. When omitted, it defaults to the language-neutral fraction `"{value}/{totalSlices}"` (e.g. `0/4`, `1/4`, `4/11`).

A completed slice takes `--cn-color-info` and an uncompleted slice takes `--cn-color-surface`. In the default theme this maintains an opaque lightness separation of at least ΔL 0.40 between filled and unfilled slices in both light and dark colour schemes (ΔL 0.45 in light mode, ΔL 0.70 in dark mode). Dividing lines and the perimeter stroke take `--cn-color-field-border`, moving to `--cn-color-field-border-hover` and `--cn-color-field-border-focus` in interactive mode.

The component maintains a fixed box dimension of `6rem` (96px, 12 grid units) and an `aspect-ratio: 1`.

`view={true}` selects presentation mode and takes precedence over `disabled`.

In view-only mode (`view={true}`):
- The element declares `role="img"` with `aria-label="{label}: {stepText}"`.
- The element takes no tab index, ignores pointer and keyboard interactions, and renders no form input.

In interactive mode (`view` is false and `disabled` is false):
- The host element is focusable (`tabindex="0"`) and declares `role="slider"`.
- It announces `aria-label={label}`, `aria-valuemin="0"`, `aria-valuemax={totalSlices}`, `aria-valuenow={value}`, and `aria-valuetext` holding the resolved step text.
- An increment or decrement that leaves the valid range flips to the opposite end across all inputs and both directions.
- Pointer click or tap increments `value` by 1.
- Shift-click or long-press (500ms hold) decrements `value` by 1.
- Pressing `ArrowUp`, `ArrowRight`, `Enter`, or `Space` increments `value` by 1.
- Pressing `ArrowDown`, `ArrowLeft`, or `Shift+Enter` decrements `value` by 1.
- Pressing `Home` sets `value` to `0`; pressing `End` sets `value` to the total slice count.
- Every value change updates `value` and calls the `onchange` prop with `{ value }`.
- Given a `name` prop, the component renders a hidden input with the current `value` for `FormData` submission.

In disabled mode (`view` is false and `disabled={true}`):
- The host element remains focusable (`tabindex="0"`), retains `role="slider"`, and announces `aria-disabled="true"`.
- It announces `aria-label={label}`, `aria-valuemin="0"`, `aria-valuemax={totalSlices}`, `aria-valuenow={value}`, and `aria-valuetext`.
- The host dims by `--cn-disabled-opacity` with pointer events disabled (`pointer-events: none`).
- It ignores all keyboard inputs, triggers no state changes, never calls `onchange`, and submits nothing into `FormData`.

## Contract

### Definition of Done

- Clock renders SVG radial slices matching the exact number and proportional weights of the declared ticks.
- Clock fills slices from index `0` through `value - 1` with `--cn-color-info`, leaving subsequent slices in `--cn-color-surface`.
- Slices separate with a `--cn-color-field-border` stroke, taking the hover and focus shades of that family in interactive mode.
- Completed slices separate from uncompleted slices by at least ΔL 0.40 in both light and dark colour schemes in the default theme.
- Interactive mode updates the visible filled slices on click, tap, long-press, or arrow keys, wraps at boundaries in both directions, updates bound `value`, and calls `onchange`.
- View-only mode renders the current stage statically with `role="img"` and no interactive roles or focusability, taking precedence over `disabled`.
- Disabled mode renders a focusable, inert slider with `aria-disabled="true"` that submits nothing to `FormData`.
- Setting `value` to float or non-finite inputs resolves safely without NaN geometry in SVG output.
- Announced step text reflects the custom step label when provided, defaulting to language-neutral numerals `"{value}/{totalSlices}"`.
- The Clock book demonstrates equal slices (4, 6, 8), custom-weighted slices, custom step labels, empty, partial, and full stages, view-only mode, disabled state, and interactive state in both light and dark themes.

### Regression Guardrails

- Clock references only declared `--cn-*` tokens for fills, borders, info states, and focus rings.
- `packages/clock/test/contrast.test.ts` asserts that `--cn-color-info` and `--cn-color-surface` maintain at least ΔL 0.40 lightness separation in both light and dark schemes in the default theme.
- Interactive mode declares `role="slider"`, `tabindex="0"`, `aria-label`, `aria-valuemin="0"`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`.
- Disabled mode declares `role="slider"`, `tabindex="0"`, and `aria-disabled="true"`, remaining inert to all pointer and keyboard events.
- View-only mode declares `role="img"` with an `aria-label` describing the clock label and current step text, taking precedence over `disabled`.
- Slices render valid SVG path geometry across all positive tick counts and weights without NaN attributes or rendering exceptions.

### Scenarios

```gherkin
Given a Clock with 4 equal ticks, label "Alarm", and value 0
When it renders in interactive mode
Then all 4 slices show the uncompleted surface fill
And its accessibility attributes state role="slider", aria-label="Alarm", aria-valuemin="0", aria-valuemax="4", aria-valuenow="0", and aria-valuetext="0/4"
```

```gherkin
Given an interactive Clock with 4 ticks and value 2
When the reader clicks the clock
Then value becomes 3
And slices 0, 1, and 2 show the completed info fill
And aria-valuetext reads "3/4"
And onchange is called with value 3
```

```gherkin
Given an interactive Clock with 4 ticks and value 4
When the reader clicks or presses ArrowUp
Then value wraps to 0
And all slices show the uncompleted surface fill
And aria-valuetext reads "0/4"
And onchange is called with value 0
```

```gherkin
Given an interactive Clock with 4 ticks and value 0
When the reader Shift-clicks, long-presses, or presses ArrowDown
Then value wraps to 4
And all 4 slices show the completed info fill
And aria-valuetext reads "4/4"
And onchange is called with value 4
```

```gherkin
Given an interactive Clock with 6 ticks and value 3
When the reader presses ArrowDown or Shift+Enter
Then value becomes 2
And aria-valuetext reads "2/6"
And onchange is called with value 2
```

```gherkin
Given a Clock configured with label "Threat Clock", value 3, 6 ticks, and view={true}
When the page renders
Then the element has role="img" and aria-label="Threat Clock: 3/6"
And it has no tabindex
And clicking it produces no state changes and fires no events
```

```gherkin
Given a Clock configured with view={true} and disabled={true}
When the page renders
Then the element has role="img" and no tabindex
```

```gherkin
Given a Clock with disabled={true}, label "Locked Clock", and value 2
When it renders
Then it has role="slider", tabindex="0", and aria-disabled="true"
And clicking or pressing arrow keys produces no state change and fires no events
And it submits nothing to FormData
```

```gherkin
Given a Clock with weighted ticks [1, 2, 1]
When it renders
Then the second slice spans twice the angular arc of the first and third slices
```

```gherkin
Given a Clock with ticks [{ label: "Spotted" }, { label: "Alarmed" }] and value 1
When it renders in interactive mode
Then aria-valuetext reads "Spotted"
```

```gherkin
Given a Clock with 4 ticks and value passed as NaN
When it renders
Then value resolves to 0
And all 4 slices show the uncompleted surface fill
```

```gherkin
Given a Clock with 4 ticks and value passed as 2.8
When it renders
Then value resolves to 2
And 2 slices show the completed info fill
```
