# Reply Authoring

A plan coordinates an active epic. It is transient: it may carry behaviour while the
epic runs — behaviour that outlives the epic lands in a spec — and it may be deleted
after the epic closes. Its entries keep the goal and the remaining work legible, not
a delivery record.

## Goal

Readers create and edit replies through a local authoring dock in application chrome,
so discussion no longer depends on Cyan's reply dialog while retaining v18's Markdown,
attachment and write behaviour in v20's reply composition.

**Resumed, 2026-08-20.** `plans/fields.md` closed, the bar is the field, and the thread's
composer is migrated. `specs/pelilauta/reply-authoring/spec.md` carries what a reader now
meets on a thread.

**Amended, 2026-08-20.** Post-v19 there is no reply button: a signed-in reader has the
bar, and a reader who is not signed in has an invitation to join the discussion where the
button was. Creation no longer opens or closes anything, so the focus criterion below
belongs to editing alone.

## Success criteria

- No Pelilauta surface renders `cn-reply-dialog`. **Done.**
- A thread mounts reply authoring in `CnAppChrome`, independent of the thread content's
  layout and scroll position.
- Reply creation and editing share one local chat bar, with existing reply content
  prefilled for editing. **Done.**
- The chat bar retains Markdown entry, image selection and preview, disabled in-flight
  controls, successful clearing and failure recovery without losing the draft.
- The dock remains reachable above the virtual keyboard on a narrow viewport and does
  not obscure the end of the reply column on a wide viewport.
- Editing moves focus into the authoring control and returns it to the invoker on close;
  keyboard operation reaches every authoring action. Creation has no invoker: the bar is
  already there.

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
