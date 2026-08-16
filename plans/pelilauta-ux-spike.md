# Pelilauta UX Spike

## Goal

Pelilauta's navigation model is settled against the running application rather than
inferred from v20. v19 and v20 intended the overhaul and neither shipped it, so there is
no predecessor to port: the spike buys the model with prototypes over Pelilauta itself.
The front page, one channel and one site carry the new chrome, and what that took becomes
the record `chrome.md` is rewritten against.

What the work will be is not knowable in advance. This file holds the goal and what has
been settled, and nothing else.

## How it runs

A question about the model is answered by building it and looking. Where two candidates
both stand up, say so and leave it open rather than asking the owner to choose from
prose. A decision the owner states is written the same day into the artifact that owns
it, or the next session asks for it again. A spec here records what a prototype settled;
it is not a gate, and it reaches approval only once the part it describes stops moving.

## Settled

- Pelilauta's contexts are isolated, and no control leads between them from anywhere
  always visible. A page declaring no context of its own is in the root context, whose
  entries are the pre-v19 global navigation. `specs/pelilauta/navigation/spec.md`.
- The navigation component is the rail, its two states named after Material 3's
  collapsed and expanded. It offers a header, a body and a footer; a box is spacing, and
  one holding nothing renders nothing. `specs/design-system/rail/spec.md`.
- The rail answers the chrome container rather than the window, and works nowhere else.
  `specs/design-system/application-chrome/spec.md`.

## Outscoped

Routes and business rules, account-backed theme, the editor shell, page content and
footers, and retiring `PageWithTray` with the rest of the Cyan sweep.
