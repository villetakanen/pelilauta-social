# A card's title is a hardcoded h4 with bespoke styling

Status: Recorded 2026-08-23, found by the front-page triage in the deprecate-cyan epic

## What is wrong

`CnCard.svelte:94` renders `<h4 class="title">`, so a card's heading is level 4
wherever the card sits — correct on the front page's streams under their h3 column
headings, and wrong anywhere the card follows a different level.

Its `.title` also restates the four h4 tokens — size, weight, line, letter-spacing —
instead of composing the typography capability's heading treatment, so a card title
holds still while `text-h4` moves: the snippet flattening in `snippetHelpers` and every
heading around the card downshift together, and the card's own title does not.

## Remaining change

The title takes a design-system heading or its published class, not bespoke styling.
The mechanism is undecided — a level prop, a caller-supplied heading, or composing
`.text-h4` on whatever element the card renders — and the clamp-to-two-lines treatment
the title carries has to survive whichever one wins.
