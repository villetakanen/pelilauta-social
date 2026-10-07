---
status: live
---

# Inbox

## Blueprint

### Context

The inbox helps signed-in readers return to activity addressed to them and engage
with its content.
Notifications are transient messages without durable history.

### Architecture

`apps/pelilauta/src/pages/inbox/index.astro` embeds `Library.astro` and mounts
`@pelilauta/library/client/inbox/InboxApp.svelte`. `NotificationItem.svelte`,
browser state, and acknowledgment and deletion actions reside beside the component
under `apps/pelilauta/src/library/client/inbox/`.

`@pelilauta/base/client/InboxNavigationButton.svelte` supplies the shared inbox
entry. The component reads the unread count from the inbox browser state.

`apps/pelilauta/src/base/server/notifications/` implements retention alongside
delivery. The inbox capability governs retention and acknowledgment;
`specs/pelilauta/notifications/spec.md` governs recipients and event payloads.

`specs/design-system/chrome-actions/notification-action/spec.md` governs the badge.
`specs/pelilauta/threads/read-state/spec.md` governs thread navigation.

### Constraints

The inbox retains the newest 30 undeleted notifications per recipient, ordered by
`createdAt` descending. Retention deletes older notifications from Firestore,
including unread notifications. Each notification delivery enforces the limit
whether the recipient has the inbox open, has left it, or is offline. Opening the
inbox also deletes any existing excess notifications. Equal timestamps may retain
either notification at the boundary.

The page displays every retained notification. The badge counts unread
notifications across this set.

Opening a notification content link marks that notification read. Opening the
inbox or viewing the content elsewhere does not acknowledge the notification.
Notification acknowledgment remains independent of thread read state.

Individual deletion operates in both read states. Mark all read and Delete all
apply to retained notifications at activation, without selection or
confirmation. Individual deletion requires no confirmation. Notifications
arriving after activation remain unaffected by the bulk action.

Inbox reads, acknowledgment, deletion, and retention affect only the active
recipient. A failed write must not display completed acknowledgment or deletion.
An acknowledgment failure does not prevent navigation to the content.

## Contract

### Definition of Done

- Readers can follow notification content, acknowledge one notification or all
  notifications, and delete one notification or all notifications.
- Retention removes excess records from storage rather than hiding them from the page.

### Scenarios

```gherkin
Feature: Inbox

  Scenario: Follow notification content
    Given an unread notification with a content link
    When the recipient follows that link
    Then the destination opens and the notification becomes read

  Scenario Outline: Resolve a notification destination
    Given a notification of type <type> with target key <key>
    When the inbox renders its content link
    Then the destination is <destination>

    Examples:
      | type           | key          | destination                    |
      | thread.reply   | thread/reply | /threads/thread#reply          |
      | reply.loved    | thread/reply | /threads/thread#reply          |
      | thread.reply   | thread       | /threads/thread#discussion     |
      | thread.loved   | thread       | /threads/thread                |
      | site.loved     | site         | /sites/site                    |
      | site.invited   | site         | /sites/site                    |
      | handout.update | site/handout | /sites/site/handouts/handout    |

  Scenario: Render a notification without a supported destination
    Given a notification of type thread or page.loved
    When the inbox renders the notification
    Then its target title appears without a content link
    And explicit acknowledgment and deletion remain available

  Scenario: Open content outside the inbox
    Given an unread notification about a thread
    When the recipient opens that thread outside the notification link
    Then the notification remains unread

  Scenario: Reconcile excess notifications
    Given a recipient with 35 stored notifications with distinct creation times
    When the recipient opens the inbox
    Then the oldest 5 notifications are deleted from Firestore
    And the page displays the remaining 30 newest first

  Scenario: Retain a new arrival
    Given a recipient with 30 retained notifications
    And the recipient is offline
    When a newer notification arrives
    Then the oldest notification is deleted from Firestore regardless of read state
    And the new notification appears first when the recipient next opens the inbox

  Scenario: Count unread retained notifications
    Given 30 retained notifications whose oldest 12 are unread
    When the inbox and badge render
    Then the page displays all 30 notifications
    And the badge receives an unread count of 12

  Scenario: Delete an unread notification
    Given an unread notification
    When the recipient activates its delete action
    Then the notification is deleted from Firestore without confirmation
    And it disappears from the inbox and unread count

  Scenario: Mark all read
    Given retained notifications in both read states
    When the recipient activates Mark all read
    Then all notifications present at activation become read without confirmation
    And none are deleted

  Scenario: Delete all
    Given retained notifications in both read states
    When the recipient activates Delete all
    Then all notifications present at activation are deleted from Firestore without confirmation
    And the inbox and unread count become empty unless new notifications arrive
```
