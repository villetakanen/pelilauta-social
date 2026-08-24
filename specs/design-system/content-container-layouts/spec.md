---
status: live
---

# Content Container Layouts

## Blueprint

### Context

Pelilauta pages combine conversations, activity streams, reference material, and
supporting context. Content Container Layouts establish responsive inline and block
compositions for distinct page regions. A page may sequence content containers with
different layout modes. Comprehension and reading order take precedence over visual
engagement.

### Architecture

Content Container Layouts has four roles: host, container, region, and content area. A
host establishes an inline-size containment context and offers its full content-box
width. A content container inside that host selects one layout mode and arranges its own
regions. Each region holds the content assigned to one part of the composition. A content
area is where content is placed: an occupied Golden or Triad region, or a Prose flow
root.

The host governs the container's available width, placement, edge inset, and vertical
rhythm between sibling containers. The content container governs the inline and block
arrangement of its regions. Every content area arranges its content the same way,
whichever mode holds it. A mode differs in the width it offers a content area, not in
how that area lays its content out.

The application `<main>` bearing `.app-main` is the usual host for a sequence of
content containers, and provides `--cn-gap` page-edge inset at narrow widths. Chrome is
fixed and paints over the document, so the host also clears the application bar. The
consumer applies that class; Content Container Layouts never matches a bare `<main>`,
so a page that has not opted in keeps the layout it has. Any element that establishes
an inline-size containment context may host containers. A
content container may operate inside a smaller composition, including a card-sized
host, and may be nested when each container has a distinct host.

A Prose breakout may contain a source-ordered sequence of content containers and
establishes their nearest host.

The modes are:

| Mode | Class |
| :--- | :--- |
| Prose | `.content-prose` |
| Golden | `.content-golden` |
| Triad | `.content-triad` |

The mode classes are the public selection mechanism. A content container bears
exactly one. The container answers its responsive composition against its nearest
host.

Each content area establishes an inline-size query boundary for the components it
contains. The boundary reports the area's usable content-box width rather than the
width of the host or the complete content container.

The boundary is unnamed. A container query without a name resolves against the nearest
ancestor container, so a component inside a region asks about the area holding it
without naming anything, and a nearer boundary — a Surface between the component and
the region — is the one that answers, which is the one constraining it. Content
Container Layouts states no container name, and a component may not ask to skip a
nearer boundary and reach its region.

### Constraints

Readable is the measure, `--cn-measure`, which `../spatial-system/spec.md` defines.

The fixed measures form a phi family rounded to whole `--cn-grid` units, using
`phi = 1.618` and `phi squared = 2.618`:

| Name | Grid units | Measure | Use |
| :--- | :--- | :--- | :--- |
| Readable | 83 | `--cn-measure` (`41.5rem`) | Prose cap and Golden primary. |
| Medium | 51 | `25.5rem` | Triad primary. |
| Small | 32 | `16.0rem` | Golden secondary and both Triad secondaries. |

The family treats Medium plus Small as Readable (51 + 32 = 83 grid units). Fixed
regions retain their measures when excess width is available.

A content area places its direct children in one source-ordered flow, one below the
next, separated by `--cn-line`. It separates every child regardless of what the child
is; a child that belongs to the one above it closes that line itself. Content Container
Layouts adds no edge inset or padding to a content area.

`--cn-line` is the rhythm between the children of a content area, between stacked
regions, and between sibling content containers in a host. `--cn-gap` is the inline gap
between the regions of a wide composition, and the host's page-edge inset.

An `astro-island` child of a content area delegates its flow box and query boundary to
its one rendered element. An island that renders zero or multiple elements is invalid
authoring and has no layout guarantee.

`.content-prose` fills the width offered by its host and has exactly one direct flow
root (or is the flow root itself). That flow root is its content area, set at the
smaller of Readable and the width offered by the host, centred, with no responsive mode
change.

Any number of direct flow children may carry `.breakout`. For each breakout, the
nearest ancestor `.content-prose` determines its scope. The breakout receives
breakout layout only when it is a direct child of that Prose container's sole flow
root. It spans the width offered to that Prose container, after host padding, and
establishes the inline-size containment boundary. Arbitrary content
may occupy it, and Prose, Golden, and Triad containers may stack inside it. A
`.breakout` outside a Prose flow root has no layout guarantee.

Breakout is Prose's alone, and is the one way a content area in one mode differs from a
content area in another. Prose's content area sits inside a container that spans the
width its host offered, so a breakout has a container width to span that its content
area does not. A Golden or Triad region is itself one of its container's tracks, in
either composition, so a breakout there could span only the width the region already
has.

A Prose container with zero or multiple flow roots, or a container placed in a host
that narrows its content box below the host width, has no layout guarantee.

A Prose container nested in a Golden or Triad region adds no inset. When that region
is no wider than Readable, the Prose flow fills it.

Golden's wide composition consists of Readable (83 grid units), one `--cn-gap` (2 grid
units), and Small (32 grid units), totalling 117 grid units (`58.5rem`). Triad's wide
composition consists of Medium (51 grid units), one `--cn-gap` (2 grid units), Small
(32 grid units), another `--cn-gap` (2 grid units), and Small (32 grid units),
totalling 119 grid units (`59.5rem`). The complete track set is centred within the
width offered by the host. Centring applies to the complete track set rather than
aligning its primary region with a neighbouring Prose flow.

Golden or Triad uses its wide composition when the width offered by its host is equal
to or greater than the sum of its fixed regions and gaps. Below that point, its
regions stack in one elastic column that fills the host. A stacked region does not
inherit the Prose readable cap.

Container query conditions cannot read custom properties. The Golden condition
resolves at `58.5rem`. The Triad condition resolves at `59.5rem`.

A valid Golden container has exactly two layout-region elements. A valid Triad
container has exactly three. Direct `script`, `style`, and `template` children are
excluded from that count. An `astro-island` child counts as one region and delegates
the region box and its query boundary to its one rendered region element. Missing
or additional layout-region elements, including zero or multiple region elements from
one island, are invalid authoring and have no layout guarantee.

A region island renders exactly one region element in its fallback, empty, error, and
resolved states. The region therefore retains its track while deferred content
changes state.

A Golden or Triad region is as tall as its own content, and the composition is as tall
as its tallest region. A region does not stretch to the height of its neighbours, so a
short region that paints — a Surface, a bordered aside — ends where its content ends. A
region that wants its neighbour's height states that itself.

Golden and Triad region boxes remain within their assigned tracks, including when a
descendant has an oversized intrinsic width or unbreakable content. Descendant
overflow is governed by the region content. `.breakout` has no effect inside either mode
unless it belongs to a nested Prose flow. Source order is both reading order and
track order.

Not governed here: auto-fill card grid listings, standalone canvas editors, button
action row geometry, and legacy `.content-columns` migration.

Surface continues to govern a surface's inset, container type, and `surface-area` query
boundary. A content area that is also a Surface keeps that one boundary, under
Surface's name, and it reports the post-inset content-box width.

## Contract

### Definition of Done

- The Content Container Layouts book renders all three modes in main-sized and
  card-sized hosts and demonstrates a stack of nested modes inside a Prose breakout.
- Playwright renders Prose in `40rem` and `50rem` host content boxes. It verifies that
  the flow fills the narrower host without inset and is centred at Readable in the
  wider host.
- A padded host with a `50rem` content box verifies that a Prose breakout equals the
  host content-box width while its ordinary siblings remain at Readable.
- Playwright renders Golden and Triad at one pixel below their wide thresholds
  (`58.5rem` and `59.5rem`) and at equality at 16px and 20px root reference sizes. It
  derives those thresholds from the resolved grid units rather than from the condition
  literals in the stylesheet.
- At `10rem` above each wide threshold, Playwright verifies equal surplus space
  outside the complete track set and verifies that its primary does not align to a
  neighbouring Prose flow.
- At a host width of `50rem`, Playwright verifies that every stacked Golden and Triad
  region fills the host and exceeds Readable.
- Playwright measures fixed tracks and gaps with a tolerance of one rendered pixel at
  16px and 20px root reference sizes.
- Unnamed query probes report Readable for capped ordinary Prose content, the host
  content-box width for breakouts, and the assigned track width for every unpadded
  Golden and Triad region. A Surface region answers under `surface-area` with the
  content-box width remaining after Surface inset within its assigned track.
- Playwright renders Golden and Triad regions of unequal content height in the wide
  composition. Each region box ends at its own content, and the container is as tall
  as the tallest region.
- A fixed-track fixture places oversized intrinsic and unbreakable content in Golden
  and Triad regions. It verifies that each region box retains its assigned track
  width without requiring Content Container Layouts to contain descendant overflow.
- In the wide Golden and Triad compositions, a Prose container nested in each fixed
  region fills that region without adding inset.
- Playwright measures the rhythm between the children of a content area and finds
  `--cn-line` in Prose, and in Golden and Triad in both their compositions. One fixture
  gives a content area `astro-island` children, so the rhythm is measured where no child
  has a box of its own.
- A content area bearing `surface` answers an unnamed query and a `surface-area` query
  with the same post-inset width, and Content Container Layouts adds no second boundary
  that would shadow it.
- Playwright exercises Golden and Triad with direct `script`, `style`, and `template`
  siblings. A deferred `astro-island` fixture retains one region ordinal while it
  moves through fallback, empty, error, and resolved content states.
- Human review accepts each mode in both host sizes at default and enlarged browser
  text sizes.

### Regression Guardrails

- Each wide-mode condition equals the independently derived sum of its fixed grid
  units and gaps after any measure or spacing change.
- The query boundary remains on the content area rather than on the host; a query
  within a content area must not resolve against host width.
- Stacked Golden and Triad regions fill the host width.
- A content area's rhythm is `--cn-line` in every mode. A mode may differ in the width
  it offers a content area; only Prose differs by supporting breakout. No mode carries
  a rhythm of its own.
- Breakouts inside Golden and Triad regions remain contained within their track box.

### Scenarios

Run by `apps/design/e2e/content-container.spec.ts`.

```gherkin
Given identical content containers in differently sized hosts within one viewport
When each container renders
Then each responsive composition is selected from its nearest host width
```

```gherkin
Given a Prose host wider than Readable
When its one flow root renders
Then ordinary content is centred at Readable
And Prose adds no inline inset
```

```gherkin
Given a Prose host narrower than Readable
When its one flow root renders
Then ordinary content fills the host content box
And Prose adds no inline inset
```

```gherkin
Given a Prose flow root with ordinary content and direct breakout children
When it renders
Then ordinary content remains in the Prose flow
And every breakout spans the host content box
And source reading order is unchanged
```

```gherkin
Given Prose, Golden, and Triad containers stacked inside a breakout
When the nested containers render
Then the breakout is their nearest host
And each mode responds to the breakout width
```

```gherkin
Given a Prose container inside a Golden or Triad region no wider than Readable
When it renders
Then its flow fills the region
And it adds no inline inset
```

```gherkin
Given a Golden host whose width equals Readable plus one gap plus Small
When the Golden container renders
Then Readable and Small appear side by side in source order
```

```gherkin
Given a Golden host one pixel narrower than Readable plus one gap plus Small
When the Golden container renders
Then its two regions stack in source order
And the regions are separated by --cn-line
```

```gherkin
Given a Triad host whose width equals Medium plus two gaps plus two Small regions
When the Triad container renders
Then Medium is followed by two equal Small regions
```

```gherkin
Given a Triad host one pixel narrower than Medium plus two gaps plus two Small regions
When the Triad container renders
Then its three regions stack in source order
And adjacent regions are separated by --cn-line
```

```gherkin
Given a Golden or Triad host wider than its fixed regions and gaps
When the content container renders beside a Prose reference
Then surplus space is equal outside the complete track set
And its primary region is not aligned to the Prose flow
```

```gherkin
Given a Golden or Triad host wider than Readable but narrower than its wide threshold
When the content container renders
Then its regions stack
And every region fills the host content box
And every region is wider than Readable
```

```gherkin
Given script, style, or template children between valid Golden or Triad regions
When the container renders in its wide composition
Then each region occupies the track assigned by its ordinal among layout regions
```

```gherkin
Given the same blocks placed in a Prose flow root, a Golden region, and a Triad region
When each content container renders
Then the blocks are separated by --cn-line in all three
```

```gherkin
Given a content area whose children are astro-islands
When the islands render
Then each rendered element is a flow child separated by --cn-line
```

```gherkin
Given a content area holding a child that belongs to the one above it
When the content area renders
Then that child closes the line the area put between them
```

```gherkin
Given a component inside an occupied region, Prose flow, or breakout
When it queries inline size without naming a container
Then the query resolves against that area's usable content-box width
```

```gherkin
Given a content area that is also a Surface
When a descendant queries inline size unnamed, and queries surface-area
Then both queries resolve against that area's post-inset content-box width
```

```gherkin
Given a breakout whose nearest Prose container's sole flow root is not its parent
When the Prose container renders
Then the nested breakout receives no breakout layout
```

```gherkin
Given a Prose container hosted inside a breakout
And a breakout is a direct child of the nested Prose flow root
When both Prose containers render
Then the inner breakout spans the width offered to the nested Prose container
```

```gherkin
Given a breakout inside a Golden or Triad region
When the content container renders
Then the breakout remains within its assigned region
```

```gherkin
Given Golden or Triad regions whose content differs in height
When the content container renders in its wide composition
Then each region ends at its own content
And the container is as tall as its tallest region
```

```gherkin
Given oversized intrinsic or unbreakable content in a fixed Golden or Triad region
When the content container renders
Then the region box retains its assigned track width
```
