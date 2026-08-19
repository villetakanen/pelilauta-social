---
status: live
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

The surface grows until it reaches the application bar, and no further: a reader who
fills the area keeps the bar, and with it the way out.

The placement root spans the available inline size and takes no pointer input. Pointer
input resumes on the visible surface, so content remains reachable beside it.

The visible box composes Surface at elevation 3. It uses the large radius in wider bands
and no radius where the small presentation meets the container's inline edges.
`--cn-z-chat-bar` places it above `--cn-z-fab` and below `--cn-z-scrim`.

The input row places the leading actions, textarea and trailing actions in inline order,
and supporting content stands above that row. When the surface cannot fit both regions,
the supporting region scrolls while the input row remains visible. When the three
input-row regions cannot share one line, they wrap without clipping or overlapping a
control.

The textarea has the accessible name supplied by the consumer; its placeholder does not
name it. It begins at one line and grows with its content while the surface has room.
Once the surface reaches the application bar, the textarea scrolls in the space that is
left, and the input row stays operable there whatever the container's block size or the
reader's text size. The reader cannot resize it independently of the bar. The textarea
draws no border, background or radius. Keyboard focus draws `--cn-focus-ring` without
changing the bar's measurements.

Enter sends a non-empty value and inserts no newline. Shift+Enter inserts a newline and
sends nothing. Enter during text composition sends nothing. A value containing only
white space sends nothing.

The disabled state makes the textarea and every supplied action inoperable and suppresses
send intent. Supplied actions are native buttons under `../../actions/spec.md`.

## Contract

### Definition of Done

- A **CnChatBar** Component book renders empty, multiline, supporting-content and
  disabled compositions inside bounded application chrome in Light and Dark.
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
  carries: the accessible name, the disabled state and the supplied regions.
- `apps/design/e2e/cn-chat-bar.spec.ts` verifies both responsive geometries, bounded
  container response, pointer pass-through, focus indication, and controlled input,
  send, newline, composition and disabled behaviour. Controlled long input, tall
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
And its supplied actions are disabled
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
