---
status: approved
---

# Floating Action Button and Tray

## Blueprint

### Context

A floating action button presents a view's prominent contextual action above its
content. The FAB tray keeps that action available at the lower inline-end corner of
the composition that owns it. On the application canvas this is the lower-right
corner of the full dynamic viewport; in a book specimen it is the lower-right corner
of the specimen. The containing composition, rather than the browser viewport,
determines both placement and responsive presentation.

### Architecture

The design-system CSS entry styles native `button.fab`, `a.fab[href]`, and
`a.button.fab[href]` elements and the tray, a `nav` carrying `fab-tray`, of which a
composition has one. Selection is by class rather than by identifier: a book page
renders the same tray once per colour scheme. No FAB component or
client-side behaviour mediates the contract. Element choice and navigation-versus-
command semantics remain defined by
`specs/design-system/links-and-actions/spec.md`.

The owning composition establishes an inline-size CSS container, which is also the
tray's containing block. The application shell provides one whose border box is
`100dvw` by `100dvh`; a design-book specimen provides a bounded container of its own.
The tray resolves its pinned position against that nearest owning container. It
neither escapes to the browser viewport nor depends on page-specific offsets. The
same tray markup therefore renders in an application shell and inside a demonstration
without a second placement mode.

The tray lays out its children. Individual FABs own their control geometry, visual
variants, and interaction states; they do not position themselves. Icon sizing is the
contextual sizing contract in `specs/design-system/components/cn-icon/spec.md`, and
an inline CnLoader retains the progress contract in
`specs/design-system/components/cn-loader/spec.md`.

### Constraints

A FAB contains an Icon or an inline CnLoader in the leading position. It may also
contain a visible text label in a trailing `span`. Icon-only and loader-only FABs
receive their accessible name from the control, not from the child. A labelled FAB
uses the button type role defined by `specs/design-system/buttons/spec.md` and keeps
its label on one line.

The FAB variants are mutually exclusive:

| Variant | Intended prominence | Surface and foreground |
| :--- | :--- | :--- |
| Default | The prominent contextual action. | `linear-gradient(in oklab 137deg, var(--cn-fab), var(--cn-fab-blend))` and `--cn-on-fab`. |
| `.cta` | The contextual action requiring the strongest attention. | `linear-gradient(in oklab 137deg, var(--cn-fab-cta), var(--cn-fab-cta-blend))` and `--cn-on-fab-cta`. |
| `.secondary` | A supporting action shown beside the prominent action. | `linear-gradient(in oklab -37deg, var(--cn-fab-secondary), var(--cn-fab-secondary-blend))` and `--cn-on-fab-secondary`. |

The standard FAB has a minimum inline size and a fixed block size of seven grid
units. The small modifier uses the regular button size for both measurements. A
labelled FAB may grow intrinsically in the inline direction and uses grid-derived
inline padding and content spacing. An icon-only or loader-only FAB has equal inline
and block sizes. Both sizes use the large radius and never stretch to consume flex or
grid space.

The resting FAB uses `--cn-shadow-elevation-1`. Hover uses
`--cn-shadow-elevation-4`, active uses `--cn-shadow-elevation-2`, and keyboard focus
adds the shared focus ring. Interaction feedback preserves the selected surface and
foreground rather than filtering either. State transitions use the shared UI
duration and easing roles and resolve without motion when the reader requests reduced
motion.

Only a native button FAB has disabled and loading states. A disabled FAB cannot be
activated or focused and is presented at half opacity. A command in flight is a
disabled FAB containing an inline CnLoader and retaining an accessible name that
describes the command. A link FAB is either navigable or absent; it does not acquire a
simulated disabled state.

The tray spans its container's inline size and aligns its children to the inline end,
rather than shrinking to its widest FAB. Its width is the room a FAB has, which is what
the responsive label below resolves against; pointer events pass through the spanned
area and resume on the FABs. The tray is inset from its container's block end and
inline end by `--cn-gap`. When
its owning application container also has persistent block-end navigation, that
navigation's occupied block size is added to the tray's block-end inset. Multiple
FABs form an inline-end-aligned vertical stack with `--cn-grid` between their occupied
boxes. The tray remains above ordinary page content and persistent navigation, and
below dialogs, modal surfaces, and transient system messages.

The FAB label responds to the width of the tray, and therefore of its owning
container, not to the browser window. In a container narrower than the small-screen
threshold the label is visually omitted and
the control retains its accessible name; in a wider container the label is visible.

## Contract

### Definition of Done

- Both applications receive FAB and tray presentation from the design-system CSS
  entry without a component wrapper or hydration.
- Default, CTA, secondary, and small FABs render the v20 visual language in Light and
  Dark as native buttons and as anchors with destinations.
- Standard, small, labelled, icon-only, labelled-loading, and loader-only
  compositions retain their accessible names and grid-derived geometry.
- Hover, active, keyboard-focus, disabled, loading, and reduced-motion states are
  observable in the applicable native elements.
- A tray occupies the lower-right corner of a dynamic-viewport-sized application
  container and the lower-right corner of a bounded design-book specimen.
- A tray avoids persistent block-end chrome and stacks multiple FABs upward without
  overlap.
- The **Links, Actions and Buttons** Base book renders every FAB variant, composition,
  and applicable state, plus a multi-action tray in a bounded container, from shipped
  source in Light and Dark.
- FAB and tray presentation no longer comes from the design site's editorial
  stylesheet, Cyan, or an application migration bridge.
- Human review accepts the variants, interaction feedback, responsive labels,
  stacking, and container-relative placement in both colour schemes.

### Regression Guardrails

- Presentation does not change an element's navigation, command, or form semantics.
- A FAB always carries an icon or loader, and an icon-only or loader-only FAB never
  depends on that child for the control's accessible name.
- FAB geometry remains fixed against flex and grid growth; a label changes intrinsic
  inline size without changing block size.
- A FAB state or variant does not introduce a legacy token, literal colour, or
  component-private icon size.
- Keyboard focus remains visible without colour perception, and reduced motion does
  not remove state feedback.
- The tray resolves against its nearest owning container. Changing the window size
  does not move a tray inside an unchanged bounded specimen, and containment does not
  strand an application tray against an inner content column.
- Responsive label visibility resolves against the owning container rather than the
  browser window.
- Page-specific FAB margins and positioning do not compete with tray placement.
- The tray does not cover persistent block-end navigation and does not rise above a
  dialog, modal surface, or transient system message.

### Scenarios

```gherkin
Given a native button FAB and an anchor FAB with a destination
And both use the same variant and content
When they render in either colour scheme
Then their geometry, typography, surface, foreground, and interaction feedback match
And the native button remains a command or form control
And the anchor remains navigation to its destination
```

```gherkin
Given a default, CTA, and secondary FAB
When each renders at rest, on hover, while active, and with keyboard focus
Then each state is visibly distinct where applicable
And each state preserves the selected variant's surface and foreground identity
And keyboard focus includes a visible focus ring
```

```gherkin
Given a standard FAB and a small FAB containing only an Icon
When they render in a flex or grid composition
Then each retains equal inline and block sizes for its selected size
And neither stretches into the available space
And each control has an accessible name describing its action or destination
```

```gherkin
Given a native FAB whose command is in flight
When it renders an inline CnLoader alone or before its label
Then the FAB is disabled and cannot be activated or focused
And the loader uses the small contextual size and exposes progress
And the FAB retains an accessible name describing the command
```

```gherkin
Given a FAB tray inside a container whose border box is smaller than the viewport
When the composition renders
Then the tray is inset from the container's lower-right corner by --cn-gap
And it remains inside the container when the viewport outside it changes size
```

```gherkin
Given the same FAB tray inside an application container sized to 100dvw by 100dvh
When the application renders
Then the tray is inset from the dynamic viewport's lower-right corner by --cn-gap
```

```gherkin
Given a container with persistent chrome occupying its block-end edge
When its FAB tray renders
Then the tray's block-end edge is above the chrome
And the tray remains inset from the container's inline-end edge by --cn-gap
```

```gherkin
Given a tray containing multiple FABs
When it renders
Then the FABs form an inline-end-aligned vertical stack
And adjacent occupied boxes are separated by --cn-grid
And no FAB overlaps another
```

```gherkin
Given the same labelled FAB in a narrow specimen container and a wide application container
When both render in the same browser window
Then the narrow specimen shows the icon-only presentation
And the wide application container shows the visible label
And both controls retain the same accessible name
```

```gherkin
Given a reader who requests reduced motion
When a FAB changes between interaction states
Then its state feedback appears without a transition
```
