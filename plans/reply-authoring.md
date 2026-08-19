# Reply Authoring

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

Readers create and edit replies through a local authoring dock in application chrome,
so discussion no longer depends on Cyan's reply dialog while retaining v18's Markdown,
attachment and write behaviour in v20's reply composition.

**Parked, 2026-08-19.** `CnChatBar` cannot be finished while v21 owns no field.
`docs/chat-bar-field-study.md` settled what the bar's surface should do and proved the
question is not the bar's: the design system paints no field, and the book and the
application disagree about what one looks like. `plans/fields.md` restores fields; this
epic resumes when a field can be read.

## Success criteria

- No Pelilauta surface renders `cn-reply-dialog`.
- A thread mounts reply authoring in `CnAppChrome`, independent of the thread content's
  layout and scroll position.
- Reply creation and editing share one local chat bar, with existing reply content
  prefilled for editing.
- The chat bar retains Markdown entry, image selection and preview, disabled in-flight
  controls, successful clearing and failure recovery without losing the draft.
- The dock remains reachable above the virtual keyboard on a narrow viewport and does
  not obscure the end of the reply column on a wide viewport.
- Opening moves focus into the authoring control; closing returns focus to its invoker;
  keyboard operation reaches every authoring action.

## Guardrails

- A design-system capability lands only after its specification is live, booked and
  checked in `apps/design`.
- `CnChatBar` carries its surface, input, actions and placement inside `CnAppChrome`;
  no separate public anchor divides that composition.
- The application controls whether the dock is mounted, which reply it edits and what
  happens after a write.
- Application chrome remains transparent to pointer input outside its controls, and the
  document remains the scrolling element.
- Authentication, Firestore schemas, write paths, subscriptions, authorization and
  public URLs do not change.
- Closing an unsaved reply retains v18's discard behaviour; a failed write retains the
  draft for another attempt.
- Reply Markdown rendering, image upload and realtime list updates keep their v18
  behaviour.

## Out of scope

- Thread creation and editing.
- Page and handout editors.
- The editor shell and unsaved-page navigation.
- Rich-text or WYSIWYG authoring.
- Reply deletion and forking.
- Reaction presentation and persistence.
- Button touch-target and card action-row changes.

## Possible work (non-binding)

- **Chat bar contract** — specify `CnChatBar` as the v21 app-chrome part combining
  responsive placement, surface, controlled Markdown input and attachment and action
  regions.
- **Design-system delivery** — ship and book the component in bounded app-chrome
  compositions with browser checks for geometry, focus, keyboard and virtual-keyboard
  clearance.
- **Application composition** — give the thread one authoring state for create and
  edit modes while Pelilauta retains authentication, writes, attachments and errors.
- **Cyan retirement** — migrate `ReplyDialog` and `EditReplyDialog`, remove their Cyan
  element use and delete application code made redundant by the shared composition.

## Done
