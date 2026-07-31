---
status: draft
---

# Preflight

## Intent

v21's base styles are a **modern reset**, in the line of
[Andy Bell's](https://piccalil.li/blog/a-more-modern-css-reset/) and
[Tailwind Preflight](https://tailwindcss.com/docs/preflight), both of which build on
modern-normalize.

Cyan 4 and v20 are references for what exists, not a floor to preserve. Where the
modern reset and Cyan disagree, the reset wins and the consuming surface migrates —
appearance is not a compatibility contract.

The design system owns this because nothing else does. Removing Cyan today would take
the document's box model, control inheritance and list handling with it, and
`apps/design`, which imports no Cyan, keeps a private copy inside its book stylesheet.

## What Belongs In It

A rule belongs when it corrects a browser default, or establishes a baseline every
component may assume, and no component, container or the type ramp could own it
instead.

**A rule that needs another stylesheet to win against it is in the wrong file.** That
is the whole reason typography is absent: prose margins, leading and heading wrap only
make sense stated together with their replacements, and the type ramp states both.

One rule is not a browser correction at all. Astro's hydration wrapper is a box in the
document that the author did not write, so `astro-island { display: contents }` belongs
here: islands appear anywhere in either application, which puts the rule out of reach
of any component or shell.

The rule set is closed — a sixth concern changes this spec before it changes a
stylesheet. The literal selector list lives in the stylesheet's test, because prose
cannot settle whether `optgroup` or a WebKit search pseudo-element is inside it.

## Boundaries

| Concern | Owner |
| :--- | :--- |
| Box model, document, control inheritance, element defaults, body, runtime wrappers | the reset |
| Prose margins, type sizes, leading, heading wrap, link colour | the type ramp |
| Constraining image width | the container holding the image |
| Scrollbar appearance | themed surfaces, unassigned |
| How a control looks once normalised | its component |
| Page grid, rows and columns | the shell component |

Image constraint and scrollbar appearance exist only in Cyan today. Nothing fails when
the terminal sweep deletes them, which is why they are written down rather than left to
be discovered.

## Lists Keep Their Semantics

Markers are removed only where an author writes `role="list"`, because Safari drops a
list's semantics from VoiceOver when `list-style` is removed.

Cyan strips them globally, so nothing moves while it is present. When it goes, the
application's list elements need the role or their own `list-style` — an enumerated
sweep item rather than a surprise.

## Blueprint

One stylesheet, reached through the design system's CSS entry point rather than by
name: the preflight is the first design-system global that is not a token, so a
consumer who wants tokens does not receive a reset. It declares no custom property, so
a missing definition is a token defect rather than a reset defect.

Its book is the first entry in the design site's `base` group.

## Regression Guardrails

- No design-system stylesheet sets `font-size` on `html` or `:root`.
- Exactly one design-system stylesheet declares `color-scheme`, and the applications'
  `color-scheme` meta tags agree with it.
- The preflight declares no custom property, and every name it reads resolves in both
  colour schemes.
- No preflight rule needs another stylesheet to override it, and no other stylesheet
  restates one.

## Acceptance

- A button, a text input and a textarea render in the application's font with no
  component rule setting it.
- A book page renders with `border-box` sizing, no body margin and the theme's
  background and foreground, with no reset in the design site's own stylesheet.
- The preflight can be imported at any position in either application's shell without
  changing what a page looks like.
- A Svelte island inside a flex row lays out identically whether or not Cyan's flex
  utilities are present.
- Human review accepts the layout effect of `astro-island { display: contents }`, the
  one rule here that can move something already on screen.
