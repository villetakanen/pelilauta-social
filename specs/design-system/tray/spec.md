---
status: approved
---

# Tray

## Blueprint

### Context

A drawer beside the page, holding the places a reader reaches from where they are. Which
places those are belongs to the page, and changes as the reader moves.

### Architecture

An Astro component, `packages/design-system/components/CnTray.astro`: the trigger, the
drawer, the scrim and the rail the drawer collapses to. A consumer supplies the entries,
nests them where it needs to, and states which is current.

A second slot holds what an application keeps for the reader themselves, flush to the
tray's block end, in every mode and however few entries the page supplies.

An entry, and the trigger, follow the target, state surface, focus treatment and
current-destination state of a chrome action per
`specs/design-system/chrome-actions/spec.md`.

The tray stands in the box `specs/design-system/application-chrome/spec.md` fixes over
the document, and spans its block size. It renders a navigation landmark, which the
consumer names.

A modal page carries no tray.

### Constraints

The tray rests at a size that depends on the window, and one control asks for the other
size. The tray is open where its entries show their names, whether it covers the page or
stands beside it.

| Window | Resting | Asked for |
| :--- | :--- | :--- |
| `--cn-breakpoint-small` and narrower | Absent | Open, covering the page over a scrim |
| Wider, and narrower than `--cn-breakpoint-tablet` | A rail | Open, covering the page over a scrim |
| `--cn-breakpoint-tablet` and wider | Open beside the page | A rail |

Two checkboxes carry that request, each with its own trigger: one pair for the windows
narrower than `--cn-breakpoint-tablet`, one for the rest. The window displays one pair
and removes the other from view, from the tab order and from assistive technology, so one
trigger stands at each window. The narrower checkbox rests unchecked and the wider
checked, and a document states either in the markup it serves. Crossing between them
leaves each checkbox at the state it held, and leaves focus where the document puts it
when the control holding it goes.

The checkbox is the control: it takes the focus, carries the name, and reports whether it
is checked, which is this capability's disclosure. It is hidden from view and from
nothing else. Its trigger draws it as two bars, which cross while the tray is open, and
shows the focus the checkbox takes. The trigger is compact in every mode, and stands at
the tray's block start — and in the application bar's reserved leading slot at the window
where the tray is absent at rest.

An absent tray, and the nested entries a rail does not show, are out of the tab order and
out of assistive technology.

The application bar and the main region cede the inline size of a rail and of a tray open
beside the page, and cede nothing to one covering the page. The main region reads the
request from a scope the application marks, so a tray a book renders moves nothing around
it.

A tray covering the page rests at elevation 4, above its scrim, and both stand above the
application bar and above a floating action. A rail, and a tray open beside the page,
paint at elevation 0 and carry no border. The scrim takes a published colour role, covers
the page beneath a covering tray, and closes it.

A tray travels between its two sizes, and takes them without travelling where the reader
asks for no motion.

Opening and closing need no script, by pointer or by keyboard. `Escape` closes a covering
tray and returns focus to the trigger, and focus stays within a covering tray and its
trigger; both need script, and the mode they act on is the pair the window displays.

## Contract

### Definition of Done

- `packages/design-system/styles/units.css` publishes the rail's and the open tray's
  inline sizes, and the tray's and the scrim's stacking. The rail admits a compact
  entry's target and its inset. The scrim's colour role is published where the design
  tokens state the others.
- A **Tray** book renders each window in a frame of that window's width, resting and
  asked-for, with a nested entry and a block-end slot, in Light and Dark.
- A browser check asserts, at each window: the resting and the asked-for size; that one
  trigger stands, that its checkbox is focusable, named and reports its state, that the
  trigger shows that focus, and that the other pair is absent from view, from the tab
  order and from assistive technology; that the keyboard opens and closes the tray with
  scripting blocked; that an absent tray and a rail's nested entries are out of the tab
  order and out of assistive technology; that a covering tray renders a scrim which
  closes it, and that a tray open beside the page renders none; that the application bar
  and the main region cede a rail's and a beside-the-page tray's inline size and cede
  nothing to a covering one; that a covering tray and its scrim stand above the
  application bar and a floating action; that a covering tray holds focus and closes on
  `Escape`, returning focus to the trigger; that an open tray shows its names and its
  nested entries and a rail shows neither; that the block-end slot sits flush to the
  tray's block end; that a tray in the page's own content moves nothing around it; that
  the tray takes its size without travelling where the reader asks for no motion; and
  that the landmark carries its name.
- `packages/design-system/test/color-contrast.test.ts` measures the indicator against
  the surfaces an entry stands on here.
- Human review accepts that the tray reads as one surface at every window, that a reader
  who opens the tray on a phone can dismiss it without hunting, that an open tray beside
  the page reads as separate from the page, and that the block-end slot reads as the
  reader's own rather than as another entry.

### Regression Guardrails

- The tray states no entry of its own, and no measurement an entry or a chrome action
  carries.
- The tray reads nothing from storage, and no window size from script.
- A covering tray never moves the main region, and a tray the main region cedes to never
  covers it.

### Scenarios

```gherkin
Given a window at the small breakpoint
When the page renders
Then no navigation stands beside the page
And the trigger stands in the application bar
```

```gherkin
Given a window at the tablet breakpoint
When the page renders
Then the tray is open beside the page
And the application bar and the main region cede its inline size
And no scrim renders
```

```gherkin
Given a window between the two breakpoints
When the reader asks for the other size
Then the tray covers the page over a scrim
And the main region cedes only the rail's inline size
```

```gherkin
Given a covering tray
When the reader presses the scrim, and then reopens it and presses Escape
Then the tray closes each time
And focus is on the trigger
```

```gherkin
Given a tray resting as a rail
When it renders
Then its entries show their icons alone
And its nested entries are out of the tab order
```

```gherkin
Given a book page rendering a tray in its own content
When the reader opens that tray
Then nothing around it moves
```
