---
status: draft
---

# Rail

## Blueprint

### Context

A drawer beside the page, holding the places a reader reaches from where they are. Which
places those are belongs to the page, and changes as the reader moves.

### Architecture

Two Astro components. `packages/design-system/components/CnRailAction.astro` is the
chrome action that opens and closes the rail: the toggles and their triggers, working
the same alone in a book as mounted in the rail.
`packages/design-system/components/CnRail.astro` mounts it, and adds the drawer, the
scrim and three boxes an application fills — `header`, the default slot and `footer`.
A box is spacing, not a surface: it paints nothing, and one holding no content
does not render, so an empty header or footer leaves neither space nor a line behind it.
The footer draws a line above itself, so that line only ever marks a boundary that
exists.

Each box stacks what it holds in a column. A chrome action is an inline-level box, so a
block container would let a collapsed rail's entries pack into rows and rewrap while the
rail travels between its widths.

An entry follows the target, state surface, focus treatment and current-destination
state of a chrome action per `specs/design-system/chrome-actions/spec.md`. The trigger
composes that class for its target, state surface and transient states, stays compact
in every presentation, and shows on itself the focus its toggle takes.

The rail stands in the box `specs/design-system/application-chrome/spec.md` fixes over
the document, and spans its block size. It renders a navigation landmark, which the
consumer names. The host marks its scope with `data-cn-rail-scope`.

Beside the page, the rail begins where the application bar's target ends rather than
where its box does; `specs/design-system/components/cn-app-bar/spec.md` states why the
two differ. Starting at the box would carry that difference twice and leave the trigger
off the rhythm the entries below it keep.

The rail works in that box and nowhere else. Its widths and its two states answer the
`app-chrome` container, not the window, so a rail mounted outside one keeps none of them:
both of its controls stand at once, and it holds one width at every window. A composition
that wants a rail — a book specimen as much as an application — establishes the container
first, and its inline size then decides which state the rail rests in.

A modal page carries no rail.

### Documentation

- `apps/design/src/content/components/cn-rail.mdx`
- `apps/design/src/content/components/cn-rail-action.mdx`

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

Two toggles carry that ask, each with its own trigger: one pair for inline
sizes narrower than `--cn-breakpoint-tablet`, one for the rest. The container displays one
pair and removes the other from view, from the tab order and from assistive technology,
so one trigger stands at each inline size. The narrower toggle rests unchecked and the
wider checked, and a document states either in the markup it serves. Crossing between
them leaves each toggle at the state it held, and leaves focus where the document puts it
when the control holding it goes. The toggles' classes and ids are the action's published
contract: they are what the rail, the scrim and the main region read.

The toggle is the control: it takes the focus, carries the name, and reports whether it
is checked, which is this capability's disclosure. It is hidden from view and from
nothing else. Its trigger draws `=` collapsed and `|<` expanded, turning
counter-clockwise in both directions, and shows the focus the toggle takes. A
transition has only two ends, so the resting pose cannot read `0deg` going out and
`-180deg` coming back; the glyph is therefore drawn twice, one copy per direction, and
only the copy in motion shows. The turn is a transition, not a keyframed animation: an
animation runs when its selector first matches, which includes the page arriving, so a
keyframed glyph would turn on every load. The trigger is compact in every mode, and
stands at the rail's block start — and in the application bar's reserved leading slot at
the inline size where the rail is absent at rest. Beside the page, it takes the boxes'
inset rather than centring in the rail's width, which would move it as the rail
widens and break the axis it shares with the entries below.

An absent rail is out of the tab order and out of assistive technology.

Each box insets its contents on all four sides by half of what the collapsed rail leaves
around a compact chrome action's target, and holds that inset in every state. `--cn-gap`
is too wide to be it: at the gap the target does not fit the rail's width.

The main region cedes the inline size of a collapsed or expanded rail standing beside the
page, and cedes nothing to one covering the page. It reads the rail, and its disclosure,
from a scope the application marks, so a rail a book renders moves nothing around it.

Covering the page and standing beside it are what decide the rail's surface, rather than
the inline size it rests at. A rail covering the page has one, at elevation 4, above its
scrim, and both stand above the application bar and above a floating action. A rail beside
the page has none: it paints nothing and carries no border, and whatever is behind it — a
poster, or the page's ground — is what shows. The scrim takes a published colour role,
covers the page beneath a covering rail, and closes it.

A rail travels between its two widths, and takes them without travelling where the reader
asks for no motion.

Opening and closing need no script, by pointer or by keyboard. `Escape` closes a covering
rail and returns focus to the toggle, and focus stays within a covering rail and its
toggle; both need script, and the mode they act on is the pair the container displays.

## Contract

### Definition of Done

- `packages/design-system/styles/units.css` publishes the rail's two widths and its
  stacking, and the scrim's stacking and colour role are published where the other design
  tokens are.
- A **Rail** book renders the rail at each breakpoint, resting and asked-for, with header,
  body and footer entries, in Light and Dark.
- A **Rail Action** book renders the action alone, in an `app-chrome` frame per band,
  in Light and Dark.
- A browser check confirms the action alone: one toggle per band, named and driven by
  pointer and keyboard, the other out of view, of the tab order and of assistive
  technology.
- A browser check confirms the widths, the boxes, the toggle contract, the keyboard,
  the focus and the landmark above, at each breakpoint.
- `packages/design-system/test/color-contrast.test.ts` measures the indicator against
  the surfaces an entry stands on here.
- Human review accepts that a reader who opens the rail on a phone can dismiss it without
  hunting, that a rail beside the page reads as navigation and not as the page's
  content while painting nothing, and that the footer reads as the reader's identity
  and inbox rather than as another entry.

### Regression Guardrails

- The rail states no entry of its own, and no measurement an entry or a chrome action
  carries.
- The rail reads nothing from storage, and no window size from script.
- A covering rail never moves the main region, and a rail the main region cedes to never
  covers it.

### Scenarios

```gherkin
Given the container's inline size at `--cn-breakpoint-small` or narrower
When the page renders
Then no navigation stands beside the page
And the trigger stands in the application bar
```

```gherkin
Given the container's inline size at `--cn-breakpoint-tablet` or wider
When the page renders
Then the rail is expanded beside the page
And the main region cedes its inline size
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
And focus is on the toggle
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
