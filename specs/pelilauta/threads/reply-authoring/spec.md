---
status: live
---

# Reply Authoring

## Blueprint

### Context

Pelilauta threads display discussion topics and their chronological replies. Reply authoring
provides the docked chrome composer for signed-in members to post and edit replies on a
thread, while anonymous visitors receive a sign-in prompt at the end of the discussion.

### Architecture

`@pelilauta/threads/client/ThreadChatBar.svelte` mounts into `Base.astro`'s `authoring` slot
in `CnAppChrome`, wrapping `@design-system/components/CnChatBar.svelte`.

`ThreadChatBar` handles both new replies and edits. When a member edits an existing reply,
`@pelilauta/stores/replyEditing` coordinates the active edit target with the bar. Submissions
call `submitReply` to create a reply and `updateReply` to save an edit.


### Constraints

An in-progress reply draft is preserved when an edit borrows the bar, and restored when
that edit finishes or cancels.

A failed submission retains the draft text and attached files, displaying the error
message above the input row.

The bar edits one reply at a time. Starting a new edit replaces any unsaved in-progress
edit.

The send action remains disabled while the draft is whitespace-only or while a submission
is in flight.

## Contract

### Definition of Done

- A signed-in member can submit a new reply or edit their existing reply from the docked
  chrome bar.
- Attached images preview in the supporting area before sending.
- A failed submission preserves draft text and attachments with an error notice.
- Restoring or canceling an edit returns any previous in-progress draft to the bar.

### Regression Guardrails

- Ending an edit restores keyboard focus to a visible element in the document; it does
  not target a closed or hidden menu item.
- Entering edit mode preserves any in-progress reply draft in memory without clearing it.

### Scenarios

```gherkin
Feature: Reply Authoring

  Scenario: Render composer for signed-in members
    Given a signed-in member viewing a thread
    When the page renders
    Then the chat bar renders in the chrome authoring slot

  Scenario: Omit composer for anonymous visitors
    Given an anonymous visitor viewing a thread
    When the page renders
    Then no chat bar renders in the chrome authoring slot

  Scenario: Submit a new reply
    Given a signed-in member with a reply draft in the chat bar
    When they submit the reply
    Then the draft clears
    And the new reply is posted to the thread

  Scenario: Failed submission preserves draft
    Given a signed-in member with a reply draft
    When the submission fails
    Then the draft text and attachments remain in the bar
    And an error message appears above the input row

  Scenario: Image attachments preview before submission
    Given a signed-in member who selects an image attachment
    When the file is selected
    Then the image previews above the input row

  Scenario: Empty draft cannot be sent
    Given a signed-in member with an empty or whitespace draft
    When viewing the chat bar
    Then the send action is disabled

  Scenario: Edit an existing reply
    Given a member who authored a reply in the discussion
    When they select edit on that reply
    Then the chat bar populates with the reply text
    And the bar indicates editing mode with a cancel action

  Scenario: Edit completion restores in-progress draft
    Given a member editing a reply with a prior draft held in memory
    When the edit is submitted or canceled
    Then the held draft returns to the chat bar
    And focus returns to the edit trigger control

  Scenario: Switch active edit
    Given a member currently editing a reply
    When they select edit on another reply
    Then the chat bar loads the second reply
    And the previous edit draft is discarded
```
