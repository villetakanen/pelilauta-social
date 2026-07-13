# Feature: Reactions System

> **Status:** Draft (Spec for Triage)
> **Layer:** CSR + API

## Blueprint

### Context

The reactions system enables users to "love" content (threads, replies, sites) and triggers notifications to content owners. It's the core mechanism for social engagement beyond replies.

**Dependency:** The notification system depends on this component for `*.loved` notification types.

### Architecture

```mermaid
flowchart LR
    subgraph Client
        RB[ReactionButton.svelte]
        Store[persistentAtom per key]
    end
    
    subgraph API
        ReactAPI[/api/reactions]
    end
    
    subgraph Firestore
        ReactionsCol[reactions collection]
        NotifCol[notifications collection]
    end
    
    RB -->|toggleReaction| ReactAPI
    ReactAPI -->|toggle love array| ReactionsCol
    ReactAPI -->|if added| NotifCol
    ReactionsCol -->|getDoc on mount| Store
    Store --> RB
```

#### Key Files

| File | Purpose |
|------|---------|
| `src/components/svelte/app/ReactionButton.svelte` | Universal love button component |
| `src/pages/api/reactions/index.ts` | Server API for toggling reactions |
| `src/firebase/client/reactions.ts` | Client helper to call API |
| `src/schemas/ReactionsSchema.ts` | Zod schema for reactions data |
| `src/stores/threadsStore/reactions.ts` | Reactions store helpers |

#### Data Model

```typescript
// reactions/{entityKey}
interface Reactions {
  subscribers: string[];  // UIDs to notify when loved
  love?: string[];        // UIDs who have loved
  // Future: bookmark?: string[];
}
```

#### Component Props

```typescript
interface ReactionButtonProps {
  key: string;           // Entity key (thread.key, reply.key, site.key)
  target: 'thread' | 'site' | 'reply';  // For notification type
  title?: string;        // Human-readable title for notification
  type?: 'love';         // Reaction type (currently only 'love')
  small?: boolean;       // Size variant
}
```

### Usage Patterns

| Context | Current Usage | `title` Prop |
|---------|---------------|--------------|
| Thread | ✅ Correct | Thread title passed |
| Site | ✅ Correct | Site name passed |
| Reply | ⚠️ **Missing** | `title` not passed → raw key in notification |

### Known Gaps / Issues

> [!WARNING]

1. **Reply key format**: For replies, key is `{threadKey}-{replyKey}` but notification display doesn't handle this compound key well
2. **No title prop on reply usage**: `ReplyArticle.svelte` doesn't pass title to ReactionButton
3. **Subscribers init**: When reactions doc is created, it only includes content owners — previous commenters are not subscribed

### Confirmed Bugs

> [!CAUTION]

#### Bug: Reply reactions missing title

**Location:** [ReplyArticle.svelte line 49](file:///Users/ville.takanen/dev/pelilauta-17/src/components/svelte/discussion/ReplyArticle.svelte#L49)

**Current:**
```svelte
<ReactionButton target="reply" small key={reply.key}></ReactionButton>
```

**Should be:**
```svelte
<ReactionButton 
  target="reply" 
  small 
  key={reply.key} 
  title={reply.markdownContent?.substring(0, 50)}
/>
```

---

## Contract

### Definition of Done

- [ ] Spec committed to `plans/reactions/spec.md`
- [ ] Reply reaction button passes title prop
- [ ] All reaction usages audited for correct props

### Scenarios

**Scenario: Love a Thread**
- Given a logged-in user viewing a thread
- When user clicks the love button
- Then user is added to `reactions/{threadKey}.love` array
- And thread owner receives `thread.loved` notification with thread title

**Scenario: Love a Reply**
- Given a logged-in user viewing a reply
- When user clicks the love button  
- Then user is added to `reactions/{threadKey}-{replyKey}.love` array
- And reply owner receives `reply.loved` notification
- ⚠️ Current: Notification shows raw key instead of snippet

**Scenario: Un-love Content**
- Given a user who has loved content
- When user clicks the love button again
- Then user is removed from love array
- And NO notification is sent (removals don't notify)
