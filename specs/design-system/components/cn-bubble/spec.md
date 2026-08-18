---
status: live
---

# CnBubble

## Blueprint

### Context

A conversation is a sequence of messages, each produced by one participant and each
complete in itself. A bubble presents one message: its shape bounds the message, so a
message of several paragraphs still reads as one, and its tail points out of the block
toward the participant who produced it, so the text reads as something said in an
exchange rather than as the surrounding prose. Which edge the shape hangs from
separates the reader's messages from the rest, and bubbles stacked in order read as
turns taken. Where that separation and colour collide, shape carries it, because a
reader who does not perceive the colour difference still sees the shape.

### Architecture

CnBubble is a server-renderable Svelte component. Its root is the row. The message is
an `article` inside that row, and the pictorial identity mark stands beside it.

The composition supplies the message as children. It decides whether the message
belongs to the current reader, and states that through the optional boolean `reply`
input, which defaults to false. It supplies the mark through the optional `nick` and
`avatar` inputs. CnBubble renders no mark when it receives neither.

CnBubble builds the mark from those inputs rather than accepting a built one. A mark
it builds is decoration it guarantees: the mark carries no link, and it announces
nothing. `specs/design-system/identity-mark` governs the mark.

A composition that supplies a mark names the participant in the `header`. That naming
is what makes the mark decoration rather than the only identity the message carries,
and it is why CnBubble may drop the mark at a narrow width.

The row establishes the boundary the mark queries. The mark therefore answers the
width the composition gives the message, and never the width of the viewport.

### Documentation

The CnBubble Component book,
`apps/design/src/content/components/cn-bubble.mdx`.

### Constraints

| Variant | Reserved margin and tail | Square corner | Background | Foreground |
| :--- | :--- | :--- | :--- | :--- |
| Default | Left | Upper-left | `--cn-bubble` | `--cn-on-bubble` |
| Reply | Right | Upper-right | `--cn-reply-bubble` | `--cn-on-reply-bubble` |

The other three corners use `--cn-border-radius-medium`. The tail is a right triangle
one gap wide and one gap high. It extends from the article's block-start edge into the
reserved one-gap margin and takes the variant's background colour.

- The article has one gap of block-start and inline padding, one grid unit of
  block-end padding and a minimum block size of four gaps.
- The first child contributes no block-start margin. A leading `header` reaches the
  article's block-start edge, and a trailing `footer` reaches its block-end edge.
- CnBubble does not decide the order of messages.

The mark stands beyond the reserved margin, on the edge the tail occupies. It takes
the diameter that heads a region.

CnBubble renders the mark only where the row is wider than the small breakpoint. A
query states that threshold as a literal (`specs/design-system/design-tokens`). At or
below it the mark leaves the layout and reserves no space.

## Contract

### Definition of Done

- The Component book documents the `reply`, `nick` and `avatar` inputs and renders
  default, reply, leading-header, trailing-footer, short-message and marked
  compositions in Light and Dark.
- The book renders a marked bubble in a boundary narrow enough to drop the mark.
- Human review accepts both variants and their compositions in Light and Dark.

### Regression Guardrails

- The two variants differ by tail direction and corner shape, not by colour alone.
- The mark is absent from the accessibility tree and presents no interactive
  affordance.
- CnBubble displays and announces no participant name. It accepts one to build the
  mark from, and shows the initials the mark derives.
- CnBubble supplies no timestamp, actions or application state.
- CnBubble carries no outer layout width or message-list spacing.
- The initial server response contains the complete article and its content.

### Scenarios

```gherkin
Given a CnBubble without the reply input
When it renders
Then the message is an article inside its root
And its supplied children are direct children of that article
```

```gherkin
Given a CnBubble with neither nick nor avatar
When it renders
Then no mark renders
And the article keeps the reserved margin and nothing beyond it
```

```gherkin
Given a marked CnBubble in either variant, given more width than the small breakpoint
When it renders
Then the mark stands beyond the reserved margin, on the edge the tail occupies
And the mark is absent from the accessibility tree
```

```gherkin
Given a marked CnBubble given the small breakpoint's width or less
When it renders
Then the mark leaves the layout
And the article occupies the width the mark would have left it
```

```gherkin
Given a marked CnBubble in a column narrower than the small breakpoint
And a viewport wider than it
When it renders
Then the mark leaves the layout
```

```gherkin
Given a CnBubble with a nick and no avatar
When it renders
Then the mark presents the initials the identity mark capability defines
```

```gherkin
Given a CnBubble without the reply input
When it renders
Then the tail appears on the left in the reserved margin
And only the upper-left corner is square
```

```gherkin
Given a CnBubble with reply set to true
When it renders
Then the tail appears on the right in the reserved margin
And only the upper-right corner is square
```

```gherkin
Given a rendered CnBubble
When its reply input changes
Then its tail, corner shape and colour roles change to the selected variant
And its content and article semantics do not change
```

```gherkin
Given a CnBubble whose first child is a header
When it renders
Then the header reaches the article's block-start edge
```

```gherkin
Given a CnBubble whose last child is a footer
When it renders
Then the footer reaches the article's block-end edge
```

```gherkin
Given a CnBubble containing a short message
When it renders
Then the article remains at least four gaps high
```

```gherkin
Given either CnBubble variant
When its browser accessibility tree is inspected
Then the tail is absent
```
