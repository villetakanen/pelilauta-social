---
status: live
---

# CnCard

## Blueprint

### Context

CnCard presents a concise preview of one independently meaningful subject. It gives
that subject a stable title, optional visual identity, supporting content, and a
bounded action region. A composition without a title or with workflow-scale
content is a Surface or an application component rather than a CnCard.

### Architecture

CnCard is a server-renderable Svelte component. Its root is always an `article` and
remains passive when the CnCard has a destination. The required string title renders
as an h4; an optional string description follows it. Three optional composition
regions complete the structure:

| region | position | content |
| :--- | :--- | :--- |
| eyebrow | before the title | A caption-style category, channel, edition, or system label. |
| body | after the description | Concise supporting content. |
| actions | at the bottom edge | Links and controls related to the CnCard's subject. |

The public schema preserves the v20 names and composition model:

| input | contract |
| :--- | :--- |
| `title` | Required string rendered as the CnCard heading. |
| `description` | Optional string rendered as secondary text. |
| `elevation` | Optional level from 0 through 4; defaults to 1. |
| `href` | Optional destination for the title and cover. |
| `cover` | Optional cover-image URL. |
| `srcset`, `sizes` | Optional native responsive-image values used with `cover`. |
| `noun` | Optional icon noun. |
| `notify`, `alert` | Optional visual-state flags composing Surface's attention states; both default to false. Also settable on the client through the class hook below. |
| `eyebrow`, `actions`, `children` | Optional Svelte snippets for the three composition regions. |

An optional destination links the title. When a cover is present, the cover points
to the same destination for pointer users without adding a second keyboard or
assistive-technology link. The article itself never becomes a link, allowing the
eyebrow, body, and actions to contain independent destinations and controls.

CnCard composes `.elevation-0` through `.elevation-4` from
`specs/design-system/surface/spec.md`; elevation 1 is the default. CnCard defines its
padding, radius, clipping, containment, and foreground treatment, so it does not
compose the `.surface` container class or reproduce elevation declarations.
At elevation 0, CnCard adds a one-pixel `--cn-color-border` edge to remain distinct from
the application ground plane. Other consumers of `.elevation-0` remain borderless.
Its inset is one grid unit vertically and one gap horizontally. The body region
adds one grid unit of vertical separation around the description and supplied
content.

CnCard establishes inline-size containment so its cover resolves against the
CnCard width instead of the viewport. The title preserves v20's local card
headline treatment: Typography's h4 size, weight, line height, and tracking at every
container width. CnCard has a minimum block size of seven line units, giving its
preview and action region stable proportions in a listing.

### Constraints

The title is required and occupies at most two rendered lines. CnCard is used only
where h4 is valid in the surrounding document hierarchy. Description remains
secondary to the title through the small text step and a low-emphasis foreground.
Body content inherits CnCard's low-emphasis foreground and is limited to a small
preview, normally one to three short paragraphs. Forms, multi-step workflows,
arbitrary documents, and repeating data sheets do not belong inside CnCard.

CnCard sets its title metrics from Typography's h4 tokens. This component rule has
precedence over Typography's global narrow-container adaptation, preserving the v20
card hierarchy in compact listings. A linked title has no resting underline,
restores the underline on hover, and receives a visible focus ring for keyboard
navigation.

The optional eyebrow uses the caption treatment and low-emphasis foreground. It
precedes the heading and gains one grid unit of separation after a cover. Eyebrow
links have no resting underline, restore it on hover, and receive a visible focus
ring. The eyebrow does not replace the title or introduce another heading.

The optional actions region renders in a neutral container rather than a navigation
landmark because it accepts both links and command controls. The horizontal row is
anchored to the bottom of the CnCard. It is seven grid units high, uses standard gap
and horizontal padding, and bleeds through the CnCard's horizontal padding to its
outer edges. Direct children are vertically centred and distributed with space
between them. They supply typography, labels, destinations, and behavior.
CnCard does not supply application actions or business logic.

A cover is decorative, lazily loaded, cropped to 16:9, and may receive native
responsive image candidates and sizing hints. It bleeds through the CnCard's top and
horizontal padding while preserving the CnCard radius. Its lower edge carries an
upward gradient made from 70% `--chroma-primary-95` in Light and
`--chroma-primary-30` in Dark, blended with `hard-light`. The tint occupies at
most 44% of the cover height. The cover has no alternative text because the title
carries the subject's accessible identity.

A supplied cover that cannot load falls back to the design system's cover
artwork, so the region keeps its geometry, tint and noun rather than reserving 16:9
of nothing. The artwork ships with the capability rather than as an application
asset, and is painted behind the image rather than substituted for it: an image
that fails paints nothing, so what is behind it shows through without an error
event, component state or hydration. The fallback is therefore present in a CnCard
that is server-rendered and never hydrated, and it also covers the interval before
a lazily loaded cover arrives.

The consequence is that a cover with transparency composites over the artwork
instead of over the CnCard surface. Covers are photographic subject previews, and
the alternative — substituting on an error event — cannot work without hydration.

A CnCard given no cover renders no cover region at all, which remains how a subject
without an image is expressed.

An optional noun supplies visual identity. Without a cover it is small and appears
with the title. With a cover it is large and appears in the cover's upper-right
area. The noun is decorative in CnCard because the required title already names the
subject; CnCard suppresses the Icon capability's default announcement in this
context. Artwork resolution and sizing otherwise follow
`specs/design-system/components/cn-icon/spec.md`.

`notify` and `alert` compose Surface's attention states from
`specs/design-system/surface/spec.md`: CnCard carries `has-notify` or `has-alert` and
restates none of the flag's geometry or colour. It contributes only the inset that
pulls the flag over its elevation-0 border, under its own clipping. A covered noun
renders above either flag, preserving v20's identity-first stacking.

The states are also CnCard's public class hook. The root carries the `cn-card` class,
so a consumer that learns the state after the server response toggles `has-notify` or
`has-alert` on that root instead of supplying a new prop value. All three names are
part of this contract and are not internal names a refactor may rename.

The hook exists because CnCard's states arrive from two different times. A prop is
resolved when the page renders; unread signalling, session-dependent attention and
anything else a browser learns is resolved afterwards, in a CnCard that a
server-rendered listing does not hydrate. Without the hook such a consumer would have
to hydrate every card in a listing to change one triangle.

CnCard uses the large radius by default and permits `--cn-border-radius-card` to
override it. The radius applies to the CnCard, cover, image, and tint. A containing
layout defines CnCard width, arrangement, and spacing between CnCards.

The title and nouns use the heading foreground. Eyebrow, description, and inherited
body content use the low-emphasis foreground. At elevation 4, the title, nouns,
eyebrow, description, inherited body content, and links use the high-contrast text
role. Link hover retains that foreground, and keyboard focus uses it for the focus
outline. Supplied content that sets another foreground is responsible for that
pairing.

CnCard renders its complete initial structure without browser globals, data fetching,
or client-side effects. Reactivity may update supplied content and states after
hydration without changing the component's semantics.

## Contract

### Definition of Done

- Both applications can import and server-render CnCard from the local design
  system package.
- A component book documents the public schema and renders the basic, linked,
  elevation, indicator, cover, failed-cover, noun, eyebrow, action, long-title, and
  narrow-card variants from source in Light and Dark.
- Component checks verify semantic structure, optional-region ordering, links,
  image attributes, indicators, elevation composition, and server rendering.
- Browser checks verify linked-title focus, two-line truncation, cover sizing and
  tint extent, action-row geometry, stable card-title typography, CnCard
  foreground contrast, and the flag class hook taking effect on a CnCard that
  rendered without the flag and was never hydrated.
- Human review accepts every documented variant in Light and Dark and at narrow
  and wide container sizes.

### Regression Guardrails

- A destination never turns the article surface into an anchor or scripted
  whole-CnCard control.
- CnCard consumes the shared elevation utilities; it does not declare another
  background or shadow model.
- The elevation-0 border remains specific to CnCard and does not alter the shared
  elevation utility.
- The cover fallback artwork and the artwork a book specimen renders as a working
  cover are one source, so the documented state and the shipped one cannot diverge.
- The fallback needs no script, so it survives in a CnCard that is never hydrated.
- The artwork is not published as an application asset; a CnCard consumer serves
  nothing for the fallback to work.
- A linked decorative cover never creates a duplicate keyboard focus stop or
  accessible name.
- Actions remain at the bottom edge without CnCard acquiring margins or
  listing-layout rules.
- CnCard indicators add no independent accessible state; consumers provide the
  state meaning separately.
- CnCard composes the shared attention states and declares no flag of its own, so
  the card and every other surface cannot show different flags.
- The flag responds to `has-notify` and `has-alert` on the `cn-card` root and nothing
  else, so a class toggled after the server response takes effect without hydration.
- The initial server response contains the complete CnCard structure and content.

### Scenarios

```gherkin
Given a CnCard with a title and no optional content
When it renders
Then its root is an article at elevation 1
And its title is an h4
```

```gherkin
Given a CnCard with a destination
When it renders
Then the title links to the destination
And the article remains passive
```

```gherkin
Given a linked CnCard with a cover
When it renders
Then the cover points to the title destination for pointer users
And the cover is decorative and absent from keyboard navigation
```

```gherkin
Given a linked CnCard whose eyebrow, body or actions contain another link or control
When a reader operates that nested element
Then only the nested element's action occurs
```

```gherkin
Given a CnCard whose supplied cover cannot load
When the CnCard renders, hydrated or not
Then the cover region shows the design system's cover artwork
And it keeps the cover geometry, tint and noun
```

```gherkin
Given a CnCard with a noun and no cover
When it renders
Then the small noun appears with the title
And the noun is hidden from assistive technology
```

```gherkin
Given a CnCard with a noun and a cover
When it renders
Then the large noun appears over the cover
And the noun is hidden from assistive technology
```

```gherkin
Given a CnCard with an eyebrow after a cover
When it renders
Then the eyebrow appears one grid unit below the cover and before the h4
And its links expose hover and keyboard-focus treatments
```

```gherkin
Given a CnCard whose actions contain two direct children
When it renders
Then the actions form a seven-grid-unit horizontal row at the bottom edge
And the first child is at the row start and the second is at the row end
```

```gherkin
Given a CnCard with notify and alert active
When it renders
Then the alert flag has visual precedence
```

```gherkin
Given a server-rendered CnCard that renders no flag and is never hydrated
When a consumer adds `has-notify` to its `cn-card` root on the client
Then the notification flag becomes visible
```

```gherkin
Given a CnCard at elevation 0
When it renders on the application ground plane
Then it has a one-pixel border using `--cn-color-border`
```

```gherkin
Given a CnCard at elevation 4 in Light or Dark
When its title, nouns, eyebrow, description, inherited body and links render
Then each CnCard foreground uses `--cn-color-text-high`
And meets WCAG 2.2 AA
```

```gherkin
Given a CnCard in a container narrower than the typography breakpoint
When it renders
Then its h4 title retains the v20 card headline metrics
```

```gherkin
Given CnCard rendered on the server without client-side JavaScript
When the initial document is received
Then its article, title and supplied regions are present
```
