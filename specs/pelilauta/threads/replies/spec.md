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

The initial HTML renders every public reply as an article with formatted body, attachments, public attribution, and known dates. Serialized properties alone do not satisfy this requirement. Attribution and date semantics follow [Thread Reading](../spec.md). Initial content renders without browser profile requests or Firebase initialization. [CnLightbox](../../../design-system/components/cn-lightbox/spec.md) governs how an attachment presents.

The initial and live reads both query replies ordered by creation time ascending, so the store returns reading order and the reply key breaks a tie. A record without a creation time falls outside that query and does not reach the discussion.

Anonymous readers receive server-rendered reply content without application-level browser data reads or live subscriptions. An unresolved session establishes no subscription. An active signed-in session subscribes to live additions, edits, and deletions. Sign-out, account changes, and page departures terminate active subscriptions and discard late results.

Removing a focused reply returns focus to the discussion heading.

Initial reply-read failure displays an unavailable-discussion state beside the opening post rather than an empty discussion. A malformed reply does not discard valid replies. The discussion indicates incomplete content when records fail parsing. A live subscription failure retains rendered content and indicates that updates are unavailable.

## Contract

### Definition of Done

- Anonymous readers read all replies and attribution without JavaScript.
- Anonymous readers receive a static snapshot.
- Signed-in readers receive live changes.
- Replies maintain deterministic chronological order across rendering, hydration, and edits.
- Live updates preserve focus.
- The interface distinguishes empty discussions, incomplete content, and unavailable updates.

### Regression Guardrails

- Listeners from previous pages or accounts never update the active conversation.
- A malformed record never clears valid replies.
- The reading contract renders every reply without pagination or truncation.
- The capability overrides no browser behaviour it relies on, including scroll anchoring during live updates and the scrolling a focus move performs.

### Scenarios

```gherkin
Feature: Thread Replies

  Scenario: Read all replies without JavaScript
    Given a public thread with three valid replies
    When an anonymous reader opens the thread with JavaScript disabled
    Then the document contains three reply articles with bodies and public attribution
    And an attachment presents in the initial document

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

  Scenario: Order replies with equal creation dates
    Given replies with identical creation times
    When the server or client orders the replies
    Then identical creation times sort by key
    And edit times do not alter order
    And a reply without a creation time does not appear

  Scenario: Restore focus after deleting a focused reply
    Given keyboard focus within a reply
    When deletion removes that reply
    Then focus moves to the discussion heading

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
