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

Faces are self-hosted rather than fetched from a font CDN — v18's
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
and a consuming application declares none.

Every face the stylesheet names is a file this repository holds. No published
package delivers the set: the scale needs weights that exist only in the full
family, and the full family is published only whole, carrying alphabets neither
application renders. So a face is cut here from a source face, and what a reader
downloads is a file in version control rather than whatever a dependency resolved
to on the day of the build.

The design system is consumed as source through a Vite alias, not built, so a face
is referenced by a path relative to the stylesheet and each application's build
fingerprints its own copy of every file.

Cutting a face is reproducible from a source face, this spec's coverage ranges and
a checked-in step. Which tool performs the cut is not this spec's, but a face that
cannot be reproduced from a stated source is not one this system ships.

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

Both registers cover latin and latin-ext, and nothing else. Finnish, Swedish and
English need no more: ä ö å é are in latin, š ž in latin-ext. Characters outside the
two ranges fall back per glyph.

Each range is a separate face with its own `unicode-range`.

No shipped face carries glyphs outside the two ranges. The published full family's
do: Cyrillic, Greek, Vietnamese and IPA, at 178 KB per face against 31 KB cut to
latin.

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
  that every declared source resolves to a file this repository ships, and that
  every face swaps. It reads the weights from the typography spec rather than
  restating them.
- A check asserts that every declared face states a `unicode-range`, and that the
  ranges are latin and latin-ext only.
- A base book documents the delivered system.
- Human review accepts the weight of text on screen in both applications.

### Regression Guardrails

- A weight named with no face renders synthesised. It is approximately right at every
  size and never fails, so nothing surfaces it but a comparison.
- A family named in a stack and never loaded renders correctly for anyone who has it
  installed, which includes whoever is looking at the screen.
- A renamed or deleted face file breaks a source silently in any bundler that
  tolerates an unresolved `url()`.
- Two faces of one family and weight declared without `unicode-range`: the later wins
  and the earlier never loads.

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
