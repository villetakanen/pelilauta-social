# Thread Presentation

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

Thread bodies, replies, reactions and their image previews run on local design-system
capabilities, so Cyan's bubble, lightbox and reaction elements — and the bridge rules
that keep them rendering — can leave the application without changing discussion
behaviour.

## Success criteria

- No Pelilauta surface renders `cn-bubble`, `cn-lightbox` or
  `cn-reaction-button`.
- Thread and reply images, including unsaved attachment previews, retain their inline
  presentation, captions and modal viewing through one local capability.
- A reply retains its article semantics, author association, own-reply variant and
  action composition through a local bubble.
- Reactions retain their count, pressed state and failure recovery on thread, reply,
  site and front-page surfaces through one local presentation control.
- `apps/pelilauta/src/styles/migrations/cyan-elements.css` carries no bubble,
  lightbox or reaction rule.

## Guardrails

- A design-system capability lands only after its specification is approved, booked
  and checked in `apps/design`.
- The application retains reaction persistence, optimistic updates and authentication;
  the design-system control receives state and reports activation.
- A lightbox exposes every image caption, supports keyboard operation, returns focus
  after modal viewing and leaves document scrolling available outside the modal.
- Firestore schemas, write paths, subscriptions, authorization and public URLs do not
  change.
- Thread and reply Markdown rendering, file upload and reply authoring keep their v18
  behaviour.

## Out of scope

- The reply dialog and its authoring behaviour.
- The editor shell and unsaved-work navigation.
- Story clocks, dice and sortable lists.
- The profile and avatar control.
- Application chrome and content-container migrations.
- A redesign of reactions or their persisted data.

## Possible work (non-binding)

- **Token-layer debts** — resolve the four token-layer debt files carried forward
  from Forms and Feedback before a component adds permanent token declarations.
- **CnBubble** — approve its spec from the v20 source, then ship and book the
  presentational component before migrating `ReplyArticle`.
- **CnLightbox** — approve its spec from the v20 source, then ship and book empty,
  single, multiple and modal image states before migrating all five consumers.
- **Reaction control** — specify and ship a controlled native-button presentation;
  keep Firebase state and failure handling in Pelilauta's `ReactionButton`.
- **Application migration** — replace the three Cyan elements at their call sites and
  remove each bridge section after its last consumer leaves.

