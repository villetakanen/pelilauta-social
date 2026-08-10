---
status: approved
---

# CnPosterCredits

## Blueprint

### Context

`CnPosterCredits` displays the copyright information of a page poster's artwork in the
document footer.

### Architecture

`CnPosterCredits` is an Astro component (`CnPosterCredits.astro`).

An application mounts it in the last slot of the document footer (a css container).
The note measures that container, not the viewport.

| parameter | optional | notes |
|---|---|---|
|`note` | no | the copyright text. |
|`href` | yes | link to copyright holder or license |

An empty `note` is omitted (emits nothing, and raises no server-side error).


### Constraints


The note adds a focus stop only when `href` is supplied.

## Contract

### Definition of Done

- `CnPosterCredits.astro` renders the supplied note as text, on the server, with no
  client-side JavaScript.
- `href` renders the note as a link, which is the only focus stop this capability adds.
- Both applications receive its styles through the design system's stylesheet entry
  point.
- The **CnPosterCredits** Component book teaches the capability and demonstrates the note
  linked and unlinked.

### Regression Guardrails

- `CnPoster` gains no focus stop, no pointer events and no accessible name from this
  capability.
- The design system declares no licence names, links or defaults.

### Scenarios

```gherkin
Given a page footer mounting a note without href
When the initial document renders without client-side JavaScript
Then the note is present in the accessibility tree
And the page has no focus stop it lacked without the note
```

```gherkin
Given a page footer mounting a note with href
When the reader traverses the page by keyboard
Then the note is one focus stop
And it leads to the supplied destination
```

```gherkin
Given a page footer mounting an empty note
When the page renders
Then no credits element is present
```
