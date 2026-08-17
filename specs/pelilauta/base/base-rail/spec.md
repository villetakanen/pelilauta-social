---
status: draft
---

# Base Rail

## Blueprint

### Context

The navigation a reader reaches from anywhere inside the base application. It carries two
kinds of entry that look alike: the base application's places, and the doors leading
out of it. A reader who takes a door leaves, and the base rail is no longer what they are
looking at.

### Architecture

An Astro component, `apps/pelilauta/src/base/chrome/BaseRail.astro`, reached as
`@pelilauta/base/chrome/BaseRail.astro`. It wraps `CnRail` and supplies its entries;
`../../../design-system/rail/spec.md` and `../../../design-system/chrome-actions/spec.md`
govern everything about how they are drawn, placed and behave.

It renders on the server. The entries that depend on who is reading are islands, so the
rail arrives with the page and fills in what only the session knows.

### Constraints

The rail holds nothing a page reaches through its own content: the discussions entry
leads to the forum's root, and a channel is reached from there, not from here.

The base application's places. Each is a page taking `Base.astro`, so each can be the
one the reader is on:

| Entry | Leads to | Current on | Seen by |
| :--- | :--- | :--- | :--- |
| Etusivu | the base application's root | that root alone | a reader below `--cn-breakpoint-small` |
| Keskustelut | the discussions | the discussions and a thread | everyone |
| Pelit | the directory of games | that directory | everyone |

The doors. Each leads out of the base application, to another application or to a page
that interrupts the reader:

| Entry | Leads to | Seen by |
| :--- | :--- | :--- |
| Kirjasto | the reader's material | everyone |
| Info | the documentation | everyone |
| Ylläpito | administration | a reader holding the admin tools |

A door is never the current entry, and states nothing about being one. A reader who took
it is looking at the other application's rail, or at a modal page carrying none, so the
condition can never hold.

The rail's footer carries the reader's inbox and their identity. Both lead into the
reader's material, so both are doors, and the footer holds none of the base
application's places. What else stands there is being settled against the running
application, and is not fixed here.

An entry a reader may not use is absent rather than disabled: the rail states where this
reader can go, and a destination they cannot reach is not one of those places.

The entry leading to the base application's root stands only below
`--cn-breakpoint-small`, and takes `.only-on-small` to do it: below that breakpoint
nothing else would lead home. This is the one place where what the chrome carries
depends on how wide it is, and it is a deliberate exception to that rule rather than an
oversight.

None of the applications a door leads to offers a control returning to the base
application, which is what keeps them separate.

## Contract

### Definition of Done

- A reader inside the base application can reach every place above, and every door they
  may take.
- A reader on a phone can reach the base application's root.
- The rail states which of the base application's places the reader is on.

### Regression Guardrails

- The rail states no measurement, responsive rule or interaction of its own beyond the one
  exception above; those are the design system's.
- A door carries no current state, and nothing computes one for it.
- No entry leads to a page inside another application, only to its front door.
- `.only-on-small` appears here and nowhere else in this application.

### Scenarios

```gherkin
Given a reader viewing a thread
When the rail renders
Then the discussions entry is the current one
```

```gherkin
Given a chrome container narrower than --cn-breakpoint-small
When the rail renders
Then it carries an entry leading to the base application's root
And wider than that, it does not
```
