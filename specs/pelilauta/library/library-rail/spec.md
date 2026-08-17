---
status: draft
---

# Library Rail

## Blueprint

### Context

The navigation a reader reaches from anywhere inside the library. Every entry a reader
with a session sees is a place of the library, so unlike `../../base/base-rail/spec.md`
this rail carries no door onward. The identity offers a reader without a session the way
to sign in, which is the one entry leading out.

### Architecture

An Astro component, `apps/pelilauta/src/library/chrome/LibraryRail.astro`, reached as
`@pelilauta/library/chrome/LibraryRail.astro`. It wraps `CnRail` and supplies its
entries; `../../../design-system/rail/spec.md` and
`../../../design-system/chrome-actions/spec.md` govern everything about how they are
drawn, placed and behave.

The entries that depend on who is reading are islands, shared with the base rail. There
they lead out and state no current entry; here they are places of this application and
state one.

### Constraints

| Entry | Leads to | Current on | Stands in |
| :--- | :--- | :--- | :--- |
| Pelit | the reader's games and sites | that page alone | the default slot |
| Inbox | the reader's notifications | the notifications | the footer |
| Asetukset | the reader's account | the account | the footer |

The reader's notifications and account stand in the footer, as they do in the base
application.

A reader reaches Pelilauta through the bar's identity, which this application carries
from the base.

## Contract

### Definition of Done

- A reader inside the library reaches each of the three places from anywhere in it.
- The rail states which of them the reader is on.

### Regression Guardrails

- The rail states no measurement, responsive rule or interaction of its own; those are the
  design system's.
- For a reader with a session, no entry leads out of the library.

### Scenarios

```gherkin
Given a reader viewing their notifications
When the rail renders
Then the notifications entry is the current one
```
