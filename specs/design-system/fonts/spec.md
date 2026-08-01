---
status: draft
---

# Fonts

## Blueprint

### Context

`specs/design-system/typography/spec.md` names families and weights. Nothing
delivers them. The faces are declared in `apps/pelilauta/src/overrides.css`, so the
design system publishes a type system it cannot render, and the design site — which
imports no Cyan and no faces — teaches that system in whatever the reader's machine
offers.

A face is a payload, bought once for both applications. That is a different decision
from what the scale looks like, and it fails differently: a missing face never errors,
it approximates.

Faces are self-hosted from npm rather than fetched from a font CDN — v18's
arrangement, kept deliberately. A third-party font request is a third party watching
who reads Pelilauta, which is not a trade anyone here agreed to. The cross-site cache
that used to pay for that is gone, because browsers partition their cache by site: a
visitor downloads the face here whether or not another site served it yesterday. What
is left of the CDN argument is someone else's uptime between a reader and text the
page cannot render without. Each application ships its own copy, since the two deploy
as separate sites and have nothing to share.

Faces swap rather than block: on a discussion site the text is the product, and a page
showing nothing until a font arrives is worse than one that changes shape once. The
reflow is a real cost, visible and reported by any layout-stability measurement, and
it is accepted. Nothing is preloaded either — the fallback already carries the first
paint, and a preload would compete for bandwidth with the content the page is for.

### Architecture

Faces are declared in one design-system stylesheet, reached through `styles/ds.css`,
and a consuming application declares none. This is the only design-system stylesheet
with package dependencies: Lato comes from `lato-font` and Roboto Mono from
`@fontsource/roboto-mono`, by bare specifier, resolved by each consumer's bundler.

The design system is consumed as source through a Vite alias, not built, so those
dependencies install from the workspace root and each application's build fingerprints
its own copy of every file.

The platform stacks behind both family tokens are a fallback for a failed load, not a
delivery mechanism: neither register renders from what the reader's machine has.

Delivery ends at the element, not at the face. This stylesheet applies the human
register to the document and the technical register to the roles
`specs/design-system/typography/spec.md` names as technical, so text in either
application is in the right family without a consumer naming one. Nothing else names a
family — including `styles/preflight.css`, which carries the code-element rule today
and gives it up here: a reset normalises a browser default, and this chooses a
typeface.

### Constraints

Every weight `specs/design-system/typography/spec.md` names is a loaded upright face
in the human register, and each of them loads its italic: emphasis inside prose is
prose, and a missing italic is synthesised by slanting the upright.

The technical register loads the weights its roles use and no others. No technical
role sets a heading and none takes inline emphasis, so it loads neither the display
weights nor an italic. A technical role that needs one adds a face here first.

The set is otherwise closed the way the step set is — a face is added or dropped by
changing this spec. It holds two weights no step names, kept from the set the
application shipped; dropping them is a payload decision, not a consequence of the scale.

The technical register covers latin and latin-ext, each declared with its own
`unicode-range` — without ranges the second declaration simply wins and the first is
dead weight. European Latin turns up in player names and in quoted material, and a
fallback inside a word is worse than one between them: it puts two typefaces in a
single code block. Coverage beyond those ranges falls through per glyph, which is
accepted. Lato ships whole faces, so the human register chooses nothing here.

The family tokens are the design system's to declare, under the names in
`specs/design-system/design-tokens/spec.md`.

What this spec enforces ends at the stylesheet. The face set, the swap, the format
order and the subset are here, and a check can see them. Preload markup, cache headers
and compression are each application's: the design system states that no face is
preloaded and cannot stop one being added. An application changing any of those is
changing this spec's outcome without touching it.

## Contract

### Definition of Done

- One design-system stylesheet declares every face and names every family. Nothing
  else does — not the reset, not either application, not the design site's editorial
  stylesheet.
- Both applications render both registers from shipped faces, the design site
  included.
- With every face blocked from loading, both registers still fall to a monospace and a
  sans respectively, and nothing renders in the browser's default serif.
- A check asserts that every weight the typography spec names has an upright face,
  that every declared source resolves to an installed file, and that every face
  swaps. It reads the weights from the typography spec rather than restating them.
- A book teaches why the faces are ours rather than a CDN's, what swap costs, and why
  nothing is preloaded, and lists every face that loads with its weight and coverage.
  A reader who has it cannot be surprised by the payload.
- Human review accepts the weight of text on screen in both applications.

### Regression Guardrails

- A weight named with no face renders synthesised. It is approximately right at every
  size and never fails, so nothing surfaces it but a comparison.
- A family named in a stack and never loaded renders correctly for anyone who has it
  installed, which includes whoever is looking at the screen.
- A face-package upgrade that moves or renames a file breaks a source silently in any
  bundler that tolerates an unresolved `url()`.

### Scenarios

```gherkin
Given a face that has not finished loading
When the page paints
Then the text is visible in a fallback, and swaps when the face arrives
```

```gherkin
Given a reader whose machine has neither family installed
When an identifier, a slug or a code block renders
Then it is set in the technical family, from a face the design system shipped
```
