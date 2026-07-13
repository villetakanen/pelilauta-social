# PBI-065: Multi-Owner Notification Skip

## Goal
Ensure reply notifications skip ALL thread owners, not just the first one.

## Problem
When a thread has multiple owners and one of them posts a reply, the current logic only checks if `thread.owners[0] === author`. If the reply author is `thread.owners[1]` (or later), they would incorrectly trigger a notification to `thread.owners[0]`.

## Root Cause
- [add-reply.ts line 114](file:///src/pages/api/threads/add-reply.ts#L114): `if (thread.owners[0] !== author)`
- [addReply.ts line 120](file:///src/firebase/client/threads/addReply.ts#L120): `if (thread.owners[0] === author) return;`

Both only check the first owner.

## Solution
Check if the author is in the owners array, not just the first position.

### Changes Required

#### [MODIFY] `src/pages/api/threads/add-reply.ts`

**Current (line 114):**
```typescript
if (thread.owners[0] !== author) {
```

**New:**
```typescript
if (!thread.owners.includes(author)) {
```

#### [MODIFY] `src/firebase/client/threads/addReply.ts`

**Current (line 120):**
```typescript
if (thread.owners[0] === author) return;
```

**New:**
```typescript
if (thread.owners.includes(author)) return;
```

## Acceptance Criteria
- [ ] Thread owner (any position) replying to their own thread does NOT receive self-notification
- [ ] Non-owner replying still triggers notification to thread owners
- [ ] Both server API and client-side paths updated consistently

## Verification
1. Create a thread with multiple owners (if UI supports) or via Firestore console
2. Have `owners[1]` post a reply
3. `owners[0]` should NOT receive notification (author is a co-owner)
4. Have a non-owner post a reply
5. `owners[0]` SHOULD receive notification

## References
- Spec: `plans/notification-system/spec.md`
