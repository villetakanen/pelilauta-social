---
status: live
---

# Library

## Blueprint

### Context

The library gathers what a reader has on Pelilauta into one view: the games and sites they
made or play in, the notifications addressed to them, their account, and the data the
service holds about them. One place answers what a reader has here, and the same place
answers what the service knows about them — a reader obtains a copy of that data from it,
which is what regulation requires of the service.

It exists for one reader at a time, and shows a reader without a session none of another
reader's material.

A page about somebody, such as a profile, is not a reader's material and belongs to the
base application.

### Architecture

The library application lives under `apps/pelilauta/src/library`, reached as
`@pelilauta/library`. Its layout is `apps/pelilauta/src/layouts/Library.astro` and its
rail is `chrome/LibraryRail.astro`. Its strings are the `library` locale namespace.

It carries `specs/pelilauta/base/base-bar`, whole, so its pages show the service's
identity rather than one of its own.

Every library page guards its session through `@pelilauta/base/utils/requireSession`.
[Protected-document recovery](../session/protected-recovery.md) governs authentication
failures before protected library content renders. The layout performs no session check.

### Constraints

The library holds three of v18's pages, whose addresses do not move: `/library`,
`/inbox` and `/settings`.

None of them interrupts a reader. Each is somewhere a reader settles into, so each is a
place of this application rather than a modal page.

## Contract

### Definition of Done

- A reader reaches their sites, their notifications and their account from anywhere inside
  the library.
- A reader without a verified session receives no protected library content.

### Regression Guardrails

- The three addresses stay as v18 served them.
- No page of the library takes `ModalPage.astro`.

### Scenarios

```gherkin
Given a reader without a session
When the reader requests a library document
Then the server shows non-sensitive recovery content at the requested address
And the response carries HTTP 401 and no protected library content
```
