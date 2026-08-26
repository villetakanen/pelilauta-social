---
status: proposed
---

# Reply Authoring

## Blueprint

### Context

A reader answering a thread is reading it at the same time. Composing is the act the
thread exists for, so it is present rather than summoned: a signed-in reader always has
somewhere to type, wherever the discussion has scrolled to. A reader who is not signed in
is invited to join instead, because the invitation belongs where the discussion ends
rather than in the chrome a member writes from.

### Architecture

`apps/pelilauta/src/components/svelte/discussion/ThreadChatBar.svelte` is an island the
thread page mounts in `CnAppChrome` through `Base.astro`'s `authoring` slot, so authoring
is chrome rather than page content and answers the chrome container's measure of an
on-screen keyboard. It composes `CnChatBar`, whose specification
`specs/design-system/components/cn-chat-bar/spec.md` carries.

`DiscussionSection.svelte` renders the replies and, for a reader who is not signed in, the
invitation to join. It renders no composer.

The write path is v18's and does not change: `submitReply` posts the draft, its quote
reference and its files to `/api/threads/add-reply`, and the discussion's subscription
brings the stored reply back. This capability decides what happens to the draft after the
write, and nothing about the write.

One bar writes and edits. A reply's edit action stands in the document and the bar stands
in chrome, so the reply the reader is editing travels between them through
`apps/pelilauta/src/stores/replyEditing.ts` rather than as a prop. `updateReply` writes the
change, on the path v18 already used.

### Documentation

None. The application carries the capability, and `CnChatBar`'s book carries the surface.

### Constraints

A signed-in reader on a thread has the chat bar, at the chrome container's block end,
whatever the thread's length or scroll position. No button opens it, and no dialog holds
it.

A reader who is not signed in has, at the end of the replies and in the document, one
invitation to join the discussion, which leads to `/login`. While the session is still
resolving, neither stands and the reader sees the loader the discussion already renders.

The draft clears where the write succeeded. Where it failed, the draft and its
attachments stay as the reader left them, and the bar reports the failure above its row,
so a second attempt costs nothing typed.

A reader editing a reply they wrote has the reply's text in the bar, the caret in it, and
a note above the row saying the bar is editing rather than answering, with the way out
beside it. Sending writes the change. An edit that ends outright, written or abandoned,
returns the focus to the trigger the reader opened the edit action from, because the
action itself is a row on a closed menu by then. The draft they were writing waits while
the edit borrows the bar, and comes back when it ends, so an edit costs the reader nothing
of a half-written answer.

The bar edits one reply at a time. A reader who starts editing a second reply leaves the
first, and what they had typed into it goes with it; the answer they were writing before
any edit still waits. One bar is what this capability chose, and two edits at once is what
the two dialogs it replaced could hold.

The bar carries no discard action for a new reply. A draft stands until the reader sends
it or empties it, and there is nothing to close: the dialog's cancel closed a surface this
capability no longer has.

A reader adds images through the bar's `+`, and the chosen files preview above the row
before the reply is sent. The files a reply carries are the ones the write path already
accepts.

While a reply is in flight the bar is inoperable, which is what keeps one draft from being
sent twice. An empty or blank draft is not sendable, so the send action is inoperable
until the reader has typed.

The reply's accessible name, its placeholder and the labels of its actions are the
application's translations.

## Contract

### Definition of Done

- A signed-in reader answers a thread from the bar, with no button and no dialog between
  them and the draft.
- A reader who is not signed in sees one invitation to join the discussion, at the end of
  the replies, and reaches `/login` from it.
- A reply carrying images reaches the thread, and the images preview before it is sent.
- A failed write leaves the draft and its attachments in place, with the failure shown.
- `apps/pelilauta/e2e/add-reply.spec.ts` drives the bar: a reply, a reply with an
  attachment, an empty draft that cannot be sent, and an unauthenticated write that is
  refused.
- A reader edits a reply they wrote in the same bar, and the answer they were writing is
  still there afterwards.
- No Pelilauta surface renders `cn-reply-dialog`.

### Regression Guardrails

- The write path, its endpoint and the discussion's subscription stay v18's. This
  capability changes where a reader types, not what happens to what they typed.
- The draft survives a failed write. Clearing on failure loses a reader's words.
- The composer stays out of the document. Rendered in flow it takes the thread's space and
  scrolls away from the reader who is using it.
- The focus returns to a control that is in the document. An edit action on a closed menu
  is `display: none`, and asking it for the focus fails silently.
- An edit and a new reply stay one bar. A second authoring surface is what this capability
  replaced.
- The invitation stays in the document. Rendered in chrome it would stand over a thread a
  reader has not joined.

### Scenarios

```gherkin
Given a signed-in reader on a thread
When the page renders
Then the chat bar stands at the chrome container's block end
And no reply button or dialog stands in the discussion
```

```gherkin
Given a reader who is not signed in on a thread
When the page renders
Then one invitation to join the discussion stands at the end of the replies
And it leads to /login
```

```gherkin
Given a signed-in reader with a draft in the bar
When the reply is written
Then the draft clears
And the reply appears in the discussion
```

```gherkin
Given a signed-in reader with a draft in the bar
When the write fails
Then the draft and its attachments stay
And the failure is reported above the row
```

```gherkin
Given a signed-in reader who has chosen an image from the bar's add action
When the bar renders
Then the image previews above the row
And sending carries the file to the write path
```

```gherkin
Given a signed-in reader with an empty draft
When the bar renders
Then the send action is inoperable
```

```gherkin
Given a reader who has written a reply
When they press its edit action
Then the bar carries the reply's text with the caret in it
And the bar says it is editing, with the way out beside it
```

```gherkin
Given a reader editing a reply, who had a half-written answer in the bar
When the edit ends, whether written or abandoned
Then the half-written answer is back in the bar
And the focus returns to the trigger the edit action was opened from
```

```gherkin
Given a reader editing one reply
When they start editing another
Then the bar carries the second reply
And the focus stays in the bar
```

```gherkin
Given a reader editing a reply
When the change is written
Then the reply shows it in the discussion
And the bar is answering again
```
