# Pelilauta UX Spike

## Goal

Pelilauta's navigation model is settled against the running application rather than
inferred from v20. v19 and v20 intended the overhaul and neither shipped it, so there is
no predecessor to port: the spike buys the model with prototypes over Pelilauta itself.
The front page, one channel and one site carry the new chrome, and what that took becomes
the record `chrome.md` is rewritten against.

What the work will be is not knowable in advance. This file holds the goal and what has
been settled, and nothing else.

## Closed

Closed on 2026-08-17. The model is settled and the record below is what it bought. Five
applications carry it, and the goal's own measure — the front page, one channel and one
site — is met several times over.

What remains is not the model: `chrome.md` is still to be rewritten against this record,
the editor shell still carries Cyan's bar
(`debt/editor-page-keeps-the-cyan-bar.md`), the fifteen modal routes still state no guard
of their own, and two design-system findings the spike turned up wait in `debt`:
`chrome-action-presentation-has-one-consumer.md` and
`the-rail-trigger-is-not-its-own-component.md`.

## How it runs

A question about the model is answered by building it and looking. Where two candidates
both stand up, say so and leave it open rather than asking the owner to choose from
prose. A decision the owner states is written the same day into the artifact that owns
it, or the next session asks for it again. A spec here records what a prototype settled;
it is not a gate, and it reaches approval only once the part it describes stops moving.

## Settled

- Pelilauta consists of several applications. Each states its own chrome. How a reader
  moves from one application to another is undecided, and this work does not decide it.
  `specs/pelilauta/base/spec.md`.
- The navigation component is the rail, its two states named after Material 3's
  collapsed and expanded. It offers a header, a body and a footer; a box is spacing, and
  one holding nothing renders nothing. `specs/design-system/rail/spec.md`.
- The rail answers the chrome container rather than the window, and works nowhere else.
  `specs/design-system/application-chrome/spec.md`.
- An application is a directory under `apps/pelilauta/src`, a layout in
  `apps/pelilauta/src/layouts`, a bar, a rail and a locale namespace. A page belongs to it
  by taking its layout, and by nothing else. `specs/pelilauta/base/spec.md`.
- Five of them exist: the base, the library, a site, the documentation and administration.
  Each has a spec, and a spec for its rail, under `specs/pelilauta/`.
- A rail's entries belong to the application that mounts it. What a rail may hold — its own
  places, doors leading out, and entries a reader's role decides — is each rail spec's.
- The bar names either the service or the application. `specs/pelilauta/base/base-bar/spec.md`
  states the shared one; an application naming itself states its own.
- A page states its own guard and returns what it answers with.
  `apps/pelilauta/src/base/utils/requireSession.ts`, and `docs/ARCHITECTURE.md` records
  where v21 hardened what v18 left open.

## Outscoped

Routes and business rules, account-backed theme, the editor shell, and page content and
footers. `PageWithTray` was outscoped and then retired: the last route left it, so it went
with the trays it carried, and Cyan's bar survives in the editor shell alone.
