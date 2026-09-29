---
status: live
---

# Thread Reading

## Blueprint

### Context

A thread joins an opening post to its discussion. Readers open and share the conversation from the initial response without JavaScript.

### Architecture

`apps/pelilauta/src/pages/threads/[threadKey]/index.astro` composes the thread under `@layouts/Base.astro`. Server preparation resolves the opening post and public attribution before rendering.

- [Replies](replies/spec.md) governs reply content, ordering, and live enhancement.
- [Read State](read-state/spec.md) governs opening-based read status and navigation.
- [Reply Authoring](reply-authoring/spec.md) governs the docked composer and editing.

The page composes [content containers](../../design-system/content-container-layouts/spec.md), [content area](../../design-system/content-area/spec.md), and [typography](../../design-system/typography/spec.md) within [App Main](../../design-system/app-main/spec.md) and [App Chrome](../../design-system/app-chrome/spec.md).

### Constraints

Public attribution uses only the public name, profile destination, and avatar. The public document excludes private profile fields and reader-specific state. Rendering consumes records from the existing thread read path without changing eligibility. Publication, edit, and activity dates use `createdAt`, a later `updatedAt`, and `flowTime`, respectively. Displayed dates identify their meaning and use `<time datetime>`. Missing dates remain unset.

The document title and description identify the opening post. The canonical URL identifies the thread without query parameters or fragments. Incoming thread URLs continue to resolve.

The initial response includes `DiscussionForumPosting` and `Comment` data corresponding to visible contributions and satisfying Google's [discussion forum requirements](https://developers.google.com/search/docs/appearance/structured-data/discussion-forum) without critical Rich Results Test errors. Contributions missing required information remain readable but omit structured-data items. An ineligible opening post omits the entire discussion graph. Metadata never fabricates authors or dates. Metadata serializes user text without executable markup.

## Contract

### Definition of Done

- A visitor reads and attributes the opening post before browser scripts run.
- Readers distinguish publication, editing, and activity dates.
- Shared thread links identify one canonical conversation, including links carrying navigation parameters.
- Discussion structured data describes the conversation visible in the initial HTML.
- The page presents the opening post before its discussion within the shared layout.

### Regression Guardrails

- Delayed or failed session initialization does not replace readable content with a loader.

### Scenarios

```gherkin
Feature: Thread Reading

  Scenario: Read the opening post without JavaScript
    Given a public thread with a known public author, an available public profile destination, and a publication date
    When an anonymous reader opens the thread with JavaScript disabled
    Then the title, formatted body, attachments, author link, channel, and publication date render

  Scenario: Distinguish activity from publication
    Given a thread published on one day and active on a later day
    When the dates render
    Then the publication date identifies opening-post creation
    And the displayed activity date indicates activity

  Scenario: Read a post without an author profile
    Given a public thread without a resolvable public author profile
    When the thread renders
    Then the opening post remains readable
    And attribution displays the localized anonymous-author label
    And no account identifier appears as an author name

  Scenario: Share a navigation URL
    Given a thread URL with jumpTo=unread and a discussion fragment
    When the initial document renders
    Then its canonical URL identifies the thread without navigation parameters or fragments

  Scenario: Inspect discovery metadata
    Given a public thread with attributed replies and known dates
    When the initial HTML renders
    Then valid DiscussionForumPosting data identifies the opening post
    And Comment entries match rendered replies and destinations
    And user text remains data when containing HTML or script delimiters

  Scenario: Preserve unknown publication dates
    Given persisted content with a missing or invalid creation date
    When the server prepares the document
    Then the document omits the publication date
    And the server omits the structured-data item
    And the content remains readable

  Scenario: Omit unknown structured-data authors
    Given a rendered contribution without a resolvable public author
    When the server prepares discovery metadata
    Then structured data omits the entire contribution item
    And an opening post without a resolvable author omits the entire discussion graph
    And visible anonymous attribution renders

  Scenario: Compose the thread page
    Given a thread with replies and an active signed-in reader
    When the page renders
    Then the opening post precedes the discussion in document order
    And page content mounts in the shared main frame through content containers
    And the composer mounts in the chrome authoring slot
```
