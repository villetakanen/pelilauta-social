---
status: draft
---

# Rail

## Blueprint

### Context

A drawer beside the page, holding the places a reader reaches from where they are. Which
places those are belongs to the page, and changes as the reader moves.

### Architecture

An Astro component, `packages/design-system/components/CnRail.astro`: the trigger, the
drawer, the scrim and three boxes an application fills — `header`, the default slot and
`footer`. A box is spacing, not a surface: it paints nothing, and one holding no content
does not render, so an empty header or footer leaves neither space nor a line behind it.
The footer draws a line above itself, so that line only ever marks a boundary that
exists.

Each box stacks what it holds in a column. A chrome action is an inline-level box, so a
block container would let a collapsed rail's entries pack into rows and rewrap while the
rail travels between its widths.

An entry, and the trigger, follow the target, state surface, focus treatment and
current-destination state of a chrome action per
`specs/design-system/chrome-actions/spec.md`.

The rail stands in the box `specs/design-system/application-chrome/spec.md` fixes over
the document, and spans its block size. It renders a navigation landmark, which the
consumer names. The host marks its scope with `data-cn-rail-scope`.

The rail works in that box and nowhere else. Its widths and its two states answer the
`app-chrome` container, not the window, so a rail mounted outside one keeps none of them:
both of its controls stand at once, and it holds one width at every window. A composition
that wants a rail — a book specimen as much as an application — establishes the container
first, and its inline size then decides which state the rail rests in.

A modal page carries no rail.

### Constraints

The rail rests at a size that depends on the container's inline size, and one control asks
for the other size. The rail is open where its entries show their names, whether it covers
the page or stands beside it.

| Inline size | Resting | Asked for |
| :--- | :--- | :--- |
| `--cn-breakpoint-small` and narrower | Absent | Open, covering the page over a scrim |
| Wider, and narrower than `--cn-breakpoint-tablet` | Collapsed | Open, covering the page over a scrim |
| `--cn-breakpoint-tablet` and wider | Expanded beside the page | Collapsed |

`--cn-width-rail-collapsed` and `--cn-width-rail-expanded` name the two widths, taking
Material 3's words for the collapsed and expanded rail. `--cn-z-rail` fixes the rail's
stacking.

Two checkboxes carry that request, each with its own trigger: one pair for inline sizes
narrower than `--cn-breakpoint-tablet`, one for the rest. The container displays one pair
and removes the other from view, from the tab order and from assistive technology, so one
trigger stands at each inline size. The narrower checkbox rests unchecked and the wider
checked, and a document states either in the markup it serves. Crossing between them
leaves each checkbox at the state it held, and leaves focus where the document puts it
when the control holding it goes.

The checkbox is the control: it takes the focus, carries the name, and reports whether it
is checked, which is this capability's disclosure. It is hidden from view and from
nothing else. Its trigger draws it as two bars, which cross while it is checked, and
shows the focus the checkbox takes. The trigger is compact in every mode, and stands
at the rail's block start — and in the application bar's reserved leading slot at the
inline size where the rail is absent at rest.

An absent rail is out of the tab order and out of assistive technology.

Each box insets its contents on all four sides by what the collapsed rail leaves around a
chrome action's target, `(--cn-width-rail-collapsed − 7 × --cn-grid) / 2`, and holds that
inset in every state. `--cn-gap` is too wide to be that inset: at the gap the target does
not fit the rail's width.

The application bar and the main region cede the inline size of a collapsed or expanded
rail standing beside the page, and cede nothing to one covering the page. The main region
reads the request from a scope the application marks, so a rail a book renders moves
nothing around it.

A rail covering the page rests at elevation 4, above its scrim, and both stand above the
application bar and above a floating action. A collapsed or expanded rail beside the page
paints at elevation 0 and carries no border. The scrim takes a published colour role,
covers the page beneath a covering rail, and closes it.

A rail travels between its two widths, and takes them without travelling where the reader
asks for no motion.

Opening and closing need no script, by pointer or by keyboard. `Escape` closes a covering
rail and returns focus to the trigger, and focus stays within a covering rail and its
trigger; both need script, and the mode they act on is the pair the container displays.

## Contract

### Definition of Done

- `packages/design-system/styles/units.css` publishes the rail's two widths and its
  stacking, and the scrim's stacking and colour role are published where the other design
  tokens are.
- A **Rail** book renders the rail at each breakpoint, resting and asked-for, with header,
  body and footer entries, in Light and Dark.
- A browser check confirms the widths, the boxes, the checkbox contract, the keyboard,
  the focus and the landmark above, at each breakpoint.
- `packages/design-system/test/color-contrast.test.ts` measures the indicator against
  the surfaces an entry stands on here.
- Human review accepts that the rail reads as one surface at every breakpoint, that a reader
  who opens it on a phone can dismiss it without hunting, that a rail open beside the
  page reads as separate from the page, and that the footer reads as the reader's own
  rather than as another entry.

### Regression Guardrails

- The rail states no entry of its own, and no measurement an entry or a chrome action
  carries.
- The rail reads nothing from storage, and no window size from script.
- A covering rail never moves the main region, and a rail the main region cedes to never
  covers it.

### Scenarios

```gherkin
Given the container's inline size at the small breakpoint
When the page renders
Then no navigation stands beside the page
And the trigger stands in the application bar
```

```gherkin
Given the container's inline size at the tablet breakpoint
When the page renders
Then the rail is expanded beside the page
And the application bar and the main region cede its inline size
And no scrim renders
```

```gherkin
Given the container's inline size between the two breakpoints
When the reader asks for the other size
Then the rail covers the page over a scrim
And the main region cedes only the collapsed rail's inline size
```

```gherkin
Given a covering rail
When the reader presses the scrim, and then reopens it and presses Escape
Then the rail closes each time
And focus is on the trigger
```

```gherkin
Given a rail resting collapsed
When it renders
Then its entries show their icons alone
```

```gherkin
Given a header or a footer holding no content
When the rail renders
Then it takes no space and draws no line
```

```gherkin
Given a book page rendering a rail in its own content
When the reader opens that rail
Then nothing around it moves
```
