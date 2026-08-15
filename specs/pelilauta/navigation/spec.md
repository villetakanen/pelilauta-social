---
status: draft
---

# Navigation

## Blueprint

### Context

A reader is always inside one of Pelilauta's contexts, and the navigation beside the page
holds where they can go within it. The contexts are isolated: a site is an application of
its own, and no control carries a reader between contexts from a place that is always
visible. A reader arrives in a context by a link or a search result and leaves it the same
way.

A page that declares no context of its own is in the root context, which is where a reader
who has entered nothing stands.

### Architecture

`specs/design-system/tray/spec.md` and `specs/design-system/chrome-actions/spec.md` own
the navigation's surface, its entries' presentation, its responsive behaviour and its
interaction. This spec states none of them.

Pelilauta states which context a route is in, the entries that context holds, their order,
which route makes an entry current, and who sees each one. A context that is not the root
replaces the root context's entries rather than adding to them.

### Constraints

The root context's entries, in order:

| Entry | Destination | Current on | Seen by | Region |
| :--- | :--- | :--- | :--- | :--- |
| Front page | `/` | `/` alone | everyone | entries |
| Forum | `/channels` | `/channels` and `/threads/` | everyone | entries |
| Library | `/library` | `/library` | everyone | entries |
| Admin | `/admin` | `/admin` | a reader holding the admin tools | entries |
| Docs | `/docs/01-index` | `/docs` | everyone | entries |
| Inbox | `/inbox` | `/inbox` | a signed-in reader | reader |
| Identity | `/settings`, or `/login` while signed out | `/settings` | everyone | reader |

A route in the "Current on" column matches itself and everything below it, except where the
column says otherwise.

An entry a reader may not use is absent rather than disabled: the entries state where this
reader can go, and a destination they cannot reach is not one of those places.

## Contract

### Definition of Done

- Human review accepts that a reader recognises, from the navigation alone, which context
  they are in and which of its places they are on.
- An entry's destination, and whether it is current, follow the table above on every route
  in the root context.
- A signed-out reader is offered a way in, and a signed-in reader reaches their own part of
  the application, from the reader's region.

### Regression Guardrails

- No context shows a persistent control leading to another context.
- The navigation's entries carry no measurement, responsive rule or interaction of their
  own; those belong to the design system's specs.
- A reader whose session changes — signing in or out, gaining or losing the admin tools —
  sees the entry set follow, without reloading the page.
- Route matching stays independent of the entry's own destination: an entry is current on
  the routes named above and on no others.

### Scenarios

```gherkin
Given a signed-out reader on the front page
When the navigation renders
Then it holds the front page, the forum, the library and the docs
And the front page is the current destination
And the reader's region offers a way to sign in
```

```gherkin
Given a signed-in reader reading a thread
When the navigation renders
Then the forum is the current destination
And the reader's region carries their own name, and their inbox
```

```gherkin
Given a reader in a site
When the navigation renders
Then it holds the site's own entries
And no entry leads to the root context
```
