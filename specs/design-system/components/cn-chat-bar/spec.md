---
status: proposed
---

# CnChatBar

## Blueprint

### Context

A reader answering a conversation writes and edits Markdown replies to it. CnChatBar
gives that reader one place to compose, present wherever the conversation is, so
answering costs no navigation away from what is being answered. Where composing and
reading compete for the view, composing wins: the draft and its controls stay whole, and
the reading area yields.

### Architecture

A Svelte component, `packages/design-system/components/CnChatBar.svelte`, is a part of
the application chrome governed by `../../application-chrome/spec.md`. Surface,
responsive placement, Markdown textarea and action composition form one public
component; no separate anchor is a public capability.

The component is controlled. A consumer binds its value, supplies its disabled state,
accessible label and placeholder, and receives a send intent containing the current
value. Input updates the bound value. Sending does not clear the value or remove the
component. Supporting content and leading and trailing actions are consumer-supplied
regions; the consumer retains attachment state, write progress and errors.

The bar is the field `specs/design-system/fields/spec.md` governs, rather than a surface
holding one: it reads that spec's colour roles and paints its states, so the surface a
reader types into is one surface across the system. The control inside it draws nothing.

Wherever a consumer supplies items to add to a reply, the bar renders one action itself:
the `+` at the input row's inline start. What a reader adds is a menu, so the bar draws
the action and the surface — a `../cn-menu/spec.md` trigger — and the consumer writes the
items and names the action. A consumer that supplies no items gets no `+`.

### Documentation

- `apps/design/src/content/components/cn-chat-bar.mdx`

### Constraints

CnChatBar has no standalone placement. Its placement root participates in
`CnAppChrome`'s containing block and answers the `app-chrome` container rather than the
browser window. A layout-transparent `astro-island` may stand between the two in the DOM.

The surface stands at the chrome container's block end in every band, and grows toward
the block start with its content. `../../application-chrome/spec.md` ends that container
above an on-screen keyboard, so the surface stands above the keyboard rather than behind
it, and no band reserves space of its own for one.

In the small band the surface spans the container's inline size. Past
`--cn-breakpoint-small` it is centred, inset from the container's edges by `--cn-gap`, and
capped at `--cn-measure`.

Where a rail stands in the same chrome, the placement cedes the strip the rail occupies,
as the main region does, so the surface is centred on the content rather than on the
viewport. What the strip is worth is the rail's to say; whether one stands is asked of the
chrome, because a bounded composition inherits the occupancy from the page around it.

The surface grows until it reaches the application bar, and no further: a reader who
fills the area keeps the bar, and with it the way out.

The placement root spans the available inline size and takes no pointer input. Pointer
input resumes on the visible surface, so content remains reachable beside it.

The visible box composes Surface at elevation 3, which supplies the shadow and the tier
rather than a background: the fill, the indicator and their states are the field roles.
The indicator runs the whole way round the box, because the bar is a container a reader
types into and not a line of a form, and it follows whatever radius the band gives.

Hover moves the indicator alone and holds the fill where it rests; focus changes the fill
as well. Both cross over the interaction motion every control that answers a pointer
shares, and hold still under `prefers-reduced-motion: reduce`. The bar reads as one
object, so its whole box answers the pointer, and the actions inside it keep their
hover on top.

Past `--cn-breakpoint-small` the box is a pill at rest: its radius is half the resting
row, a length rather than a proportion, so a bar grown by its draft keeps that corner
instead of stretching it. Where the small presentation meets the container's inline
edges it takes no radius. `--cn-z-chat-bar` places it above `--cn-z-fab` and below
`--cn-z-scrim`.

The bar's box stands seven grid units tall at one line, the row
`../../actions/spec.md` gives a chrome action: the actions in the row set the bar's
height, where a field's box stands six units inside a row of seven. It grows three at
every line the draft adds. It states no padding of its own around the input row,
because the row's controls carry their padding; along the inline edges it keeps half a
unit, so a control at either end stands off the pill's curve. The supporting region
carries the space that separates it from the row, so a bar without one is no taller for
it.

The input row places the `+` where there is one, the leading actions, the textarea and the
trailing actions in inline order, and supporting content stands above that row. When the
surface cannot fit both regions, the supporting region scrolls while the input row remains
visible. When the three input-row regions cannot share one line, they wrap without
clipping or overlapping a control.

The textarea has the accessible name supplied by the consumer; its placeholder does not
name it. It begins at one line and grows with its content while the surface has room.
Once the surface reaches the application bar, the textarea scrolls in the space that is
left, and the input row stays operable there whatever the container's block size or the
reader's text size. The reader cannot resize it independently of the bar. The textarea
draws no border, background, radius or indicator, in any state.

The draft reads as a field's value: the mono family, at the size and the leading a field
takes. Its padding above and below the line totals four units and stands a quarter unit
toward the block start, because a reader measures a line by its lowercase and the face's
descent reserve otherwise sits it below the glyphs either side of it.

The bar draws no focus ring. Its own focus state is the focus indication, for the reason
`specs/design-system/fields/spec.md` carries: a focused text control matches
`:focus-visible` whichever way the reader reached it, so a ring meant for the keyboard
lands on every click.

Enter sends a non-empty value and inserts no newline. Shift+Enter inserts a newline and
sends nothing. Enter during text composition sends nothing. A value containing only
white space sends nothing.

The disabled state makes the textarea, the `+` where there is one, and every supplied
action inoperable, and suppresses send intent. Supplied actions are native buttons under
`../../actions/spec.md`, and so are the menu's items.

## Contract

### Definition of Done

- A **CnChatBar** Component book renders empty, multiline, supporting-content and
  disabled compositions inside bounded application chrome in Light and Dark.
- A reader can tell the bar is a field before touching it, and sees its hover and focus
  states in both schemes.
- The `+` opens its menu toward the block start, clear of the bar.
- Both presentations stand at their chrome container's block end, with supporting content
  above the input row.
- The small presentation spans its container's inline size; the wider one is centred and
  never exceeds Readable.
- A surface holding a draft longer than the area reaches the application bar and stops
  there, and its input row stays operable.
- The textarea and supplied actions remain operable at default and enlarged browser text
  sizes.
- `--cn-z-chat-bar` is published between the floating-action and scrim stacking roles.
- `packages/design-system/test/cn-chat-bar.test.ts` verifies what the rendered markup
  carries: the accessible name, the disabled state, the supplied regions, and the `+`
  with the consumer's items on the menu surface.
- `apps/design/e2e/cn-chat-bar.spec.ts` verifies both responsive geometries, bounded
  container response, pointer pass-through, the bar's focus state, and controlled
  input, send, newline, composition and disabled behaviour. Controlled long input, tall
  supporting content, short container block size and enlarged text verify textarea
  overflow, supporting-region overflow, input-row retention and action wrapping. A draft
  longer than the container verifies that the surface stops at the application bar.
- Actual-mobile review opens the virtual keyboard and confirms that the input row stands
  above it.
- Human review accepts the bar as part of application chrome in both responsive
  presentations and colour schemes.

### Regression Guardrails

- Responsive placement depends on the nearest `app-chrome` container. A bounded book
  composition does not take the browser window's presentation.
- The placement root does not intercept a pointer outside the visible surface, wherever
  the surface is smaller than the area.
- A send intent does not mutate the controlled value.
- Text composition never submits a partial input.
- Consumer-supplied controls remain native buttons; the bar adds no role or keyboard
  handler to them.
- Hover does not move the fill. A fill that moves under the pointer is the treatment
  `specs/design-system/fields/spec.md` measured and rejected.
- The control inside the bar paints no fill and no indicator in any state. A field's
  state rules tie an unscoped rule here on specificity, so the reset names the bar, and a
  state added to a field reaches inside it unless it is reset there as well.
- The radius stays a length. A proportion stretches the corner as the draft grows the bar.
- The surface stays clear of the rail. The rail stands above the bar in the stack, so a
  surface centred on the viewport loses its inline-start controls behind it at the widths
  where a collapsed rail is visible.
- The bar's row stays seven units at one line. Padding around the input row is what
  carried it past that before.

### Scenarios

```gherkin
Given a CnChatBar in an app-chrome container in the small band
When it renders
Then its surface stands at the container's block end
And it spans the container's inline size
And supporting content appears above the input row
```

```gherkin
Given a CnChatBar in an app-chrome container wider than the small band
When it renders
Then its surface is centred at the container's block end
And it is inset from the container's edges by --cn-gap
And its inline size does not exceed --cn-measure
```

```gherkin
Given identical chat bars in differently sized app-chrome containers in one window
When they render
Then each takes the presentation its own container calls for
```

```gherkin
Given a chat bar whose draft is longer than its container can show
When it renders
Then its surface reaches the application bar and grows no further
And the input row remains operable
```

```gherkin
Given a chat bar at rest
When a pointer rests anywhere on it
Then its indicator takes the hover colour and doubles in width
And its fill does not change
```

```gherkin
Given a chat bar
When a reader taps or tabs into its textarea
Then the bar takes the focus fill and the focus indicator
And no ring is drawn
```

```gherkin
Given a chat bar whose consumer supplies menu items
When the reader activates the `+`
Then the items open on a surface toward the bar's block start
And activating one performs it and closes the menu
```

```gherkin
Given a chat bar with one line of draft
When it renders past the small band
Then its box stands seven grid units tall
And its radius is half that row
```

```gherkin
Given a chat bar beside reachable document content
When a pointer presses outside the visible surface
Then the document beneath receives it
```

```gherkin
Given a focused chat bar containing "Hello"
When the reader presses Enter
Then one send intent reports "Hello"
And the controlled value remains "Hello"
And no newline is inserted
```

```gherkin
Given a chat bar whose consumer binds an empty value
When the reader types "Hello"
Then the consumer's value becomes "Hello"
```

```gherkin
Given a focused chat bar containing "Hello"
When the reader presses Shift+Enter
Then a newline is inserted
And no send intent occurs
```

```gherkin
Given a focused chat bar during text composition
When the reader presses Enter
Then no send intent occurs
And composition continues
```

```gherkin
Given a focused chat bar containing only white space
When the reader presses Enter
Then no send intent occurs
```

```gherkin
Given a disabled chat bar
When the reader types or presses Enter
Then its value does not change
And no send intent occurs
And its `+` and its supplied actions are disabled
```

```gherkin
Given a chat bar whose surface has reached the application bar
When the reader keeps typing
Then the textarea scrolls its content
And the surface does not grow
```

```gherkin
Given a small chat bar whose supporting content and input row exceed the available surface
When it renders
Then the supporting region scrolls
And the input row remains visible
And the surface remains inside the container
```
