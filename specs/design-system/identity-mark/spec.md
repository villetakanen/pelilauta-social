---
status: live
---

# Identity Mark

## Blueprint

### Context

An identity mark stands for one profile wherever the applications show who wrote,
owns or plays something. The design system ships two marks: the pictorial mark
(`CnAvatar`) — the profile's image, its initials when no image renders, or the
generic avatar glyph when there is no profile — and the textual mark (`cn-nick`) —
the profile's nick, emphasised against running text. When recognisability and
legibility collide, legibility wins: a backdrop or emphasis that makes the nick or
initials hard to read in either theme is wrong, however distinctive.

Where an application shows who is present rather than who did one thing — the
readers active in the community, the people who keep a site — the pictorial marks
appear together as a list, overlapping, so that a crowd reads as a crowd rather
than as a row of separate pictures.

### Architecture

The design system ships the marks and nothing around them. Linking to a profile,
uploading an avatar, and placing either mark in navigation are consumer
compositions; the marks impose no interactivity. A mark placed inside
an anchor presents the link interaction states the actions capability defines
(`specs/design-system/actions`); standalone, it presents none — no pointer cursor,
no hover response.

Grouping is layout, so the list is the class `cn-avatar-list` rather than a
component. A component would have to accept profiles, and the design system does
not know what a profile is; the class lays out whatever marks and links the
consumer composes into it, and the consumer decides how many of them there are.

`CnAvatar` is a Svelte 5 component without a custom element or Shadow DOM,
replacing Cyan's `cn-avatar` Lit element; its placeholder renders through the icon
component (`specs/design-system/components/cn-icon`). The textual mark replaces
Cyan's `.cn-nick` utility; the implementer chooses whether it stays a class on native
elements or becomes a component. Cyan's `elevation` and `alt` attributes and
its `cn-avatar-button` element are not carried forward.

### Constraints

The pictorial mark has three diameters, measured in lines because it stands beside
text: one beside a single line, one heading a region, and one for a view that is
about the profile itself. The consumer decides which of them a mark takes, stated at
the call site rather than inferred from where the mark sits.

A profile without an image gets a backdrop derived from its nick, so co-present
profiles are visibly distinct. Deriving the same colour for the same nick across
renders is desirable, not required; a recolour on page refresh or between releases
is acceptable. The implementer chooses the derivation method, judged on the result:
varied backdrops that sit in the surface palette, with initials legible against
them in both Light and Dark.

The marks carry no design-system-authored human-readable strings. Standalone,
the pictorial mark announces the bare nick to assistive technology. Inside a
composition that already names the profile — a labelled anchor, an adjacent
textual mark — it is decorative. A nick is missing when it is absent or empty;
the anonymous placeholder a missing nick yields is decorative. A missing nick
may stand for a deleted, an anonymous or a redacted profile, and the application names the
state, in visible text and to assistive technology, localised where it is printed.

A list presents its marks in the inline direction and wraps them, each mark
overlapping the one before it by a fixed length, and every line of a wrapped list
starting at the same inline position. A later mark sits over an earlier one. A
list neither sizes its marks nor mixes sizes within itself.

Overlap costs the marks the separation that standing apart gave them, and a mark
takes it back from its own backdrop: inside a list the image draws within the
circle rather than filling it, leaving a rim of the colour the nick derived. The
separation carries the profile's identity, so a list needs to know nothing about
what it sits on, and a mark outside a list is unchanged.

A list may close with a count standing for the marks it does not show. The count
is a plus and a numeral and never a word — the design system publishes no string
here either, and a numeral needs none. It matches the marks in geometry and takes
the anonymous mark's presentation, because it stands for no one profile. The
count is decorative; a list whose total matters is named by the consumer, in the
consumer's language.

## Contract

### Definition of Done

- `CnAvatar` renders image, initials and placeholder states with the fallback
  order above, and a failed image load falls back rather than leaving a
  broken-image glyph.
- The textual mark emphasises the nick on both anchor and non-anchor hosts.
- Both marks present link interaction states inside an anchor and none standalone.
- An **Identity Mark** book renders both marks, plain and linked, in every avatar
  state, across Light and Dark, with co-present distinct nicks.
- `cn-avatar-list` overlaps and wraps the marks it is given without changing the
  presentation any of them has standing alone.
- An overflow count matches the marks' geometry at every size.
- The book renders every size of the mark, and a list with and without an overflow
  count at more than one of them, wrapped, in Light and Dark.

### Regression Guardrails

- Initials remain legible against every derived backdrop in both themes.
- A standalone mark exposes no interactive affordance; the same mark inside an
  anchor does.
- No string in either mark needs translation; announced names come from profile
  data.
- Class `cn-avatar` is preserved on the pictorial mark's root element.
- A list adds no interactivity, colour or elevation to the marks it contains, and
  a mark inside a list keeps the link states it has outside one.
- Overlap never hides a mark's initials or glyph, at any size, and the rim
  never crops the image to less than a recognisable picture.
- The overflow count is never a link and announces nothing.

### Scenarios

```gherkin
Given a CnAvatar with src and nick
When the image fails to load
Then the nick's initials render on a backdrop derived from the nick
And the initials meet contrast against the backdrop in the active theme
```

```gherkin
Given a standalone CnAvatar with a nick
When it renders
Then assistive technology announces the nick and nothing more
And no pointer cursor or hover response is presented
```

```gherkin
Given an identity mark inside an anchor labelled with the profile's nick
When a user hovers and focuses the anchor
Then the anchor presents the actions capability's link states through the mark
And assistive technology announces the profile once
```

```gherkin
Given a CnAvatar with neither src nor nick
When it renders
Then the generic avatar glyph renders and the mark is decorative
```

```gherkin
Given a cn-avatar-list of linked marks
When it renders in a container too narrow to hold them on one line
Then the marks overlap along each line and wrap onto the next
And every line begins at the same inline position
And each mark keeps the size and presentation it has standing alone
```

```gherkin
Given a cn-avatar-list closing with an overflow count
When it renders
Then the count matches the marks in geometry and takes the anonymous presentation
And assistive technology announces the marks but not the count
```

```gherkin
Given the textual mark on an anchor and on a span with the same nick
When both render in running text
Then both emphasise the nick identically
And only the anchor responds to hover, focus and activation
```
