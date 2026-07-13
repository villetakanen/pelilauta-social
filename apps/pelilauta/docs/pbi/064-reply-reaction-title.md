# PBI-064: Reply Reaction Missing Title

## Goal
Fix `reply.loved` notifications showing raw document key instead of human-readable content snippet.

## Problem
When a user loves a reply, the notification displays the raw Firestore key (e.g., `2AMjDOutbn0A38ZXMdsx`) instead of a content preview.

## Root Cause
- [ReplyArticle.svelte line 49](file:///src/components/svelte/discussion/ReplyArticle.svelte#L49) does not pass `title` prop to `ReactionButton`
- The reactions API falls back to `targetKey` when `title` is undefined

## Solution
Pass a title prop with a truncated snippet of the reply content.

### Changes Required

#### [MODIFY] `src/components/svelte/discussion/ReplyArticle.svelte`

**Current (line 49):**
```svelte
<ReactionButton target="reply" small key={reply.key}></ReactionButton>
```

**New:**
```svelte
<ReactionButton 
  target="reply" 
  small 
  key={reply.key} 
  title={reply.markdownContent?.substring(0, 50)}
/>
```

## Acceptance Criteria
- [ ] Loving a reply creates notification with content snippet as title
- [ ] Snippet is truncated to reasonable length (≤50 chars)
- [ ] Existing notifications with raw keys still render (backwards compatible)

## Verification
1. Open two browser sessions (User A, User B)
2. User A posts a reply to any thread
3. User B loves User A's reply
4. User A checks inbox → notification should show reply content snippet, not raw key

## References
- Spec: `plans/reactions/spec.md`
- Spec: `plans/notification-system/spec.md`
