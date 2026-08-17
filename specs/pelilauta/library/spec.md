---
status: approved
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

Every page of the library establishes the session itself, through
`@pelilauta/base/utils/requireSession`, and sends a reader without one to sign in. The
layout takes no part in it.

### Constraints

The library holds three of v18's pages, whose addresses do not move: `/library`,
`/inbox` and `/settings`.

None of them interrupts a reader. Each is somewhere a reader settles into, so each is a
place of this application rather than a modal page.

## Contract

### Definition of Done

- A reader reaches their sites, their notifications and their account from anywhere inside
  the library.
- A reader without a session reaches no page of the library.

### Regression Guardrails

- The three addresses stay as v18 serves them.
- No page of the library takes `ModalPage.astro`.

### Scenarios

```gherkin
Given a reader without a session
When they open a page of the library
Then they are sent away before it renders
```
