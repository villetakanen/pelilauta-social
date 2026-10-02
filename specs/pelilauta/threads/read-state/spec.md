---
status: live
---

# Thread Read State and Navigation

## Blueprint

### Context

Returning readers distinguish previously opened threads from threads with newer activity and navigate directly to relevant content.

### Architecture

The [thread page](../spec.md) coordinates navigation with the user session and `@pelilauta/stores/subscription`. The `seenEntities` entry for a thread and `allSeenAt` define the reader read boundary. Thread `flowTime` defines activity time. [Replies](../replies/spec.md) governs discussion structure and live updates.

Thread lists and notifications link to `?jumpTo=unread#discussion`. Individual reply links use `/threads/{threadKey}#{replyKey}`.

### Constraints

An active signed-in session marks a thread open on page entry, including reloads and client-side transitions. Session resolution after entry records the original entry timestamp. For an existing subscription, delayed initialization does not advance the opening marker beyond entry time. Live updates and page dwell record no additional openings. Signing in or changing accounts records an opening for the new account at activation time. Sign-out discards pending writes and navigation for the previous account.

The effective read boundary is the later of the recorded thread opening and `allSeenAt`. A thread is read when the effective read boundary equals or exceeds its `flowTime`. Mark-all-read updates `allSeenAt`. Pending or failed read-state retrieval treats read status as unknown without asserting unread content. Anonymous readers write no read state. Write failures do not report persistence success or interrupt reading.

When no subscription record exists, subscription creation sets an initial `allSeenAt` baseline. Activity preceding subscription creation is considered read. First-time entry provides no previous read boundary for unread targeting. The opening marker records entry time without modifying subscription baseline behavior.

The page captures the previous effective read boundary before persisting a new opening. Read-state mutations apply only to the active account and never reuse boundaries from prior accounts. Recording an opening never regresses a later persisted boundary.

Read status consumes stored thread `flowTime` without deriving activity from reply edits or deletions. Mutation endpoints define `flowTime` updates. Unread targeting uses reply creation time.

The initial document exposes `#discussion` and `#discussion-title` at the discussion heading, alongside fragments for each reply key. Each reply displays a permalink. A latest-reply control links to the final reply, or to the discussion heading when no replies exist. These anchors function without JavaScript.

An explicit reply fragment takes precedence over `jumpTo=unread`. When `jumpTo=unread` is present without a reply fragment, navigation awaits the active account's prior read boundary and targets the earliest newer reply. If no replies are newer than the boundary, navigation targets the final reply. When a reader lacks a prior boundary, remains anonymous, or encounters retrieval failure, navigation targets the discussion heading. An empty discussion targets its heading.

Unread navigation executes at most once per page entry. User scrolling, focus changes, or navigation before state resolution cancel deferred navigation. Live updates never re-trigger unread navigation. An unknown reply fragment preserves document scroll position without redirecting to another reply.

Navigation targets clear fixed chrome. Navigation respects `prefers-reduced-motion` settings. Fragment targeting requires no timer-based scrolling after hydration.

## Contract

### Definition of Done

- Opening a thread records read status at entry time without requiring scrolling or dwell.
- Delayed session initialization preserves the entry timestamp and previous unread target.
- Readers navigate to the discussion heading, individual reply permalinks, the latest reply, and unread content.
- Deferred session and read-state resolution never disrupt user-initiated scrolling or focus.

### Regression Guardrails

- Live activity never advances the opening marker.
- Explicit mark-all-read actions and initial subscription baselines advance the effective read boundary.
- Persisting an opening marker preserves the previous boundary required for unread targeting.
- Navigation supports both discussion heading fragments and reply-key fragments.
- Read-state retrieval and persistence failures never block document reading.
- Read status excludes scroll-depth and time-spent metrics.

### Scenarios

```gherkin
Feature: Thread Read State and Navigation

  Scenario: Record read status on thread opening
    Given a signed-in reader with a read boundary before thread activity
    When the reader opens the thread
    Then the opening records a read boundary at entry time
    And read tracking requires no scrolling or dwell time

  Scenario: Resolve session after new activity
    Given page entry at time T with an unresolved session
    And an existing subscription read boundary before T
    And a new reply advancing thread activity after T
    When the signed-in session and read state resolve
    Then the opening records T rather than the resolution time
    And activity after T remains unread

  Scenario: Initialize a new subscription record
    Given page entry at time T without an existing subscription record
    When subscription initialization creates a baseline after T
    Then activity through that baseline is marked read
    And the initial entry provides no prior boundary for unread targeting
    And the thread opening marker records T

  Scenario: Activate a different account
    Given an active anonymous session or prior account
    When a new account activates at time T
    Then the new account records an opening at T
    And the new account isolates its read boundary and pending navigation

  Scenario: Evaluate mark-all-read state
    Given allSeenAt is later than thread activity
    And the thread has no individual opening marker
    When read state resolves
    Then the thread is marked read

  Scenario: Receive live reply with page open
    Given a signed-in reader who entered the thread at time T
    When a new reply advances activity after T
    Then the live reply does not advance the opening marker

  Scenario: Navigate to unread content
    Given a signed-in reader with a prior read boundary
    And replies newer than that boundary
    When the reader enters with jumpTo=unread
    Then the viewport targets the earliest newer reply once
    And recording the current opening preserves that target

  Scenario: Open reply permalink without JavaScript
    Given a URL with a reply-key fragment
    When the reader opens the page with JavaScript disabled
    Then the browser scrolls to that reply in the initial document
    And fixed chrome does not obscure the reply

  Scenario: Reach the latest reply
    Given a thread page with replies
    When the reader activates the latest-reply control
    Then the viewport targets the final reply
    And a discussion with no replies targets the discussion heading

  Scenario: Prioritize explicit reply fragment over unread parameter
    Given a URL containing jumpTo=unread and a reply-key fragment
    When the page opens
    Then the reply-key fragment determines viewport destination
    And unread navigation does not override the destination

  Scenario: Fall back on unread request without prior boundary
    Given an unread request without an available prior read boundary
    When navigation executes
    Then the viewport targets the discussion heading

  Scenario: Target latest reply when caught up
    Given an unread request with an available boundary and no newer replies
    When navigation executes
    Then the viewport targets the last reply or the empty discussion heading

  Scenario: Cancel deferred navigation on interaction
    Given an unread request awaiting session or read state
    When the reader scrolls or moves focus before state resolves
    Then deferred state resolution does not move the viewport or focus

  Scenario: Prevent regression of persisted read boundary
    Given a persisted read boundary later than current page entry
    When the page records entry
    Then the persisted boundary does not regress
```
