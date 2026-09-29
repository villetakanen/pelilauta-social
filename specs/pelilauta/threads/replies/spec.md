---
status: live
---

# Thread Replies

## Blueprint

### Context

A thread presents discussion contributions following the opening post. Anonymous readers receive a complete snapshot in the initial document. Signed-in readers receive live replies without page reloads.

### Architecture

The [thread page](../spec.md) prepares replies through the server discussion accessor and composes them into the initial document. `@pelilauta/threads/client/DiscussionSection.svelte` coordinates live enhancement with session state. `ReplyArticle.svelte` composes a reply from prepared content and public attribution.

Reply articles use [CnBubble](../../../design-system/components/cn-bubble/spec.md), [identity marks](../../../design-system/identity-mark/spec.md), [content area](../../../design-system/content-area/spec.md), and [CnLightbox](../../../design-system/components/cn-lightbox/spec.md). [Reply Authoring](../reply-authoring/spec.md) governs editing coordination and focus restoration. [Read State](../read-state/spec.md) governs destinations and read tracking.

### Constraints

The reading path uses the thread and comments collections under `ThreadSchema` and `ReplySchema` boundaries. Server and live reads normalize stored records without rewriting them.

The initial HTML renders every public reply as an article with formatted body, attachments, public attribution, and known dates. Serialized properties alone do not satisfy this requirement. Attribution and date semantics follow [Thread Reading](../spec.md). Initial content renders without browser profile requests or Firebase initialization. Each attachment provides a direct link to its full image without JavaScript. Application composition pairs this link with `CnLightbox` presentation.

Replies sort by creation time in ascending order, with reply keys breaking ties in ascending lexical order. A stored `flowTime` substitutes only when creation time is missing. Replies missing both sort by key before dated replies. An edit timestamp never replaces a missing creation time or alters reply order. Initial and live reads apply this ordering.

Anonymous reading creates no Firebase subscriptions for replies, attribution, or reactions. Anonymous readers receive no live updates. An unresolved session establishes no subscription. An active signed-in session subscribes to live additions, edits, and deletions. Sign-out, account changes, and page departures terminate active subscriptions and discard late results.

Hydration preserves initial articles. Live updates reconcile by reply key without replacing unaffected articles or replaying navigation. Content changes above the visible passage maintain its viewport position within the available scroll range. At a document boundary the viewport clamps to the nearest available position without artificial space. If the visible reply disappears, the next surviving reply becomes the reading anchor, or the preceding reply when none follows. An empty discussion uses its heading. Removing a focused reply returns focus to the discussion heading.

Initial reply-read failure displays an unavailable-discussion state beside the opening post rather than an empty discussion. A malformed reply does not discard valid replies. The discussion indicates incomplete content when records fail parsing. A live subscription failure retains rendered content and indicates that updates are unavailable.

## Contract

### Definition of Done

- Anonymous readers read all replies and attribution without JavaScript.
- Anonymous readers receive a static snapshot.
- Signed-in readers receive live changes.
- Replies maintain deterministic chronological order across rendering, hydration, and edits.
- Live updates preserve passage position and focus.
- The interface distinguishes empty discussions, incomplete content, and unavailable updates.

### Regression Guardrails

- Server and live rendering produce identical formatting and attachment content.
- Listeners from previous pages or accounts never update the active conversation.
- A malformed record never clears valid replies.
- The reading contract renders every reply without pagination or truncation.

### Scenarios

```gherkin
Feature: Thread Replies

  Scenario: Read all replies without JavaScript
    Given a public thread with three valid replies
    When an anonymous reader opens the thread with JavaScript disabled
    Then the document contains three reply articles with bodies and public attribution
    And attachment links provide direct image access without hydration

  Scenario: Read as an anonymous visitor with JavaScript enabled
    Given an anonymous reader viewing a thread
    When a new reply is published
    Then thread reading creates no Firebase subscriptions
    And the displayed discussion does not change
    When the reader reloads the page after the reply persists
    Then the new reply renders

  Scenario: Resolve a signed-in session after initial render
    Given server-rendered replies and an unresolved session
    When the session resolves to an active account
    Then live reply enhancement starts once
    And existing replies remain without duplicates

  Scenario: Preserve chronology after an edit
    Given replies A and B where creation of A precedes B
    When A is edited after creation of B
    Then A precedes B in live views and after reloads

  Scenario: Order replies with equal or missing creation dates
    Given replies with identical creation times and replies without creation times
    When the server or client orders the replies
    Then identical creation times sort by key
    And undated replies sort by stored flowTime or before dated replies
    And edit times do not alter order

  Scenario: Preserve passage position during live updates
    Given a signed-in reader focused on an unchanged reply
    When an earlier reply changes height or is removed
    Then the focused reply retains focus and viewport position within scroll bounds
    And the viewport does not jump to the latest reply

  Scenario: Re-anchor viewport at a scroll boundary
    Given a reader at the end of a discussion
    When deletion removes the active viewport target
    Then the viewport clamps to the nearest valid position without empty space
    And the next surviving reply becomes the reading anchor, or the preceding reply when none follows
    And an empty discussion uses its heading
    And removal of the focused reply moves focus to the discussion heading

  Scenario: Shorten the page above a surviving target
    Given a reader at the end of a discussion focused on a surviving reply
    When deletion of preceding content reduces the maximum scroll position
    Then the viewport clamps to the nearest available position without artificial space
    And focus remains on the surviving reply

  Scenario: Terminate a live subscription
    Given an active reply subscription
    When the reader signs out, changes accounts, or leaves the page
    Then the subscription terminates
    And late results do not update the discussion

  Scenario: Handle live update failure
    Given a signed-in reader with rendered replies
    When the live subscription fails
    Then rendered replies remain visible
    And the discussion displays an update-unavailable notice

  Scenario: Handle initial reply read failure
    Given a readable opening post
    When reply retrieval fails
    Then the opening post remains readable
    And the discussion displays an unavailability message

  Scenario: Encounter a malformed reply
    Given a thread with valid replies and one malformed record
    When the discussion renders or updates
    Then valid replies remain readable
    And the discussion indicates incomplete content
```
