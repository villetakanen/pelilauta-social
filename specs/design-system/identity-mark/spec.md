---
status: approved
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

### Architecture

The design system ships the marks and nothing around them. Linking to a profile,
uploading an avatar, and placing either mark in navigation are consumer
compositions; the marks impose no interactivity of their own. A mark placed inside
an anchor presents the link interaction states the actions capability defines
(`specs/design-system/actions`); standalone, it presents none — no pointer cursor,
no hover response.

`CnAvatar` is a Svelte 5 component without a custom element or Shadow DOM,
replacing Cyan's `cn-avatar` Lit element; its placeholder renders through the icon
component (`specs/design-system/components/cn-icon`). The textual mark replaces
Cyan's `.cn-nick` utility; whether it stays a class on native elements or becomes a
component is the implementer's choice. Cyan's `elevation` and `alt` attributes and
its `cn-avatar-button` element are not carried forward.

### Constraints

A profile without an image gets a backdrop derived from its nick, so co-present
profiles are visibly distinct. Deriving the same colour for the same nick across
renders is desirable, not required; a recolour on page refresh or between releases
is acceptable. The derivation method is the implementer's, judged on the result:
varied backdrops that sit in the surface palette, with initials legible against
them in both Light and Dark.

The marks carry no design-system-authored human-readable strings. Standalone,
the pictorial mark announces the bare nick to assistive technology. Inside a
composition that already names the profile — a labelled anchor, an adjacent
textual mark — it is decorative. A nick is missing when it is absent or empty;
the anonymous placeholder a missing nick yields is decorative. A missing nick
may stand for a deleted, an anonymous or a redacted profile, and naming the
state, in visible text and to assistive technology, is the application's,
localised where it is printed.

## Contract

### Definition of Done

- `CnAvatar` renders image, initials and placeholder states with the fallback
  order above, and a failed image load falls back rather than leaving a
  broken-image glyph.
- The textual mark emphasises the nick on both anchor and non-anchor hosts.
- Both marks present link interaction states inside an anchor and none standalone.
- An **Identity Mark** book renders both marks, plain and linked, in every avatar
  state, across Light and Dark, with co-present distinct nicks.

### Regression Guardrails

- Initials remain legible against every derived backdrop in both themes.
- A standalone mark exposes no interactive affordance; the same mark inside an
  anchor does.
- No string in either mark needs translation; announced names come from profile
  data.
- Class `cn-avatar` is preserved on the pictorial mark's root element.

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
Given the textual mark on an anchor and on a span with the same nick
When both render in running text
Then both emphasise the nick identically
And only the anchor responds to hover, focus and activation
```
