---
status: live
---

# Content Container Layouts

## Blueprint

### Context

Pelilauta pages carry conversations, activity streams, reference material and the
context around them. A content container is how a page composes such material into
columns a reader can follow: one reading column, a reading column with an aside, or
three columns of reference. Comprehension and reading order come before visual variety,
so a container keeps source order, and narrows to one column wherever the width for more
is missing.

### Architecture

A content container lays its children out in rows of one, two or three columns, in
source order. The mode sets the column count. Below the width its row needs, every mode
is rows of one column. The modes differ in nothing else.

| Mode | Class | Columns |
| :--- | :--- | :--- |
| Prose | `.content-prose` | 1 |
| Golden | `.content-golden` | 2 |
| Triad | `.content-triad` | 3 |

The mode classes are the public selection mechanism, and a container carries exactly one.

A container requires one thing of the box it sits in: an ancestor establishing an
inline-size containment context. The nearest such ancestor answers the mode query, and
nothing else about the surrounding box concerns the container.
`../app-main/spec.md` governs the frame that usually holds a sequence of containers. Any
other element establishing the context serves as well, down to a box the size of a card,
and containers may nest.

A container places and sizes its own children and reaches no deeper. What a child holds,
and how the child spaces it, belongs to the child.

`../surface/spec.md` governs a surface's inset and its `surface-area` query boundary.

Not governed here: auto-fill card grid listings, standalone canvas editors, button
action row geometry, and legacy `.content-columns` migration.

### Documentation

`apps/design/src/content/base/content-containers.mdx`.

### Constraints

`../spatial-system/spec.md` defines the measure `--cn-measure`, the rhythm `--cn-line`
and the gap `--cn-gap`.

The column measures form a phi family rounded to whole `--cn-grid` units, using
`phi = 1.618` and `phi squared = 2.618`:

| Name | Grid units | Measure | Use |
| :--- | :--- | :--- | :--- |
| Readable | 83 | `--cn-measure` (`41.5rem`) | The Prose column, and the Golden first column. |
| Medium | 51 | `25.5rem` | The Triad first column. |
| Small | 32 | `16.0rem` | The Golden second column, and both Triad secondaries. |

Medium plus Small is Readable: 51 + 32 = 83 grid units. A column keeps its measure when
the surrounding width exceeds what the row needs.

Children fill the columns of a row in source order and continue on the next row. A last
row holding fewer children than the mode has columns leaves the remaining columns empty.
No child count is invalid.

A container reaches through an `astro-island` child, which has no box, and takes each
element the island renders as a child in the island's place.
Direct `script`, `style` and `template` children take no column.

A child marked `.breakout` spans every column of its container, in every mode. It
begins a row of its own: a breakout starts at the first column, so a row already
holding children ends before it. Prose's column set fills the width offered, so a
breakout there takes that whole width; a centred Golden or Triad row is narrower than
the width offered, and a breakout spans the row.

A container makes each of its children an inline-size query boundary reporting the
width the child occupies, which for a breakout is the width of its container's
columns. The boundary is unnamed, so a component inside queries
the nearest box constraining it without naming anything: the child, or a nearer boundary
such as a surface between the two.

`--cn-line` separates the rows of a container, and follows the container itself.
`--cn-gap` is the inline gap between the columns of one row.

A container states the separation after itself on its own box, whatever the parent is.
The last container in a stack states it as every earlier container does, and a container
reached through an `astro-island` keeps it; the island states nothing. A container placed
among the children of another container states it there too, so both the rhythm of the
rows and the separation after the container apply.

A container adds no inset. The box it sits in states any page-edge inset.

Prose sets its one column at the smaller of Readable and the width offered, and centres
it.

Golden's row needs Readable, one `--cn-gap` and Small: 117 grid units, `58.5rem`.
Triad's row needs Medium, `--cn-gap`, Small, `--cn-gap` and Small: 119 grid units,
`59.5rem`. At or above that width the complete set of columns is centred in the width
offered, rather than aligning the first column with a Prose flow beside it. Below it the
mode is rows of one column filling the width offered, and that column does not take the
Prose cap. A container query condition cannot read a custom property, so the Golden
condition is written out as `58.5rem` and the Triad condition as `59.5rem`.

A child is as tall as its own content, and a row is as tall as its tallest child. A child
that must match the height of the one beside it states that itself.

A child box stays within its column, including where a descendant has an oversized
intrinsic width or unbreakable content. Overflow inside a child belongs to the child.

## Contract

### Definition of Done

- The book renders all three modes in a frame-sized and a card-sized box, a breakout in
  each mode, and a stack of containers nested inside a breakout.
- Human review accepts each mode in both box sizes at default and enlarged browser text
  sizes.

### Regression Guardrails

- Each wide-row condition equals the independently derived sum of its column grid units
  and gaps after any measure or spacing change.
- No rule of this capability selects below the direct children of a container.
- The query boundary sits on the child, not on the box the container sits in.
- A row of one column fills the width offered and does not take the Prose cap.
- A container states the separation after it, whatever the parent is and in every mode.
  No rule removes it from the last container in a stack.
- A breakout spans every column of its container, and the row it begins holds it
  alone.

### Scenarios

Run by `apps/design/e2e/content-container.spec.ts`.

```gherkin
Given identical containers in differently sized boxes within one viewport
When each container renders
Then each resolves its columns against the nearest inline-size containment context
```

```gherkin
Given a Prose container offered more than Readable
When it renders
Then its column is Readable, centred, with no inset
```

```gherkin
Given a Prose container offered less than Readable
When it renders
Then its column fills the width offered, with no inset
```

```gherkin
Given a Golden or Triad container offered the width its row needs
When it renders
Then its columns appear side by side in source order at their measures
And one --cn-gap separates adjacent columns
```

```gherkin
Given a Golden or Triad container offered one pixel less than its row needs
When it renders
Then its children stack in source order, each filling the width offered
And --cn-line separates adjacent rows
```

```gherkin
Given a Golden or Triad container offered more than its row needs
When it renders beside a Prose reference
Then the surplus falls equally outside the complete set of columns
And its first column is not aligned to the Prose flow
```

```gherkin
Given a container with more children than its mode has columns
When it renders
Then the children fill successive rows in source order
```

```gherkin
Given a container whose last row holds fewer children than its mode has columns
When it renders
Then each child keeps its column measure and the remaining columns are empty
```

```gherkin
Given a child marked breakout in any mode
When the container renders
Then that child spans every column of its row
```

```gherkin
Given script, style or template children between the children of a container
When it renders
Then they take no column, and each child keeps the column its ordinal assigns
```

```gherkin
Given an astro-island among the children of a container
When it renders
Then each element the island renders is a child in the island's place
```

```gherkin
Given a component inside a child of a container
When it queries inline size without naming a container
Then the query resolves against the width of the column that child occupies
```

```gherkin
Given children of one row whose content differs in height
When the container renders
Then each child ends at its own content
And the row is as tall as its tallest child
```

```gherkin
Given a child holding oversized intrinsic or unbreakable content
When the container renders
Then the child box keeps the width of its column
```

```gherkin
Given containers stacked in a parent that states no separation
And one of them is reached through an astro-island
When they render
Then --cn-line separates each from the next
And the last carries --cn-line after it
```

```gherkin
Given a container placed among the children of another container
When the outer container renders
Then the inner container states the separation after it as it does in any parent
```
