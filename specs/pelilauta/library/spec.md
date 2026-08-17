---
status: draft
---

# Library

## Blueprint

### Context

The library gathers what a reader has on Pelilauta into one view: the games and sites they
made or play in, the notifications addressed to them, their account, and the data the
service holds about them. One place answers what a reader has here, and the same place
answers what the service knows about them — a reader obtains a copy of that data from it,
which is what regulation requires of the service.

It exists for one reader at a time, and has nothing to show a reader who is not signed in.
A page about somebody, such as a profile, is not a reader's material and belongs to the
base application.

### Architecture

The library application lives under `apps/pelilauta/src/library`, reached as
`@pelilauta/library`. Its layout is `apps/pelilauta/src/layouts/Library.astro` and its
rail is `chrome/LibraryRail.astro`. Its strings are the `library` locale namespace.

It carries `specs/pelilauta/base/base-bar`, whole, so its pages show the service's
identity rather than one of its own.

A page of the library establishes the session itself; the layout takes no part in it.
`/library` and `/settings` verify it on the server and send a reader without one away.
`/inbox` renders and lets its own island refuse, which is v18's behaviour and not this
application's decision to change.

### Constraints

The library holds three of v18's pages, whose addresses do not move: `/library`,
`/inbox` and `/settings`.

None of them interrupts a reader. Each is somewhere a reader settles into, so each is a
place of this application rather than a modal page.

## Contract

### Definition of Done

- A reader reaches their sites, their notifications and their account from anywhere inside
  the library.
- A reader who is not signed in is shown none of another reader's material.

### Regression Guardrails

- The three addresses stay as v18 serves them.
- No page of the library takes `ModalPage.astro`.

### Scenarios

```gherkin
Given a reader who is not signed in
When they open the library's root
Then they are sent to the public directory of games
```
