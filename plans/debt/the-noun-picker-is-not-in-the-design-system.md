# The noun picker is not in the design system

`NounSelect.svelte` is an app-side component: a trigger showing the chosen noun on one
edge and a chevron on the other, opening a listbox of noun-and-icon options. Its
`.noun-select-trigger` rule states `justify-content: space-between` to hold that shape,
because no design-system capability publishes a noun picker.

`packages/design-system/styles/fields.css` now paints a `select` in every state — rest,
hover, focus, focus-within, disabled — so a native `select` already renders a chosen
value against the platform-drawn disclosure control, in the design system's fill and
indicator. A reader loses the icon beside the noun: an `option` cannot carry one, which
is why `NounSelect.svelte` exists rather than a plain `<select>`.

Two-sided distribution — a value pinned to one edge, a chevron pinned to the other — is
the one shape `text-align` cannot serve; nothing under the flex-for-alignment ruling
reproduces it, so the component keeps its own flex rule until it has a spec.

## Remaining change

Spec and publish a noun picker so its trigger is a design-system capability rather than
an app-local shim, then delete `NounSelect.svelte`'s local `.noun-select-trigger` rule
and compose the published component instead.
