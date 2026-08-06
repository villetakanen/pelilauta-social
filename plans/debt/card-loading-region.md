# A Loading CnCard Has No Centred Region For Its Loader

Status: Recorded 2026-08-06 while reviewing the CnLoader release

## The intended model

A CnCard shows a loader in one of two places, and neither is its action row:

- the **content region**, while the card's own subject is still resolving — the card
  frame, title and cover are already known, the body is not;
- **inside a command's button**, as the inline variant, while that command is in
  flight. The loader belongs to the control, not to the row the control sits in.

The action row carries commands and metadata — buttons, icon buttons, reactions,
timestamps. A loader placed beside them is not a state of the row.

## What is missing

`packages/design-system/styles/loader.css` centres a loader that is a direct child
of `<section>` or `<article>`. CnCard's content region is `div.card-info`
(`packages/design-system/components/CnCard.svelte:113`), so the rule does not reach
the first case above, and the design system offers nothing else for it.
`apps/pelilauta/src/components/svelte/sites/SiteCard.svelte:47` therefore centres its
own loader with a local `.loading { display: flex; justify-content: center }`
(line 71) — the only card in Pelilauta that loads, working around the gap rather
than reporting it.

The second case waits on the button work in `plans/buttons-and-links.md`: a loader
inside a button needs the button's own loading state, which v21 has not specified.

## Where the actions-row idea came from

v20 states the opposite model in three places —
`../pelilauta-20/packages/cyan/src/components/cn-loader/cn-loader.css`,
`specs/cyan-ds/components/cn-loader/spec.md:116-121`, and its CnLoader book — naming
`article.cn-card > nav.actions` the canonical host. Its rationale is mechanical, not
editorial: the auto-centre rule matches a direct child of the article, the actions
snippet is the only consumer content that renders as one, and the children position
lands in `card-info` "where the auto-centre rule does not apply". The selector's
reach became the documented intent, and the case a product actually has was written
up as the pitfall.

v20 never demonstrated it. Its book passes `<CnLoader slot="actions" />` — a Svelte 4
slot attribute against a Svelte 5 snippet prop — so `nav.actions` is never rendered
on that page and the loader lands in `card-info` after all. Its e2e test asserts
centre-X only. The arithmetic was never checked either: the action row is
`calc(7 * var(--cn-grid))` = 56px in both versions, while a standalone loader with
the rule's block margin needs 72 + 2 × 24 = 120px, which the card clips.

v21 ported the rule during the CnLoader release, against `.actions` rather than
`nav.actions` because `specs/design-system/components/cn-card/spec.md:84` keeps that
row a neutral container. The review removed it instead.

## What done looks like

The CnLoader specification names the content region as the place a resolving card
shows its loader, and either the design system centres a loader there or CnCard's
content region is documented as a consumer responsibility. `SiteCard`'s local
`.loading` class is then either deleted or is the sanctioned pattern, not an
undocumented one.

A loader inside a card command is settled by the button loading state, not here.
