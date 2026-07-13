# Feature: Content Tracking

> **Status:** Live
> **Layer:** CSR Only

## Blueprint

### Context
Users need to identify new or updated content on the platform to stay engaged without re-reading recognized items. "Content Tracking" (formerly referred to as "Unread Notifications" or "Subscriptions") provides visual cues on the front page and thread lists indicating which threads have recent activity that the user has not yet seen.

**Progressive Enhancement:** This feature is strictly for **logged-in users**. Anonymous users will view content without unread indicators or read-state tracking. The application must function perfectly without this data.

### Architecture
The feature relies on comparing the `flowTime` (last updated timestamp) of an entity (Thread/Post) against a user-specific "Last Seen" timestamp.

- **Data Models:**
    - `src/schemas/SubscriberSchema.ts`: Defines the `Subscription` object stored in Firestore.
        - `seenEntities`: A map of `entityKey` -> `timestamp`.
        - `allSeenAt`: A global timestamp for "Mark All Read".

- **Client Store:**
    - `src/stores/session/subscriber.ts`: Manages the `$subscriber` store.
        - `hasSeen(entityKey, flowTime)`: Computed function returning `true` if the user has seen the content.

- **UI Components:**
    - `src/components/svelte/frontpage/CardSubscription.svelte`: Controls the visual "notify" indicator on thread cards.
    - `src/components/svelte/threads/ThreadSubscriber.svelte`: Controls the "notify" class on thread headers/details.

- **API Contracts:**
    - Firestore Sync: The client subscribes to `subscriptions/{uid}`.
    - Updates: Client writes to `subscriptions/{uid}` to update `seenEntities` when opening a thread.
    - **Routing:** "Scroll to Unread" is triggered via a URL Query Parameter (`?jumpTo=unread`).
        - Main Link (Card Title) -> Opens Thread (Top).
        - Discussion Link (Reply Count) -> Opens Thread with `?jumpTo=unread`.
    - **Note:** To implement "Scroll to Unread", the client must capture the *current* `seenEntities` timestamp on mount, use it to find the target element, and *then* update the timestamp to `Now`.

### Anti-Patterns
- **Confusion with Inbox:** Content Tracking is *passive* (visual indicators). It should not be confused with "Inbox Notifications" (push messages, alerts for replies).
- **Server-Side Unread Counts:** Do not store "Is Unread" as a boolean in the database. It is a computed state derived from `Timestamp(Content) > Timestamp(UserSeen)`.
- **Flash of Unread Content:** Indicators must not default to "Unread" while the subscription exists but is loading. They should default to "Read" (hidden) or a neutral state to prevent flashing, especially since this is a progressive enhancement.

## Contract

### Definition of Done
- [x] Spec is committed to `plans/content-tracking/spec.md`.
- [x] Feature is correctly named "Content Tracking" in documentation to distinguish from Notifications.
- [x] Logic correctly handles `allSeenAt` for bulk read status.
- [x] Logic correctly falls back to `seenEntities` for individual threads.

### Regression Guardrails
- **Offline Support:** The `$subscriber` store is persistent (`nanostores/persistent`), ensuring read states are available immediately on reload.
- **Null Safety:** `hasSeen` must return `false` (unread) or fail gracefully if the subscription store is not yet loaded, but should typically default to "read" or "unread" consistent with UX goals (currently seems to default to unread).
- **Progressive Enhancement:** Anonymous users must not trigger subscription logic or see errors. Components accessing `$subscriber` or `hasSeen` must check for an active user session first.

### Scenarios

**Scenario: New Content Indicator**
- Given a user has seen a thread at `T1`
- When a new reply is added to the thread at `T2` (where `T2 > T1`)
- Then the Thread Card on the front page should display the "Unread" indicator

**Scenario: Reading a Thread**
- Given a thread has an "Unread" indicator
- When the user navigates to the thread
- Then the client updates `seenEntities[threadKey]` to `Now`
- And the "Unread" indicator is removed

**Scenario: Mark All Read**
- Given the user has multiple unread threads
- When the user triggers "Mark All Read"
- Then the client updates `allSeenAt` to `Now`
- And all threads with `flowTime < Now` are considered seen

**Scenario: Scroll to First Unread**
- Given a thread has new replies since the user last visited
- And the user navigates via the "Discussion/Reply Count" link (`?jumpTo=unread`)
- When the page loads
- Then the client retrieves the `lastSeen` timestamp
- And identifies the first reply with `createdAt > lastSeen`
- And scrolls that reply into view

**Scenario: Anonymous User**
- Given a user is not logged in (anonymous)
- When the user visits any page
- Then NO subscription data is loaded
- And NO "unread" indicators are calculated or displayed
- And NO writes to Firestore are attempted
- And `$effect` blocks reliant on `uid` do not execute
