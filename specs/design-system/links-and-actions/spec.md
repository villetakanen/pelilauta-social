---
status: approved
---

# Links and Actions

## Blueprint

### Context

Links take a reader to a destination. Actions submit data or run a command in the
current task. Element semantics take precedence over presentation: an anchor may look
like a button or floating action button without becoming a command, and a command
that redirects after completion remains an action.

### Architecture

The design-system CSS entry applies the default link presentation to native anchors
with destinations. Button and floating-action-button styles may replace that
presentation without changing the anchor's navigation behaviour.

The distinction is specified with native links because the same anchor may later use
button or floating-action-button presentation. Separate specifications define button
and FAB appearance, CnLoader progress indication, and FAB-tray placement.

The **Links, Actions and Buttons** Base book explains the element choice and renders
the default link presentation. Button and floating-action-button material is added to
the same book by their specifications.

### Constraints

An anchor with an `href` navigates to a document, resource or location. A button
submits, resets or runs a command. Navigation that occurs only after a successful
command does not turn its initiating button into a link. An anchor without an `href`
is not a link and does not receive the default link presentation.

Presentation classes do not change those semantics. An `a.button`, `a.fab` or
`a.button.fab` preserves its destination, accessible name and native link attributes
and behaviour. Consumers select the native element before applying a presentation
class.

A Cancel control that leaves an edit form for its view URL is an anchor presented as
a button. It uses the explicit view URL as its `href`; it does not traverse browser
history. A Cancel control that only dismisses an interface or resets local state is a
button.

The default native-link states are:

| State | Presentation |
| :--- | :--- |
| Resting | Underlined, using `--cn-link`. |
| Visited | The resting presentation; browsing history is not disclosed globally. |
| Hover | Underlined, using `--cn-link-hover`. |
| Active | Underlined, using `--cn-link-active`. |
| Keyboard focus | A visible outline using `--cn-focus-ring`, in addition to the current colour and underline. |

The colour system publishes the link and focus roles. Link presentation does not
introduce another colour value or change typography metrics.

A component may replace the resting underline or colour when its specification
defines a contextual treatment and preserves visible hover and keyboard-focus
feedback. The design system provides no generic class for removing or conditionally
restoring link decoration.

## Contract

### Definition of Done

- Both applications receive the default native-link presentation from the
  design-system CSS entry.
- The Base book explains navigation versus commands, documents every native-link
  state, and renders the default link in Light and Dark.
- Link presentation no longer comes from the design site's editorial stylesheet or
  from Cyan.
- Anchor-based buttons and floating action buttons retain native navigation and
  accessible identity when their later presentation is applied.
- No generic decoration-removal or hover-underline utility is published.
- Review accepts the resting, hover, active, visited and keyboard-focus treatments in
  both colour schemes.

### Regression Guardrails

- Presentation never converts navigation into a command or a command into navigation.
- The global presentation does not disclose whether a destination was visited.
- Keyboard focus remains visible without depending on colour alone.
- Button and floating-action-button presentation replaces the default link colour and
  underline without removing anchor behaviour.
- A component-specific link treatment does not become a global utility.

### Scenarios

```gherkin
Given an anchor with a destination and no presentation class
When it renders in either colour scheme
Then it is underlined and uses the resting link role
And hover, active and keyboard focus are visibly distinct
```

```gherkin
Given a previously visited anchor with a destination
When it renders
Then it uses the same presentation as an unvisited anchor
```

```gherkin
Given an anchor presented as a button or floating action button
When it is activated
Then it navigates to its destination
And its accessible name and native link attributes are preserved
```

```gherkin
Given a button that submits data or runs a command
When successful completion redirects to another page
Then the initiating control remains a button
```

```gherkin
Given an edit form whose Cancel control returns to its view URL
When the control renders
Then it is an anchor presented as a button
And its destination is the explicit view URL
And activating it does not submit the form
```

```gherkin
Given a component whose specification replaces the resting link presentation
When its link receives hover or keyboard focus
Then the component provides visible feedback for both states
```
