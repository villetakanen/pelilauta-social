---
status: live
---

# Notifications

## Blueprint

### Context

Notifications encourage participation by telling readers when someone responds to
their contributions, appreciates their content, or includes them in shared play.
Delivery serves engagement and is not critical to the underlying data operation.

### Architecture

Shared notification delivery and retention reside under
`apps/pelilauta/src/base/server/notifications/`, reached through
`@pelilauta/base/server/notifications/`. Delivery writes to the Firestore
`notifications` collection.

Event producers remain with threads, reactions, and sites, using the shared
delivery capability. `apps/pelilauta/src/pages/api/notifications/send.ts` provides
the HTTP entry point. `apps/pelilauta/src/schemas/NotificationSchema.ts` defines
the payload shared across producers and delivery.

`specs/pelilauta/inbox/spec.md` governs destinations, acknowledgment, deletion, and
retention.

### Constraints

The following events trigger delivery after the underlying mutation succeeds.
Recipients resolve from the resulting content state. Each recipient receives at most one
notification per delivery, and the actor never receives a notification for that action.
An actor who is one of several owners does not suppress delivery to the other owners.

| Type | Event | Recipients before excluding the actor | Target key |
| :--- | :--- | :--- | :--- |
| `thread.reply` | A reply is created. | All thread owners receive the notification. | `thread.key/reply.key` |
| `thread.loved` | A love is added to a thread. | All thread owners receive the notification. | `thread.key` |
| `reply.loved` | A love is added to a reply. | All reply owners receive the notification. | `thread.key/reply.key` |
| `site.loved` | A love is added to a site. | All site owners receive the notification. | `site.key` |
| `page.loved` | A love is added to a page. | All owners of the containing site receive the notification. | `site.key/page.key` |
| `site.invited` | A player is added to a site. | The added player receives the notification. | `site.key` |
| `handout.update` | A handout is created or updated. | All readers of the resulting handout receive the notification. | `site.key/handout.key` |

Owners are the entries in the applicable `owners` list. Reaction subscribers do not
determine recipients. `site.invited` announces completed player addition and requires
no acceptance. Removing a love produces no notification. The bare `thread` type has no
delivery trigger. Handout readers are entries in `handout.readers`; an absent or
empty list yields no recipients. Site ownership alone does not add a recipient.

Each distinct reply creates a separate notification per recipient. A repeat delivery for
the same reply refreshes its notification instead of creating a duplicate. Loves refresh
one notification per type, target, actor, and recipient. Invitations refresh one per
site and recipient; handout updates refresh one per handout and recipient. Handout
identity includes the containing site.

New notifications start unread. A refresh updates the actor, display content, and
creation time, and sets `read` to false.
A later qualifying event can recreate a deleted notification. Notification document
identifiers preserve these identities without interpreting a target key's slash as a
Firestore document path.

These identity guarantees apply to notifications produced under this contract.
Legacy notifications remain unmigrated and may coexist with a new notification
for the same content until inbox deletion or retention removes them.

Delivery is best-effort: notification failure does not roll back the mutation or report
that mutation as failed. Failure for one recipient does not prevent delivery attempts to
the others. Delivery provides no retry or eventual-arrival guarantee.

## Contract

### Definition of Done

- Successful events attempt delivery to the specified recipients with the target keys above, subject to inbox retention.
- Controlled successful notification writes satisfy the scenarios below; controlled write failures leave the underlying action successful.

### Scenarios

```gherkin
Feature: Notifications

  Scenario: Notify the other thread owners
    Given a thread whose owners are A and B
    When A creates a reply and notification writes succeed
    Then B receives a thread.reply notification for that reply
    And A receives no notification

  Scenario: Keep separate replies distinct
    Given a thread owned by A
    When B creates replies R1 and R2 and notification writes succeed
    Then A receives two notifications with the respective thread/reply target keys

  Scenario: Resolve love recipients from current owners
    Given an entry whose owners are A and B and whose reaction subscribers are A and C
    When D adds love to the thread, reply or site and notification writes succeed
    Then A and B receive the corresponding love notification
    And C and D receive no notification

  Scenario: Notify site owners about page love
    Given a page owned by P in a site whose owners are A and B
    And P is not a site owner
    When C loves the page and notification writes succeed
    Then A and B receive page.loved notifications with the site/page target key
    And P and C receive no notification

  Scenario: Refresh a repeated love
    Given A has read a notification about B loving an entry
    When B removes that love and adds it again and notification writes succeed
    Then A retains one notification for that actor and target
    And the notification is unread with the latest event time

  Scenario: Notify handout readers
    Given a handout whose resulting readers are A and B
    When A creates or updates the handout and notification writes succeed
    Then B receives an unread handout.update notification
    And A receives no notification

  Scenario: No explicit handout readers
    Given a handout with an absent or empty readers list
    When the handout is created or updated
    Then no handout notification is produced even if the site has other owners

  Scenario: Preserve an existing legacy notification
    Given a legacy notification with an identity outside this contract
    When an event produces a notification for the same content under this contract
    Then delivery does not migrate the legacy notification
    And both records remain subject to inbox retention

  Scenario: Announce completed player addition
    Given A adds B to a site
    When the player addition and notification write succeed
    Then B receives a site.invited notification
    And no acceptance action is required

  Scenario: Ignore a failed player addition
    When adding a player to a site fails
    Then no site.invited notification is produced for that attempt

  Scenario: Continue after a notification write fails
    Given a successful content mutation with recipients A and B
    When the notification write for A fails
    Then delivery is still attempted for B
    And the content mutation remains successful
```
