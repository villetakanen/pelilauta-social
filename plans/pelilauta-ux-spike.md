# Pelilauta UX Spike

A plan coordinates an active epic. Its entries exist to make the work and what
remains legible, not as a delivery record. It may be deleted after the epic closes;
deletion is not a closeout requirement.

## Goal

Pelilauta's navigation model is settled against the running application rather than
inferred from v20. The front page, one channel and one site carry the new chrome, and
what that took becomes the record [Chrome](chrome.md) is rewritten against.

## Why this exists

v19 and v20 intended a navigation and semantic overhaul of an application whose
structure has stood since Pelilauta and the Mekanismi wiki merged. Neither shipped it.
The concepts are sound, but they are not something a chrome migration hoists into
place along the way — which is the lesson those releases actually delivered, and the
argument for v21's approach.

So there is no predecessor for this part. The chrome epic guessed the model from v20's
surface, and the guess is not load-bearing. This spike buys the model with prototypes
over Pelilauta itself.

## Success criterion

1. The front page carries the new chrome, and its navigation holds entries a reader
   recognises. What a page that supplies no entries of its own inherits is stated.
2. Page identity and the navigation trigger hold their places at every window:
   identity leading on tablet and desktop with the trigger below it; the trigger
   leading on mobile, with no identity.
3. A channel and a site render the same model, and every place it does not fit them is
   named — as a spec amendment, as debt, or as an accepted limit.
4. The navigation component carries a name from the platform vocabulary. The design
   system keeps no bespoke word where a common one says the same thing.
5. Each settled decision is recorded where it belongs: entries, routes and
   authorization in `specs/pelilauta/**`; measurement, geometry and interaction in the
   design-system spec that already owns them.
6. `plans/chrome.md` Phase 2 to 5 are rewritten against that record, and unpark.

## Method

Build forward. Each surface is prototyped in `apps/pelilauta` and merged once it
stands up, in the order the scope lists — the front page first, because it settles
what a default is, then the two surfaces expected to strain it.

Prototype names what is in question, not the standard of the work. The model is the
guess; the code answering it is ordinary work, and a wrong answer is reverted.

The design system supplies. Where a surface needs a chrome item that has not shipped,
it is drawn from `chrome-actions.md` and ships against its own spec, rather than being
improvised in the application.

## Spec form

A Pelilauta navigation spec states its entries, their order and nesting, route
matching, and authorized visibility. It states no measurement, no responsive
behaviour and no interaction, because the approved design-system specs own those and
restating them here would leave two places to maintain. That keeps these specs short
by construction rather than by exception.

## Known scope

Outcomes, not steps, in two lists. The set grows as the work finds more.

### Open

- **Front page chrome** — the front page renders the local bar and navigation, with
  the identity and trigger placement this plan fixes, at every window.
- **Default entries** — state what the front page's navigation holds, and what a page
  supplying none of its own inherits from it.
- **Reader's own region** — settle what the navigation's block-end slot holds, and
  whether it reads as the reader's rather than as another entry.
- **Channel pass** — a forum channel renders the model. Name what its own hierarchy
  asks for that the front page did not.
- **Site pass** — a site renders the model, anonymous and authorized. Name where an
  isolated area's up-and-out conflicts with local navigation.
- **Navigation naming** — settle the component's name against the platform vocabulary,
  then rename the spec, styles, design-site entry and the debt note together.
- **Record and unpark** — write the Pelilauta specs, amend the design-system specs the
  spike moved, and rewrite `plans/chrome.md` Phase 2 to 5.

### Done

## Outscoped

- Changing routes, functionality or business rules.
- Account-backed theme persistence and initial theme paint.
- The editor shell; `plans/debt/editor-page-keeps-the-cyan-bar.md` holds it.
- Redesigning page content, footers or content-container modes.
- Retiring `PageWithTray` and the remaining Cyan chrome sweep.
