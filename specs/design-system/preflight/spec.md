---
status: draft
---

# Preflight

## Intent

The preflight is what the design system asserts about a document before any component
speaks: the browser inconsistencies it corrects, and the box and inheritance baseline
every component may then rely on without restating it.

Both v18's Cyan 4 and v20 intended a preflight modelled on modern-normalize and
Tailwind Preflight, and neither finished one. Cyan 4 has a partial file; v20 has the
rules inline in an application shell, mixed with layout that is not reset material.
Because no design-system stylesheet owns any of it, the terminal Cyan sweep would
remove the reset out from under both applications, and `apps/design` — which imports
no Cyan at all — has been keeping a private copy inside its book stylesheet.

A rule belongs here when it corrects a browser default, or establishes a baseline
components depend on silently, and no single component or the type ramp could own it
instead.

## What The Preflight Asserts

Six groups, below. No rule outside them belongs in the preflight, so a seventh
concern is a change to this spec before it is a change to a stylesheet. The literal
selector list is held by the stylesheet's own test, which fails when the two diverge —
prose cannot settle whether `optgroup` or a WebKit search pseudo-element is in the
set, and pretending otherwise would leave the guardrail unenforceable.

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

This group is the largest gap in what v21 inherits. Cyan 4 has none of it, and
compensates by setting font on each control from `--cn-*-ui` tokens declared in its
button tokens — a UI font family living in button tokens is the symptom.

**Element defaults.** `hr` carries no height and inherits its colour. `abbr[title]` is
underlined with a dotted line. `b` and `strong` are bolder than their surroundings;
`small` is smaller. `sub` and `sup` sit off the baseline without affecting line
height. `code`, `kbd`, `samp` and `pre` render in the monospace family at the size of
their context. `summary` displays as a list item. `table` indents no text and inherits
its border colour. `[hidden]` does not display. `ol`, `ul` and `menu` carry no
markers, margin or padding, because the interface's navigations, menus and trays are
lists before they are prose. Elements with a `popover` attribute carry no border,
margin or padding.

**Margins.** Zeroed on an enumerated set — `body`, `h1` through `h6`, `p`,
`blockquote`, `dl`, `dd`, `figure`, `hr`, `pre` — following Tailwind Preflight rather
than v20's universal selector. An enumerated set is a promise the type ramp can keep;
a universal one silently strips elements nobody has considered.

**Body and framework.** `body` takes the semantic background and foreground roles and
the platform's smoothed font rendering. Astro's hydration wrapper, `astro-island`,
displays as `contents`, so it never interposes a box between an element and its
semantic child.

## Load Order

The preflight loads **before** whatever styles elements — any legacy Cyan stylesheet,
and the tokens entry point. A reset that loads after the type ramp is not a reset; it
is an override of the ramp, at equal specificity, by whichever file happened to be
imported last. That holds for Cyan's ramp today and for the design system's own ramp
later.

The consequence in `apps/pelilauta` is that the margin group is inert there for now:
Cyan supplies the element ramp, including the bottom margins on headings, paragraphs,
blockquotes and tables, and restores them after the preflight has zeroed them. The
group takes effect when the ramp moves into the design system, which is the story that
states the replacement margins. Zeroed margins with no ramp behind them is not v20's
typography — it is an absence of typography — and shipping that as an intermediate
state would degrade every deployed increment between the two stories.

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
- **`dl`, `dd` and `pre` lose their browser-default margins** in both applications,
  since neither Cyan nor the design system states margins for them. On `apps/design`,
  which has no Cyan, book prose also loses default heading and paragraph margins, so
  its book stylesheet states the rhythm it wants.

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

Both applications import it first. `apps/design` imports it in the book layout and its
book stylesheet keeps only editorial vocabulary; `apps/pelilauta` imports it ahead of
Cyan in both head components.

Its book is the first entry in the `base` group of the design site, described by
[the navigation spec](../design-site-navigation/spec.md). The book enumerates what the
document already does and what a component therefore need not restate; it teaches no
decision, which is why it is not a principles book.

## Non-Goals

- Element typography — sizes, weights, leading, and the margins that express vertical
  rhythm — belongs to the type ramp, not to the reset.
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
- The preflight is imported before any Cyan stylesheet wherever both are present.

## Acceptance

- A button, a text input and a textarea in `apps/pelilauta` render in the application's
  font with no component rule setting it. A number input shows no spinner of its own
  height, and a Firefox control shows no inner focus border.
- A book page on `apps/design` renders with `border-box` sizing, no body margin and
  the theme's background and foreground, while its book stylesheet contains no reset
  of its own.
- Prose in `apps/pelilauta` still has vertical rhythm — consecutive paragraphs and
  headings are visibly separated — which is what proves the load order. Whether that
  rhythm matches v18 is not the question; whether it exists is.
- A Svelte island inside a flex row lays out identically whether or not the Cyan flex
  utilities are present.
- Removing Cyan 4 from `apps/pelilauta` leaves every rule in this spec in force, and
  removes exactly the two recorded unowned families.
- Human review accepts the layout effect of `astro-island { display: contents }` and
  the loss of default margins on `dl`, `dd` and `pre`.
