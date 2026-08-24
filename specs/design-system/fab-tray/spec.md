---
status: live
---

# FAB Tray

## Blueprint

### Context

The tray keeps a view's floating actions reachable at the lower inline-end corner of
the composition that governs it. On the application canvas that composition is the full
dynamic viewport; in a book specimen, the specimen's bounded container is that
composition. The
governing composition, rather than the browser viewport, determines both placement and
responsive presentation. The tray places; the controls inside it are FABs under
`specs/design-system/actions/spec.md` and never position themselves.

### Architecture

The design-system CSS entry styles the tray, a `nav` carrying `fab-tray`, of which a
composition has one. Selection is by class rather than by identifier: a book page
renders the same tray once per colour scheme. No component or client-side behaviour
mediates the contract.

The governing composition establishes an inline-size CSS container, which is also the
tray's containing block. The application shell provides one whose border box is
`100dvw` by `100dvh`; a design-book specimen provides a bounded container of its own.
The tray resolves its pinned position against that nearest governing container. It
neither escapes to the browser viewport nor depends on page-specific offsets, so the
same tray markup renders in an application shell and inside a demonstration without a
second placement mode.

### Constraints

The tray spans its container's inline size and aligns its children to the inline end,
rather than shrinking to its widest FAB. Its width is the room a FAB has, which is
what the responsive label omission resolves against; pointer events pass through the
spanned area and resume on the FABs.

The tray is inset from its container's block end and inline end by `--cn-gap`. When
its governing application container also has persistent block-end navigation, that
navigation's occupied block size is added to the tray's block-end inset through
`--cn-block-end-chrome`. Multiple FABs form an inline-end-aligned vertical stack with
`--cn-grid` between their occupied boxes.

The tray remains above ordinary page content and persistent navigation, and below
dialogs, modal surfaces and transient system messages, at `--cn-z-fab`.

The tray decides when a FAB's visible label is omitted: in a container narrower than
the small-screen threshold the label is visually omitted, and in a wider container it
is visible. The control's promise that omission never costs the accessible name is
the actions capability's, and this specification does not restate it.

## Contract

### Definition of Done

- Both applications receive tray placement from the design-system CSS entry without
  a component wrapper or hydration.
- A tray occupies the lower inline-end corner of a dynamic-viewport-sized
  application container and of a bounded design-book specimen.
- A tray avoids persistent block-end chrome and stacks multiple FABs upward without
  overlap.
- The **Links, Actions and Buttons** Base book renders a multi-action tray in a
  window-sized shell and in a handheld-sized shell with persistent block-end
  navigation, from shipped source in Light and Dark.
- Tray placement no longer comes from the design site's editorial stylesheet, Cyan,
  or an application migration bridge.
- Human review accepts the responsive labels, stacking, chrome clearance and
  container-relative placement in both colour schemes.

### Regression Guardrails

- The tray resolves against its nearest governing container. Changing the window size
  does not move a tray inside an unchanged bounded specimen, and containment does
  not strand an application tray against an inner content column.
- Responsive label visibility resolves against the governing container rather than the
  browser window.
- Page-specific FAB margins and positioning do not compete with tray placement.
- The tray does not cover persistent block-end navigation and does not rise above a
  dialog, modal surface, or transient system message.
- The spanned tray area does not intercept pointer events between its FABs.

### Scenarios

```gherkin
Given a FAB tray inside a container whose border box is smaller than the viewport
When the composition renders
Then the tray is inset from the container's lower inline-end corner by --cn-gap
And it remains inside the container when the viewport outside it changes size
```

```gherkin
Given the same FAB tray inside an application container sized to 100dvw by 100dvh
When the application renders
Then the tray is inset from the dynamic viewport's lower inline-end corner by --cn-gap
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
