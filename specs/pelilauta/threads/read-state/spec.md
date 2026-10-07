---
status: live
---

# Thread Read State and Navigation

## Blueprint

### Context

A signed-in reader's thread list tells them which threads carry activity they have not seen, and a link from it lands them where they left off.

### Architecture

`@pelilauta/threads/client/DiscussionSection.svelte` records the opening through `@pelilauta/stores/subscription` and resolves the jump target. Links into a thread use `#discussion`, `/threads/{threadKey}#{replyKey}`, or `?jumpTo=<timestamp>#discussion`.

### Constraints

A thread is read once the signed-in reader opens it. Scrolling, dwell and live replies arriving while the page is open do not count, and anonymous readers write nothing. Read-state failure never blocks reading.

A signed-in reader's `jumpTo` timestamp targets the last reply created at or before it, the heading when none is, resolved from the URL alone. A reply fragment takes precedence. Anonymous readers and values that are not a positive number land where the fragment says.

## Contract

### Definition of Done

- Opening a thread marks it read for the active account, and for no other.
- A timestamped link lands a signed-in reader on the last reply they could have seen.
- Anchors and permalinks work without JavaScript.

### Scenarios

```gherkin
Feature: Thread Read State and Navigation

  Scenario: Open a thread
    Given a signed-in reader and a thread with activity after their last opening
    When the reader opens the thread
    Then the thread is read for that reader without scrolling

  Scenario: Land on a timestamped position
    Given replies created at 10 and 20
    When a signed-in reader enters with jumpTo=15#discussion
    Then the viewport targets the reply created at 10

  Scenario: Open a reply permalink without JavaScript
    Given a URL with a reply-key fragment
    When the reader opens the page with JavaScript disabled
    Then the browser scrolls to that reply
```
