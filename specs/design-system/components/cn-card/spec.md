---
status: approved
---

# CnCard

## Blueprint

### Context

CnCard presents a concise preview of one independently meaningful subject. It gives
that subject a stable title, optional visual identity, supporting content, and a
bounded action region. A composition without a title or with workflow-scale
content is a Surface or an owning application component rather than a CnCard.

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
| `notify`, `alert` | Optional visual-state flags; both default to false. |
| `eyebrow`, `actions`, `children` | Optional Svelte snippets for the three composition regions. |

An optional destination links the title. When a cover is present, the cover points
to the same destination for pointer users without adding a second keyboard or
assistive-technology link. The article itself never becomes a link, allowing the
eyebrow, body, and actions to contain independent destinations and controls.

CnCard composes `.elevation-0` through `.elevation-4` from
`specs/design-system/surface/spec.md`; elevation 1 is the default. CnCard owns its
padding, radius, clipping, containment, and foreground treatment, so it does not
compose the `.surface` container class or reproduce elevation declarations.
Its inset is one grid unit vertically and one gap horizontally. The body region
adds one grid unit of vertical separation around the description and supplied
content.

CnCard establishes inline-size containment so its cover resolves against the
CnCard's own width instead of the viewport. The title preserves v20's local card
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
between them. They supply their own typography, labels, destinations, and behavior.
CnCard does not supply application actions or business logic.

A cover is decorative, lazily loaded, cropped to 16:9, and may receive native
responsive image candidates and sizing hints. It bleeds through the CnCard's top and
horizontal padding while preserving the CnCard radius. Its lower edge carries an
upward gradient made from 70% `--cn-color-primary-95` in Light and
`--cn-color-primary-30` in Dark, blended with `hard-light`. The tint occupies at
most 44% of the cover height. The cover has no alternative text because the title
carries the subject's accessible identity.

An optional noun supplies visual identity. Without a cover it is small and appears
with the title. With a cover it is large and appears in the cover's upper-right
area. The noun is decorative in CnCard because the required title already names the
subject; CnCard suppresses the Icon capability's default announcement in this
context. Artwork resolution and sizing otherwise follow
`specs/design-system/components/cn-icon/spec.md`.

`notify` and `alert` render triangular flags in the upper-right corner. Notification
uses the information role; alert uses the warning role and takes visual precedence
when both are present. Each flag occupies a seven-grid-unit square clipped to the
upper-right triangle with `polygon(100% 0, 0 0, 100% 100%)`. The flags are
supplementary visual states. A consumer that uses either state provides its meaning
through text or another accessible state. A covered noun renders above either flag,
preserving v20's identity-first stacking.

CnCard uses the large radius by default and permits `--cn-border-radius-card` to
override it. The radius applies to the CnCard, cover, image, and tint. A containing
layout owns CnCard width, arrangement, and spacing between CnCards.

The title and nouns use the heading foreground. Eyebrow, description, and inherited
body content use the low-emphasis foreground. CnCard strengthens an owned foreground
at an elevation where the v20 role would otherwise fail WCAG 2.2 AA. Supplied
content that sets another foreground owns that pairing.

CnCard renders its complete initial structure without browser globals, data fetching,
or client-side effects. Reactivity may update supplied content and states after
hydration without changing the component's semantics.

## Contract

### Definition of Done

- Both applications can import and server-render CnCard from the local design
  system package.
- A component book documents the public schema and renders the basic, linked,
  elevation, indicator, cover, noun, eyebrow, action, long-title, and narrow-card
  variants from source in Light and Dark.
- Component checks verify semantic structure, optional-region ordering, links,
  image attributes, indicators, elevation composition, and server rendering.
- Browser checks verify linked-title focus, two-line truncation, cover sizing and
  tint, action-row geometry, stable card-title typography, and CnCard-owned
  foreground contrast.
- Human review accepts every documented variant in Light and Dark and at narrow
  and wide container sizes.

### Regression Guardrails

- A destination never turns the article surface into an anchor or scripted
  whole-CnCard control.
- CnCard consumes the shared elevation utilities; it does not declare another
  background or shadow model.
- A linked decorative cover never creates a duplicate keyboard focus stop or
  accessible name.
- Actions remain at the bottom edge without CnCard acquiring margins or
  listing-layout rules.
- CnCard indicators add no accessible state of their own; consumers provide the
  state meaning separately.
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
Given a CnCard at elevation 4 in Light or Dark
When its title, eyebrow, description and inherited body foreground render
Then each CnCard-owned foreground meets WCAG 2.2 AA
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
