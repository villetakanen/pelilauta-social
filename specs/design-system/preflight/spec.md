---
status: approved
---

# Preflight

## Intent

v21's base styles are a **modern reset**, in the line of
[Andy Bell's](https://piccalil.li/blog/a-more-modern-css-reset/) and
[Tailwind Preflight](https://tailwindcss.com/docs/preflight).

Cyan 4 and v20 are references for what exists, not a floor to preserve. Where the
modern reset and Cyan disagree, the reset wins and the consuming surface migrates —
appearance is not a compatibility contract.

Nothing else can hold these rules. Removing Cyan today would take the document's box
model, control inheritance and list handling with it, and `apps/design`, which imports
no Cyan, keeps a private copy inside its book stylesheet.

## What Belongs In It

A rule belongs when it corrects a browser default, or establishes a baseline every
component may assume, and no component, container, Surface or typography
capability could state it instead.

**A rule that needs another stylesheet to win against it is in the wrong file.** Type
sizes, leading and heading wrap are therefore absent: each is a value typography states,
not a default to correct.

Margins and padding are removed from every element. Removal is explicit because there
is no application-wide paragraph margin: whatever lays out the content states the
spacing, and until typography states it that is each container.

One rule is not a browser correction at all. Astro's hydration wrapper is a box in the
document that the author did not write, so `astro-island { display: contents }` belongs
here: islands appear anywhere in either application, which puts the rule out of reach
of any component or shell.

The rule set is closed — a sixth concern changes this spec before it changes a
stylesheet. The literal selector list lives in the stylesheet's test, because prose
cannot settle whether `optgroup` or a WebKit search pseudo-element is inside it.

## Boundaries

| Concern | Stated by |
| :--- | :--- |
| Box model, document, control inheritance, element defaults, body, runtime wrappers | the reset |
| Applying the document's base background and foreground | the reset |
| Ground-plane meaning and elevated surface utilities | Surface |
| Which family any element renders in | fonts |
| Type sizes, leading, heading wrap | typography |
| Native link presentation and navigation-versus-command semantics | Links and Actions |
| The spacing that replaces the removed margins | each container, until typography |
| Constraining media width, and whether media is block-level | the container holding it |
| Scrollbar appearance | nothing: browser default |
| How a control looks | its component; the reset normalises, it does not style |
| Page grid, rows and columns | a shell component, which neither app has yet |

Media carries no rules here. A reset cannot know which images are content and which are
chrome, so whatever an image has to fit decides.

The body fills the viewport in `dvh`, not `vh`, so it survives a mobile browser's
collapsing toolbar. The body *being* a grid with named rows is a shell's, and no v21
shell exists yet: `apps/pelilauta` gets its chrome from Cyan's `main`, `bar`, `rail` and
`tray` stylesheets, and `apps/design` lays out its own in the book layout.

Controls keep their native look until a component gives them the system's. The reset
neutralises the artefacts nobody wants — Firefox's focus ring and inner border, number
spinners, the search field — and keeps `-webkit-appearance: button`, which preserves
native button rendering that iOS Safari otherwise drops on `[type="button"]`. Blanking
controls to a slate instead would make a component mandatory before any control is
usable.

The `hidden` attribute keeps elements out of layout, except for
`hidden="until-found"`: that state remains the browser's so find-in-page can reveal it.

Scrollbars are the browser's. Cyan 4 is the only source that styles them, and it is the
source being replaced. Styling them later would be a separate scrollbar and theming
capability with its own tokens and spec, not a gap in this one or in Surface.

Media constraint and Cyan's scrollbar rules both disappear with Cyan, and nothing fails
when they do, which is why they are written down rather than left to be discovered.

## Lists Keep Their Semantics

Markers are removed only where an author writes `role="list"`, because Safari drops a
list's semantics from VoiceOver when `list-style` is removed.

Cyan strips them globally, so nothing moves while it is present. When it goes, the
application's list elements need the role or their `list-style` — an enumerated
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
  background and foreground, with no reset in the design site's stylesheet.
- The preflight can be imported at any position in either application's shell without
  changing what a page looks like.
- A Svelte island inside a flex row lays out identically whether or not Cyan's flex
  utilities are present.
- Human review accepts the layout effect of `astro-island { display: contents }`, the
  one rule here that can move something already on screen.
