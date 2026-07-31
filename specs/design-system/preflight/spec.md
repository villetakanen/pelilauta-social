---
status: draft
---

# Preflight

## Intent

The preflight is what the design system asserts about a document before any component
speaks: the browser inconsistencies it corrects, and the box and inheritance baseline
every component may then rely on without restating it.

It is modelled on modern-normalize and Tailwind Preflight, and it takes over a job
currently spread across two places the design system does not own — Cyan 4's
`core/preflight.css`, and v20's `AppShell` global styles. Both are read as the
inventory of what the applications already rely on, so that nothing they provide goes
missing. Until the design system owns it, the terminal Cyan sweep would remove the
base styles out from under `apps/pelilauta`, and `apps/design`, which imports no Cyan,
keeps a private copy inside its book stylesheet.

A rule belongs here when it corrects a browser default, or establishes a baseline
components depend on silently, and no single component or the type ramp could own it
instead.

## What The Preflight Asserts

Five groups, below. No rule outside them belongs in the preflight, so a sixth concern
is a change to this spec before it is a change to a stylesheet. The literal selector
list is held by the stylesheet's own test, which fails when the two diverge — prose
cannot settle whether `optgroup` or a WebKit search pseudo-element is in the set, and
pretending otherwise would leave the guardrail unenforceable.

**Box model.** Every element and pseudo-element sizes as `border-box`.

**Document.** The document reports its tab size and refuses the mobile text-inflation
adjustment, so a rotated phone renders type at the size the reader chose.

The document declares its supported colour schemes here, and **only** here. Which of
Light and Dark a reader with no stated preference receives is
[the colour theme's decision](../design-tokens/spec.md); the declaration itself is a
statement about the document, so it moves out of the theme stylesheet rather than being
repeated. Three files disagreeing about that order is what made the no-preference
default wrong for as long as it was, and a value declared in two places is the defect,
not the disagreement.

The preflight sets no `font-size` on `html` or `:root`. That prohibition is the
scaling contract owned by [the token spec](../design-tokens/spec.md), and it is stated
here because this is the only stylesheet where breaking it would look natural.

**Inheritance.** Form controls — `button`, `input`, `optgroup`, `select`, `textarea` —
inherit the document's font family, size and line height, carry no margin, and do not
transform the case of their text. Buttons and elements in a button role present a
pointer cursor. Text areas resize vertically only. The platform's own control
artefacts are neutralised: the button appearance keyword, Firefox's inner focus border
and focus ring, the invalid-field shadow, the number spinners, and the search field's
appearance and decoration.

This is the group v21 gains rather than inherits: Cyan 4 achieves the same result by
setting type on each control from its `--cn-*-ui` tokens, so the behaviour is not new
to the application — stating it once as inheritance is. A component that wants a
control to match its surroundings then writes nothing.

**Element defaults.** `hr` carries no height and inherits its colour. `abbr[title]` is
underlined with a dotted line. `b` and `strong` are bolder than their surroundings;
`small` is smaller. `sub` and `sup` sit off the baseline without affecting line
height. `code`, `kbd`, `samp` and `pre` render in the monospace family at the size of
their context. `summary` displays as a list item. `table` indents no text and inherits
its border colour. `[hidden]` does not display. `ol`, `ul` and `menu` carry no
markers, margin or padding, because the interface's navigations, menus and trays are
lists before they are prose. Elements with a `popover` attribute carry no border,
margin or padding.

**Body and framework.** `body` carries no margin and takes the semantic background and
foreground roles with the platform's smoothed font rendering. Astro's hydration
wrapper, `astro-island`, displays as `contents`, so it never interposes a box between
an element and its semantic child.

## Nothing Overrides It

The preflight states only what no other stylesheet has reason to state, so it needs no
cascade arrangement, no layer and no required import position. Where an application
imports it is the application's business: its shell brings in the design system's core
CSS alongside whatever legacy stylesheets it still carries.

That property is a design constraint on this spec, not an assumption about consumers.
It is why prose margins are not here — the rules that restore them belong to the type
ramp, so a reset that zeroed them would be overriding the ramp, or waiting to be
overridden by it. A rule that needs another stylesheet to win against it is in the
wrong file.

Where a stylesheet duplicates a preflight rule today, the duplicate is deleted rather
than arranged around. `styles/docs.css` hand-rolled a reset because the design site
imports no Cyan and nothing else supplied one; that half of it goes, and its editorial
vocabulary stays.

The preflight is not imported from the tokens entry point. A reset is not a token, and
the two have opposite ordering requirements: tokens may load late, a reset may not.

## Compatibility

Appearance is not a compatibility contract and v18 is not its reference, so this
section is about behaviour and about what a reader will notice, not about matching what
v18 renders.

`apps/pelilauta` keeps Cyan 4 during migration, so both stylesheets apply. The
preflight changes behaviour in one place and appearance in two:

- **Layout, and the one behavioural change.** `astro-island { display: contents }`
  removes a box between an element and its semantic child. Cyan 4 instead reaches
  through the wrapper with duplicated `.flex-col > astro-island > *` selectors in its
  flex utilities, which become redundant. This can move existing layout, so it is
  named for visual acceptance rather than assumed inert.
- **Form controls inherit type** rather than receiving it per component. While Cyan is
  present its explicit per-control rules still win, so nothing moves yet; when Cyan
  goes, a control inherits its context instead of being pinned to the body text size —
  a button inside small text becomes small, which is the intended behaviour and a
  visible difference from Cyan's pinning.
- **Lists lose their markers and indentation** wherever nothing restores them. Cyan
  already does this globally and restores markers inside `article`, so the application
  is unchanged; the design site gains the rule it never had, and its book stylesheet
  states what prose lists should look like.

### Knowingly Unowned

Two families of rule exist only in Cyan 4 and are deliberately not adopted here, so
that the terminal sweep cannot delete them unnoticed. Nothing fails when they
disappear, which is the whole risk:

- **Image constraint.** Cyan scopes `max-width: 100%` to images inside a section or
  article. Whether images are constrained globally or by their container is a
  container-level decision, owned by whichever spec first owns the prose container.
- **Scrollbar appearance.** Cyan styles the standard and WebKit scrollbars, reading
  a width, a radius and three colour names. Scrollbar appearance is a themed surface,
  not normalization. Owning it means owning those tokens; until then the application
  loses scrollbar styling when Cyan goes.

## Blueprint

One stylesheet in `packages/design-system/styles`, its rules in the six groups above
and in that order, each group introduced by what it asserts and why the browser's
default is wrong. It declares no custom property: every name it reads is defined by a
token family, so a missing definition is a token defect rather than a reset defect.

It is reached through the design system's CSS entry point rather than by name. The
preflight is the first design-system global that is not a token, so `styles/tokens.css`
stops being the file an application wants: an entry point composes the preflight and the
tokens, applications import that one file, and the token entry point stays meaningful on
its own for a consumer that wants tokens and no reset. Later globals — the type ramp
next — join the entry point without either application's shell changing.

Each application imports it where its shell brings in the design system's core CSS:
`apps/design` in the book layout, whose book stylesheet then keeps only editorial
vocabulary, and `apps/pelilauta` in both head components. A stylesheet that only one
surface needs — the design site's editorial vocabulary, a book's own demonstration
sheet — is imported by that surface, and is not a category the entry point has to
account for.

Its book is the first entry in the `base` group of the design site, described by
[the navigation spec](../design-site-navigation/spec.md). The book enumerates what the
document already does and what a component therefore need not restate; it teaches no
decision, which is why it is not a principles book.

## Non-Goals

- Element typography — sizes, weights, leading, and the margins that express vertical
  rhythm — belongs to the type ramp, not to the reset. Zeroing prose margins is the
  ramp's opening move, in the story that states the replacement margins, because the
  two halves are one decision.
- Application shell layout is a component's business. v20 placing its page grid and
  viewport height in the same rule as its reset is drift, not a model.
- Component appearance, including how a button, input or select looks once
  normalized.
- Token definitions. The preflight reads names and declares none.
- Image constraint and scrollbar appearance, as recorded above.
- A complete transcription of modern-normalize. It is the model, copied from as a
  template, not a dependency and not a checklist to satisfy in full.

## Regression Guardrails

- No design-system stylesheet sets `font-size` on `html` or `:root`.
- Every custom property the preflight reads resolves to a value in both colour
  schemes.
- The preflight declares no custom property.
- Exactly one design-system stylesheet declares `color-scheme`, and the applications'
  `color-scheme` meta tags agree with it.
- The stylesheet's selectors match the list its test holds, and every one of them
  belongs to a group this spec describes.
- No preflight rule needs another stylesheet to override it, and no design-system or
  application stylesheet restates one.

## Acceptance

- A button, a text input and a textarea in `apps/pelilauta` render in the application's
  font with no component rule setting it. A number input shows no spinner of its own
  height, and a Firefox control shows no inner focus border.
- A book page on `apps/design` renders with `border-box` sizing, no body margin and
  the theme's background and foreground, while its book stylesheet contains no reset
  of its own.
- Each application reaches the preflight through one import of the design system's CSS
  entry point, and adding the next global stylesheet to the design system changes
  neither application.
- The preflight can be imported at any position in either application's shell without
  changing what a page looks like, which is what proves it states nothing another
  stylesheet also states.
- A Svelte island inside a flex row lays out identically whether or not the Cyan flex
  utilities are present.
- Removing Cyan 4 from `apps/pelilauta` leaves every rule in this spec in force, and
  removes exactly the two recorded unowned families.
- Human review accepts the layout effect of `astro-island { display: contents }`, which
  is the one rule here that can move something already on screen.
